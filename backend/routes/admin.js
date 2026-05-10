const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  updateUser,
  updateUserRole,
  deleteUser,
  getAllEvents,
  updateEvent,
  deleteEvent,
  getAllBookings,
  updateBooking,
  refundBooking,
  getPaymentsSummary,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  sendNotification,
  getReviews,
  deleteReview,
  getSecurityLogs,
  exportReport,
  getEventAnalytics,
  getSupportTickets,
  createSupportTicket,
  updateSupportTicket,
  deleteSupportTicket,
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  getFraudSignals,
  getAdvancedAnalytics,
  sendEventReminder,
  resendBookingConfirmation
} = require('../controllers/adminController');
const { adminAuth } = require('../middleware/auth');

router.use(adminAuth);

router.get('/dashboard', getDashboardStats);

router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

router.get('/events', getAllEvents);
router.put('/events/:id', updateEvent);
router.delete('/events/:id', deleteEvent);
router.get('/events/:id/analytics', getEventAnalytics);
router.post('/events/:id/reminders', sendEventReminder);

router.get('/bookings', getAllBookings);
router.put('/bookings/:id', updateBooking);
router.put('/bookings/:id/refund', refundBooking);
router.post('/bookings/:id/confirmation', resendBookingConfirmation);

router.get('/payments', getPaymentsSummary);
router.get('/analytics/advanced', getAdvancedAnalytics);

router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

router.post('/notifications', sendNotification);

router.get('/reviews', getReviews);
router.delete('/reviews/:id', deleteReview);

router.get('/support', getSupportTickets);
router.post('/support', createSupportTicket);
router.put('/support/:id', updateSupportTicket);
router.delete('/support/:id', deleteSupportTicket);

router.get('/locations', getLocations);
router.post('/locations', createLocation);
router.put('/locations/:id', updateLocation);
router.delete('/locations/:id', deleteLocation);

router.get('/security/logs', getSecurityLogs);
router.get('/fraud', getFraudSignals);

router.get('/reports/:type', exportReport);

module.exports = router;
