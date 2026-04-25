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
  deleteMessage,
  broadcastMessage,
  postCommunityMessage,
  getCommunityMessages
} = require('../controllers/messageController');
const { auth } = require('../middleware/auth');

// @route   POST /api/messages
// @desc    Send message (user or host)
// @access  Private
router.post('/', auth, sendMessage);

// @route   POST /api/messages/broadcast
// @desc    Broadcast message to all confirmed attendees of an event
// @access  Private (Host only)
router.post('/broadcast', auth, broadcastMessage);

// @route   POST /api/messages/community
// @desc    Post public message for community chat
// @access  Private
router.post('/community', auth, postCommunityMessage);

// @route   GET /api/messages/community/:eventId
// @desc    Get public messages for an event (community chat)
// @access  Private
router.get('/community/:eventId', auth, getCommunityMessages);

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

// @route   PUT /api/messages/:id/pin
// @desc    Pin/Unpin a community message (host only for their event)
// @access  Private (Host only)
router.put('/:id/pin', auth, pinMessage);

// @route   DELETE /api/messages/:id
// @desc    Delete a message (only sender or host can delete)
// @access  Private
router.delete('/:id', auth, deleteMessage);

module.exports = router;
