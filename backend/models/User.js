const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  phoneVerification: {
    status: {
      type: String,
      enum: ['unverified', 'pending', 'verified'],
      default: 'unverified'
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
    verifiedAt: {
      type: Date
    }
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
  isVerified: {
    type: Boolean,
    default: false
  },
  hostVerification: {
    status: {
      type: String,
      enum: ['unsubmitted', 'pending', 'approved', 'rejected', 'suspended'],
      default: 'unsubmitted'
    },
    governmentIdType: {
      type: String,
      enum: ['aadhaar', 'pan', 'passport', 'other', ''],
      default: ''
    },
    governmentIdUrl: {
      type: String,
      trim: true
    },
    selfieWithIdUrl: {
      type: String,
      trim: true
    },
    isCompany: {
      type: Boolean,
      default: false
    },
    businessName: {
      type: String,
      trim: true
    },
    businessProofUrl: {
      type: String,
      trim: true
    },
    submittedAt: {
      type: Date
    },
    reviewedAt: {
      type: Date
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      trim: true
    }
  },
  bankAccount: {
    accountHolderName: {
      type: String,
      trim: true
    },
    bankName: {
      type: String,
      trim: true
    },
    accountNumberLast4: {
      type: String,
      trim: true
    },
    ifsc: {
      type: String,
      trim: true,
      uppercase: true
    },
    upiId: {
      type: String,
      trim: true
    },
    proofUrl: {
      type: String,
      trim: true
    },
    verificationStatus: {
      type: String,
      enum: ['unsubmitted', 'pending', 'verified', 'rejected'],
      default: 'unsubmitted'
    },
    verifiedAt: {
      type: Date
    },
    reviewedAt: {
      type: Date
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      trim: true
    }
  },
  hostTrust: {
    badge: {
      type: String,
      enum: ['new', 'verified', 'suspended'],
      default: 'new'
    },
    eventPublishLimit: {
      type: Number,
      default: 3
    },
    ratingAverage: {
      type: Number,
      default: 0
    },
    ratingCount: {
      type: Number,
      default: 0
    },
    lowRatingSuspendedAt: {
      type: Date
    },
    suspensionReason: {
      type: String,
      trim: true
    }
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
