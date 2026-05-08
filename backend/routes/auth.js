const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, hostRegister, hostLogin, hostKeywordLogin, hostKeywordRegister, verifyEmail, resendVerification, verifyLoginOtp, resendLoginOtp } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/register', register);

router.post('/host-register', hostRegister);

router.post('/login', login);

router.post('/verify-email', auth, verifyEmail);

router.post('/resend-verification', auth, resendVerification);

router.post('/verify-login-otp', auth, verifyLoginOtp);

router.post('/resend-login-otp', auth, resendLoginOtp);

router.post('/host-login', hostLogin);

router.post('/host-keyword-login', hostKeywordLogin);

router.post('/host-keyword-register', hostKeywordRegister);

router.get('/me', auth, getMe);

router.put('/profile', auth, updateProfile);

module.exports = router;