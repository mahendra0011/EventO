import { shallowEqual } from './hooks';

// Auth selectors
export const selectAuthUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;

// Events selectors
export const selectEvents = (state) => state.events.events;
export const selectCurrentEvent = (state) => state.events.currentEvent;
export const selectEventCategories = (state) => state.events.categories;
export const selectEventsLoading = (state) => state.events.loading;
export const selectEventsPagination = (state) => state.events.pagination;

// Bookings selectors
export const selectUserBookings = (state) => state.bookings.userBookings;
export const selectCurrentBooking = (state) => state.bookings.currentBooking;
export const selectBookingsLoading = (state) => state.bookings.loading;

// Wishlist selectors
export const selectWishlistItems = (state) => state.wishlist.items;
export const selectWishlistIds = (state) => state.wishlist.wishlistIds;
export const selectIsInWishlist = (eventId) => (state) => state.wishlist.wishlistIds.includes(eventId);
export const selectWishlistCount = (state) => state.wishlist.items.length;
export const selectWishlistLoading = (state) => state.wishlist.loading;

// Admin selectors
export const selectAdminDashboard = (state) => state.admin.dashboard;
export const selectAdminUsers = (state) => state.admin.users;
export const selectAdminEvents = (state) => state.admin.events;
export const selectAdminBookings = (state) => state.admin.bookings;
export const selectAdminPayments = (state) => state.admin.payments;
export const selectAdminFraud = (state) => state.admin.fraudSignals;
export const selectAdminAnalytics = (state) => state.admin.advancedAnalytics;
export const selectAdminSupport = (state) => state.admin.supportTickets;
export const selectAdminLocations = (state) => state.admin.locations;
export const selectAdminCategories = (state) => state.admin.categories;
export const selectAdminReviews = (state) => state.admin.reviews;
export const selectAdminLogs = (state) => state.admin.securityLogs;
export const selectAdminLoading = (state) => state.admin.loading;

// Host selectors
export const selectHostStats = (state) => state.host.stats;
export const selectHostEvents = (state) => state.host.events;
export const selectHostBookings = (state) => state.host.bookings;
export const selectHostConversations = (state) => state.host.conversations;
export const selectHostNotifications = (state) => state.host.notifications;
export const selectHostUnreadCount = (state) => state.host.unreadCount;
export const selectHostLoading = (state) => state.host.loading;

// UI selectors
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectActiveModal = (state) => state.ui.activeModal;
export const selectGlobalLoading = (state) => state.ui.globalLoading;
export const selectSelectedCity = (state) => state.ui.selectedCity;
export const selectTheme = (state) => state.ui.theme;