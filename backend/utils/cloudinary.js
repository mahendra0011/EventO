const { Readable } = require('stream');
const { v2: cloudinary } = require('cloudinary');

const CLOUDINARY_ROOT_FOLDER = process.env.CLOUDINARY_ROOT_FOLDER || 'evento';

const getCloudinaryUrlConfig = () => {
  if (!process.env.CLOUDINARY_URL) return null;

  try {
    const parsedUrl = new URL(process.env.CLOUDINARY_URL);
    return {
      cloud_name: parsedUrl.hostname,
      api_key: decodeURIComponent(parsedUrl.username),
      api_secret: decodeURIComponent(parsedUrl.password)
    };
  } catch {
    return null;
  }
};

const cloudinaryUrlConfig = getCloudinaryUrlConfig();

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
} else if (cloudinaryUrlConfig) {
  cloudinary.config({
    ...cloudinaryUrlConfig,
    secure: true
  });
} else {
  cloudinary.config({ secure: true });
}

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
]);

const DOCUMENT_MIME_TYPES = new Set([
  ...IMAGE_MIME_TYPES,
  'application/pdf'
]);

const COMMUNITY_MIME_TYPES = new Set([
  ...IMAGE_MIME_TYPES,
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime'
]);

const MB = 1024 * 1024;

const UPLOAD_CONTEXTS = {
  'event-banner': {
    label: 'event banner',
    maxFiles: 1,
    maxBytes: 8 * MB,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    folderParts: ({ userId }) => ['events', 'banners', userId || 'unassigned'],
    resourceType: 'image',
    roles: ['host', 'admin']
  },
  'event-document': {
    label: 'event document',
    maxFiles: 3,
    maxBytes: 10 * MB,
    allowedMimeTypes: DOCUMENT_MIME_TYPES,
    folderParts: ({ userId }) => ['events', 'documents', userId || 'unassigned'],
    resourceType: 'auto',
    roles: ['host', 'admin']
  },
  'organizer-document': {
    label: 'organizer document',
    maxFiles: 3,
    maxBytes: 10 * MB,
    allowedMimeTypes: DOCUMENT_MIME_TYPES,
    folderParts: ({ userId }) => ['organizers', userId || 'pending-documents', 'documents'],
    resourceType: 'auto',
    roles: ['host', 'admin'],
    allowPublicUpload: true
  },
  'community-media': {
    label: 'community media',
    maxFiles: 3,
    maxBytes: 8 * MB,
    totalBytes: 9 * MB,
    allowedMimeTypes: COMMUNITY_MIME_TYPES,
    folderParts: ({ eventId }) => ['community', 'events', eventId || 'general'],
    resourceType: 'auto',
    roles: ['user', 'host', 'admin']
  }
};

const sanitizeFolderSegment = (value, fallback = 'items') => {
  const segment = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return segment || fallback;
};

const getCloudinaryConfig = () => cloudinary.config();

const isCloudinaryConfigured = () => {
  const config = getCloudinaryConfig();
  return Boolean(
    (config.cloud_name && config.api_key && config.api_secret) ||
    (cloudinaryUrlConfig?.cloud_name && cloudinaryUrlConfig?.api_key && cloudinaryUrlConfig?.api_secret) ||
    (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
  );
};

const getUploadContext = (context) => UPLOAD_CONTEXTS[context] || null;

const buildUploadFolder = (contextConfig, options = {}) => {
  const root = sanitizeFolderSegment(options.rootFolder || CLOUDINARY_ROOT_FOLDER, 'evento');
  const parts = typeof contextConfig.folderParts === 'function'
    ? contextConfig.folderParts(options)
    : contextConfig.folderParts;

  return [root, ...parts.map((part) => sanitizeFolderSegment(part))]
    .filter(Boolean)
    .join('/');
};

const getMediaType = (mimeType = '') => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'document';
};

const validateFileForContext = (file, contextConfig, index = 0) => {
  if (!file) {
    const error = new Error('No file uploaded');
    error.statusCode = 400;
    throw error;
  }

  if (!contextConfig.allowedMimeTypes.has(file.mimetype)) {
    const error = new Error(`${contextConfig.label} ${index + 1} has an unsupported file type`);
    error.statusCode = 400;
    throw error;
  }

  if (file.size > contextConfig.maxBytes) {
    const error = new Error(`${contextConfig.label} ${index + 1} must be ${Math.round(contextConfig.maxBytes / MB)}MB or smaller`);
    error.statusCode = 400;
    throw error;
  }
};

const uploadBufferToCloudinary = async (file, context, options = {}) => {
  const contextConfig = getUploadContext(context);
  if (!contextConfig) {
    const error = new Error('Invalid upload context');
    error.statusCode = 400;
    throw error;
  }

  if (!isCloudinaryConfigured()) {
    const error = new Error('Cloudinary is not configured');
    error.statusCode = 503;
    throw error;
  }

  validateFileForContext(file, contextConfig, options.index || 0);

  const folder = buildUploadFolder(contextConfig, options);
  const uploadOptions = {
    folder,
    resource_type: contextConfig.resourceType,
    use_filename: true,
    unique_filename: true,
    overwrite: false
  };

  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, response) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(response);
    });

    Readable.from(file.buffer).pipe(uploadStream);
  });

  return {
    type: getMediaType(file.mimetype),
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    mimeType: file.mimetype,
    name: String(file.originalname || result.original_filename || `${contextConfig.label}-${Date.now()}`).slice(0, 180),
    size: result.bytes || file.size,
    width: result.width,
    height: result.height,
    format: result.format,
    folder
  };
};

module.exports = {
  UPLOAD_CONTEXTS,
  getUploadContext,
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
  validateFileForContext
};
