const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getInbox,
  getConversation,
  getSentMessages,
  getHostConversations,
  getEventAttendees,
  markConversationAsRead,
  deleteMessage
} = require('../controllers/messageController');
const { auth } = require('../middleware/auth');

// @route   POST /api/messages
// @desc    Send message (host to user)
// @access  Private (Hosts only for sending)
router.post('/', auth, sendMessage);

// @route   GET /api/messages/inbox
// @desc    Get user's inbox (conversations)
// @access  Private
router.get('/inbox', auth, getInbox);

// @route   GET /api/messages/conversation/:userId
// @desc    Get conversation with specific user
// @access  Private
router.get('/conversation/:userId', auth, getConversation);

// @route   GET /api/messages/sent
// @desc    Get host's sent messages
// @access  Private
router.get('/sent', auth, getSentMessages);

// @route   GET /api/messages/conversations
// @desc    Get host's conversations list (for host panel)
// @access  Private (Host only)
router.get('/conversations', auth, getHostConversations);

// @route   GET /api/messages/attendees
// @desc    Get event attendees for host to message (host only)
// @access  Private (Host only)
router.get('/attendees', auth, getEventAttendees);

// @route   PUT /api/messages/read/:userId
// @desc    Mark conversation as read
// @access  Private
router.put('/read/:userId', auth, markConversationAsRead);

// @route   DELETE /api/messages/:id
// @desc    Delete a message
// @access  Private
router.delete('/:id', auth, deleteMessage);

module.exports = router;
