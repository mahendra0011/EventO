const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Event description is required']
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  time: {
    type: String,
    required: [true, 'Event time is required']
  },
  venue: {
    type: String,
    required: [true, 'Event venue is required']
  },
  location: {
    type: String,
    required: [true, 'Event location is required']
  },
  category: {
    type: String,
    required: [true, 'Event category is required'],
    enum: ['Music', 'Sports', 'Technology', 'Business', 'Art', 'Food', 'Other']
  },
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
  },
  price: {
    type: Number,
    required: [true, 'Ticket price is required'],
    min: 0
  },
  totalTickets: {
    type: Number,
    required: [true, 'Total tickets is required'],
    min: 1
  },
  availableTickets: {
    type: Number,
    required: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update availableTickets before saving
eventSchema.pre('save', function(next) {
  if (this.isNew) {
    this.availableTickets = this.totalTickets;
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Event', eventSchema);
