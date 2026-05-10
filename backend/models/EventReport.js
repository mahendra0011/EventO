const mongoose = require('mongoose');

const eventReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  reason: {
    type: String,
    enum: ['fake_event', 'suspicious_activity', 'misleading', 'payment_fraud', 'unsafe', 'other'],
    required: true
  },
  message: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['open', 'reviewed', 'dismissed'],
    default: 'open'
  },
  adminNotes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

eventReportSchema.index({ user: 1, event: 1 }, { unique: true });
eventReportSchema.index({ event: 1, status: 1 });

module.exports = mongoose.model('EventReport', eventReportSchema);
