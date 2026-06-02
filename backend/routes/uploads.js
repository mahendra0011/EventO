const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { runUploadMiddleware, uploadFiles } = require('../controllers/uploadController');

router.post('/public/:context', runUploadMiddleware, uploadFiles({ publicUpload: true }));
router.post('/:context', auth, runUploadMiddleware, uploadFiles());

module.exports = router;
