const multer = require('multer');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const {
  getUploadContext,
  uploadBufferToCloudinary
} = require('../utils/cloudinary');

const MAX_UPLOAD_FILE_BYTES = 10 * 1024 * 1024;
const MAX_UPLOAD_FILES = 3;

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_FILE_BYTES,
    files: MAX_UPLOAD_FILES
  }
}).array('files', MAX_UPLOAD_FILES);

const runUploadMiddleware = (req, res, next) => {
  uploadMiddleware(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'Each file must be 10MB or smaller'
        : 'Upload could not be processed';
      res.status(400).json({ message });
      return;
    }

    res.status(400).json({ message: error.message || 'Upload could not be processed' });
  });
};

const assertUploadAccess = async (req, context, contextConfig, { publicUpload = false } = {}) => {
  if (publicUpload) {
    if (contextConfig.allowPublicUpload) return;
    const error = new Error('This upload type requires login');
    error.statusCode = 401;
    throw error;
  }

  if (!req.user) {
    const error = new Error('Login is required to upload files');
    error.statusCode = 401;
    throw error;
  }

  if (!contextConfig.roles.includes(req.user.role)) {
    const error = new Error('You are not allowed to upload this file type');
    error.statusCode = 403;
    throw error;
  }

  if (context !== 'community-media') return;

  const { eventId } = req.body;
  if (!eventId) {
    const error = new Error('Event is required for community media uploads');
    error.statusCode = 400;
    throw error;
  }

  const event = await Event.findById(eventId);
  if (!event) {
    const error = new Error('Event not found');
    error.statusCode = 404;
    throw error;
  }

  if (req.user.role === 'admin') return;

  const isHost = req.user.role === 'host' && event.organizer.toString() === req.user.id;
  if (isHost) return;

  const booking = await Booking.findOne({
    event: eventId,
    user: req.user.id,
    status: 'confirmed'
  });

  if (!booking) {
    const error = new Error('Only the event host or confirmed attendees can upload community media');
    error.statusCode = 403;
    throw error;
  }
};

const uploadFiles = ({ publicUpload = false } = {}) => async (req, res) => {
  try {
    const { context } = req.params;
    const contextConfig = getUploadContext(context);

    if (!contextConfig) {
      return res.status(400).json({ message: 'Invalid upload context' });
    }

    await assertUploadAccess(req, context, contextConfig, { publicUpload });

    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length === 0) {
      return res.status(400).json({ message: 'Select at least one file to upload' });
    }

    if (files.length > contextConfig.maxFiles) {
      return res.status(400).json({ message: `You can upload up to ${contextConfig.maxFiles} file(s)` });
    }

    const totalBytes = files.reduce((sum, file) => sum + Number(file.size || 0), 0);
    if (contextConfig.totalBytes && totalBytes > contextConfig.totalBytes) {
      return res.status(400).json({ message: 'Selected files are too large in total' });
    }

    const userId = req.user?._id?.toString?.() || req.user?.id || '';
    const eventId = req.body.eventId || '';
    const uploadedFiles = [];

    for (const [index, file] of files.entries()) {
      const uploadedFile = await uploadBufferToCloudinary(file, context, {
        userId,
        eventId,
        index
      });
      uploadedFiles.push(uploadedFile);
    }

    res.status(201).json({
      message: 'Upload complete',
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : 'Upload failed',
      error: error.message
    });
  }
};

module.exports = {
  runUploadMiddleware,
  uploadFiles
};
