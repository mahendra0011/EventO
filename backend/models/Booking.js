const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
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
  numberOfTickets: {
    type: Number,
    required: [true, 'Number of tickets is required'],
    min: 1
  },
  ticketCategoryId: {
    type: mongoose.Schema.Types.ObjectId
  },
  ticketCategoryName: {
    type: String,
    trim: true
  },
  ticketPrice: {
    type: Number,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentAttempts: {
    type: Number,
    default: 0
  },
  refundStatus: {
    type: String,
    enum: ['none', 'requested', 'approved', 'rejected', 'processed'],
    default: 'none'
  },
  refundReason: {
    type: String,
    trim: true
  },
  refundRequestedAt: {
    type: Date
  },
  refundProcessedAt: {
    type: Date
  },
  disputeStatus: {
    type: String,
    enum: ['none', 'open', 'under_review', 'resolved', 'rejected'],
    default: 'none'
  },
  attendeeDetails: [{
    name: String,
    email: String,
    phone: String
  }],
  bookingDate: {
    type: Date,
    default: Date.now
  },
  confirmedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  checkInStatus: {
    type: String,
    enum: ['not_checked_in', 'checked_in', 'denied'],
    default: 'not_checked_in'
  },
  checkedInAt: {
    type: Date
  },
  checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  checkInNotes: {
    type: String,
    trim: true
  },
  notes: {
    type: String
  },
  otp: {
    type: String
  },
  otpExpires: {
    type: Date
  },
  isOtpVerified: {
    type: Boolean,
    default: false
  },
  usedOtps: [{
    type: String
  }],
  lastOtpSent: {
    type: Date
  }
});

bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ event: 1, status: 1 });
bookingSchema.index({ event: 1, checkInStatus: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
