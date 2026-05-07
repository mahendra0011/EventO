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
  otp: {
    type: String
  },
  otpExpires: {
    type: Date
  },
  lastOtpSent: {
    type: Date
  },
  usedOtps: [{
    type: String
  }],
  isOtpVerified: {
    type: Boolean,
    default: false
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
  notes: {
    type: String
  }
});

bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ event: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);