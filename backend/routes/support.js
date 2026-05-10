const express = require('express');
const router = express.Router();
const {
  getMySupportTickets,
  createSupportTicket
} = require('../controllers/supportController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getMySupportTickets);
router.post('/', auth, createSupportTicket);

module.exports = router;
