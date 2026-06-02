const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  emoji: { type: String, required: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: { type: Date, default: Date.now }
});

const mediaSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    trim: true
  },
  resourceType: {
    type: String,
    trim: true
  },
  mimeType: {
    type: String,
    required: true
  },
  name: {
    type: String,
    trim: true,
    maxlength: [180, 'File name cannot exceed 180 characters']
  },
  size: {
    type: Number,
    min: 0
  }
}, { _id: true });

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isBroadcast: {
    type: Boolean,
    default: false
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [
      function requireMessageContent() {
        return !Array.isArray(this.media) || this.media.length === 0;
      },
      'Message content or media is required'
    ],
    default: '',
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  media: {
    type: [mediaSchema],
    default: []
  },
  // Reply reference
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  // Reactions
  reactions: [reactionSchema],
  // Edit tracking
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  // Mute (for host moderation)
  isMuted: {
    type: Boolean,
    default: false
  },
  mutedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for querying user conversations
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isBroadcast: 1, createdAt: -1 });
messageSchema.index({ event: 1, isPublic: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
