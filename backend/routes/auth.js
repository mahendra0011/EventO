const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleLogin,
  getMe,
  updateProfile,
  changePassword,
  hostRegister,
  hostLogin,
  verifyEmail,
  resendVerification,
  verifyLoginOtp,
  resendLoginOtp,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/register', register);

router.post('/host-register', hostRegister);

router.post('/login', login);

router.post('/google', googleLogin);

router.post('/forgot-password', forgotPassword);

router.post('/reset-password', resetPassword);

router.post('/verify-email', verifyEmail);

router.post('/resend-verification', resendVerification);

router.post('/verify-login-otp', verifyLoginOtp);

router.post('/resend-login-otp', resendLoginOtp);

router.post('/host-login', hostLogin);

router.get('/me', auth, getMe);

router.put('/profile', auth, updateProfile);

router.put('/password', auth, changePassword);

module.exports = router;
