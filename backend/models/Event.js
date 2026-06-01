const mongoose = require('mongoose');

const ticketCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  availableQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  saleStart: {
    type: Date
  },
  saleEnd: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: true });

const eventDocumentSchema = new mongoose.Schema({
  label: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['venue_permission', 'license', 'ownership_proof', 'identity', 'other'],
    default: 'other'
  },
  url: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

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
    trim: true
  },
  eventType: {
    type: String,
    enum: ['Concert', 'Workshop', 'Stand-up Comedy', 'Conference', 'Sports', 'Festival', 'Screening', 'Other'],
    default: 'Other'
  },
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
  },
  price: {
    type: Number,
    required: function() {
      return !this.ticketCategories || this.ticketCategories.length === 0;
    },
    min: 0
  },
  totalTickets: {
    type: Number,
    required: function() {
      return !this.ticketCategories || this.ticketCategories.length === 0;
    },
    min: 1
  },
  availableTickets: {
    type: Number,
    required: function() {
      return !this.ticketCategories || this.ticketCategories.length === 0;
    }
  },
  ticketCategories: [ticketCategorySchema],
  budget: {
    type: Number,
    min: 0,
    default: 0
  },
  termsAndConditions: {
    type: String,
    trim: true
  },
  venuePermissionUrl: {
    type: String,
    trim: true
  },
  licenseDetails: {
    type: String,
    trim: true
  },
  ownershipProofUrl: {
    type: String,
    trim: true
  },
  eventDocuments: [eventDocumentSchema],
  onGroundContactName: {
    type: String,
    trim: true
  },
  onGroundContactPhone: {
    type: String,
    trim: true
  },
  crowdManagementPlan: {
    type: String,
    trim: true
  },
  gateInstructions: {
    type: String,
    trim: true
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
  isFeatured: {
    type: Boolean,
    default: false
  },
  isTrending: {
    type: Boolean,
    default: false
  },
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  moderationFlags: [{
    type: String,
    enum: ['fake_event', 'spam', 'copyright', 'inappropriate_content', 'fraud_organizer', 'other']
  }],
  moderationNotes: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  lifecycleStage: {
    type: String,
    enum: ['planning', 'under_review', 'approved', 'live', 'completed', 'settlement_pending', 'settled', 'cancelled'],
    default: 'under_review'
  },
  ticketSaleStatus: {
    type: String,
    enum: ['draft', 'pending_approval', 'live', 'paused', 'sold_out', 'completed'],
    default: 'pending_approval'
  },
  settlement: {
    status: {
      type: String,
      enum: ['not_started', 'pending', 'processing', 'settled', 'on_hold'],
      default: 'not_started'
    },
    platformFeeRate: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.1
    },
    taxRate: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },
    grossRevenue: {
      type: Number,
      default: 0
    },
    platformFee: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    netSettlement: {
      type: Number,
      default: 0
    },
    reference: {
      type: String,
      trim: true
    },
    settledAt: {
      type: Date
    },
    notes: {
      type: String,
      trim: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const clampNumber = (value, min, max) => Math.min(Math.max(Number(value || 0), min), max);

const getTicketCategoryTotals = (ticketCategories = []) => ticketCategories.reduce((totals, category) => ({
  quantity: totals.quantity + Number(category.quantity || 0),
  availableQuantity: totals.availableQuantity + Number(category.availableQuantity || 0)
}), { quantity: 0, availableQuantity: 0 });

// Set ticket totals before validation for new events
eventSchema.pre('validate', function(next) {
  if (!this.ticketCategories || this.ticketCategories.length === 0) {
    this.ticketCategories = [{
      name: 'General',
      price: this.price || 0,
      quantity: this.totalTickets || 1,
      availableQuantity: this.isNew ? (this.totalTickets || 1) : (this.availableTickets || this.totalTickets || 1),
      isActive: true
    }];
  }

  this.ticketCategories.forEach((category) => {
    category.quantity = Math.max(1, Number(category.quantity || 1));
    category.price = Math.max(0, Number(category.price || 0));
    if (category.availableQuantity === undefined || category.availableQuantity === null || this.isNew) {
      category.availableQuantity = category.quantity;
    }
    category.availableQuantity = clampNumber(category.availableQuantity, 0, category.quantity);
  });

  const totals = getTicketCategoryTotals(this.ticketCategories);
  if (totals.quantity > 0) {
    this.totalTickets = totals.quantity;
    this.availableTickets = this.isNew ? totals.availableQuantity : clampNumber(this.availableTickets, 0, totals.quantity);
    if (this.isNew || !this.price) {
      const firstActiveCategory = this.ticketCategories.find((category) => category.isActive !== false);
      this.price = firstActiveCategory?.price || this.price || 0;
    }
  } else if (this.isNew) {
    this.availableTickets = this.totalTickets;
  }
  next();
});

// Update updatedAt before saving
eventSchema.pre('save', function(next) {
  if (this.availableTickets <= 0 && this.ticketSaleStatus === 'live') {
    this.ticketSaleStatus = 'sold_out';
  }

  if (this.moderationStatus === 'approved' && this.isActive && ['pending_approval', 'draft'].includes(this.ticketSaleStatus)) {
    this.ticketSaleStatus = 'live';
  }

  this.updatedAt = Date.now();
  next();
});

eventSchema.methods.adjustTicketInventory = function(ticketCategoryId, delta) {
  const change = Number(delta || 0);
  if (!change) return;

  if (this.ticketCategories?.length) {
    const category = ticketCategoryId
      ? this.ticketCategories.find((item) => item._id.toString() === ticketCategoryId.toString())
      : this.ticketCategories.length === 1 ? this.ticketCategories[0] : null;
    if (category) {
      category.availableQuantity = clampNumber(
        Number(category.availableQuantity || 0) + change,
        0,
        Number(category.quantity || 0)
      );
    }
  }

  this.availableTickets = clampNumber(
    Number(this.availableTickets || 0) + change,
    0,
    Number(this.totalTickets || 0)
  );
};

module.exports = mongoose.model('Event', eventSchema);
