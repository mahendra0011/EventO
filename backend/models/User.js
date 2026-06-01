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
    required: function() {
      return !this.googleId;
    },
    minlength: 6
  },
  googleId: {
    type: String,
    trim: true
  },
  googlePicture: {
    type: String,
    trim: true
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
  organizerProfile: {
    businessName: {
      type: String,
      trim: true
    },
    businessType: {
      type: String,
      enum: ['individual', 'partnership', 'company', 'trust', 'other'],
      default: 'individual'
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true
    },
    panNumber: {
      type: String,
      trim: true,
      uppercase: true
    },
    bankAccountName: {
      type: String,
      trim: true
    },
    bankAccountNumber: {
      type: String,
      trim: true
    },
    bankIfsc: {
      type: String,
      trim: true,
      uppercase: true
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    contactPhone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    }
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
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
