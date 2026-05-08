const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, hostRegister, hostLogin, hostKeywordLogin, hostKeywordRegister, verifyLoginOTP, resendLoginOTP } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/register', register);

router.post('/host-register', hostRegister);

router.post('/login', login);

router.post('/verify-login-otp', auth, verifyLoginOTP);

router.post('/resend-login-otp', auth, resendLoginOTP);

router.post('/host-login', hostLogin);

router.post('/host-keyword-login', hostKeywordLogin);

router.post('/host-keyword-register', hostKeywordRegister);

router.get('/me', auth, getMe);

router.put('/profile', auth, updateProfile);

module.exports = router;