const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const DEFAULT_HOST_PACKAGE_PRICING = [
  {
    key: 'starter',
    name: 'Starter',
    description: 'Entry package',
    price: 0,
    isActive: true
  },
  {
    key: 'standard',
    name: 'Standard',
    description: 'Most booked package',
    price: 0,
    isActive: true
  },
  {
    key: 'premium',
    name: 'Premium',
    description: 'High touch package',
    price: 0,
    isActive: true
  }
];

const hostPackagePricingSchema = new mongoose.Schema({
  key: {
    type: String,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 60
  },
  description: {
    type: String,
    trim: true,
    maxlength: 160,
    default: ''
  },
  price: {
    type: Number,
    min: 0,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const hostSettingsSchema = new mongoose.Schema({
  notificationPreferences: {
    newBookings: {
      type: Boolean,
      default: true
    },
    bookingDecisions: {
      type: Boolean,
      default: true
    },
    eventReminders: {
      type: Boolean,
      default: true
    },
    communityMessages: {
      type: Boolean,
      default: true
    }
  },
  hostPreferences: {
    autoConfirmFreeEvents: {
      type: Boolean,
      default: false
    },
    showRevenueCards: {
      type: Boolean,
      default: true
    },
    requireQrAtEntry: {
      type: Boolean,
      default: true
    },
    weeklyDigest: {
      type: Boolean,
      default: true
    }
  },
  defaultEventVisibility: {
    type: String,
    enum: ['public', 'draft', 'review'],
    default: 'public'
  },
  packagePricing: {
    type: [hostPackagePricingSchema],
    default: () => DEFAULT_HOST_PACKAGE_PRICING.map(pkg => ({ ...pkg }))
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'host', 'admin'],
    default: 'user'
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  phone: {
    type: String,
    trim: true
  },
  secretKeyword: {
    type: String,
    trim: true
  },
  organizerDocuments: [{
    label: {
      type: String,
      trim: true
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
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  hostSettings: {
    type: hostSettingsSchema,
    default: () => ({})
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String
  },
  otpExpiry: {
    type: Date
  },
  lastOtpSent: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  loginOtp: {
    type: String
  },
  loginOtpExpires: {
    type: Date
  },
  loginOtpVerified: {
    type: Boolean,
    default: false
  },
  lastLoginOtpSent: {
    type: Date
  },
  emailVerificationOtp: {
    type: String
  },
  emailVerificationOtpExpires: {
    type: Date
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: {
    type: Date
  },
  passwordResetAttempts: {
    type: Number,
    default: 0
  },
  lastPasswordResetSentAt: {
    type: Date
  },
  lastLoginAt: {
    type: Date
  },
  lastLoginIp: {
    type: String
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
