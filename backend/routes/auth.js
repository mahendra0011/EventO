const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  hostRegister,
  hostLogin,
  hostKeywordLogin,
  hostKeywordRegister,
  verifyEmail,
  resendVerification,
  verifyLoginOtp,
  resendLoginOtp,
  forgotPassword,
  resetPassword,
  getHostReadiness,
  submitHostVerification,
  updateBankAccount,
  sendPhoneOtp,
  verifyPhoneOtp
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/register', register);

router.post('/host-register', hostRegister);

router.post('/login', login);

router.post('/forgot-password', forgotPassword);

router.post('/reset-password', resetPassword);

router.post('/verify-email', verifyEmail);

router.post('/resend-verification', resendVerification);

router.post('/verify-login-otp', verifyLoginOtp);

router.post('/resend-login-otp', resendLoginOtp);

router.post('/host-login', hostLogin);

router.post('/host-keyword-login', hostKeywordLogin);

router.post('/host-keyword-register', hostKeywordRegister);

router.get('/me', auth, getMe);

router.put('/profile', auth, updateProfile);

router.get('/host-readiness', auth, getHostReadiness);

router.put('/host-verification', auth, submitHostVerification);

router.put('/bank-account', auth, updateBankAccount);

router.post('/phone/send-otp', auth, sendPhoneOtp);

router.post('/phone/verify-otp', auth, verifyPhoneOtp);

module.exports = router;
