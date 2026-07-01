# Redux Store Structure

## Setup Complete ✅

This project now uses **Redux Toolkit** for state management alongside the existing Context API.

## 📁 Directory Structure

```
frontend/src/store/
├── index.js              # Main store configuration
├── hooks.js              # Custom hooks (useAppDispatch, useAppSelector)
├── selectors.js          # Memoized selectors for all slices
├── slices/
│   ├── authSlice.js      # Authentication state
│   ├── eventsSlice.js    # Events & categories
│   ├── bookingsSlice.js  # User bookings
│   ├── wishlistSlice.js  # Wishlist management
│   ├── adminSlice.js     # Admin panel data
│   ├── hostSlice.js      # Host dashboard data
│   └── uiSlice.js        # UI state (sidebar, modals, theme)
└── README.md             # This file
```

## 🚀 Quick Start

### 1. Accessing State in Components

```jsx
import { useAppSelector } from '../store/hooks';
import { selectAuthUser, selectIsAuthenticated } from '../store/selectors';

function MyComponent() {
  const user = useAppSelector(selectAuthUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  
  return <div>{user?.name}</div>;
}
```

### 2. Dispatching Actions

```jsx
import { useAppDispatch } from '../store/hooks';
import { loginUser, fetchEvents } from '../store/slices/authSlice';

function LoginForm() {
  const dispatch = useAppDispatch();
  
  const handleSubmit = (email, password) => {
    dispatch(loginUser({ email, password }));
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

## 📦 Available Slices & Actions

### Auth Slice (`authSlice.js`)

**State:** `user`, `token`, `isAuthenticated`, `loading`, `error`

**Async Actions:**
- `checkAuth()` - Verify existing token
- `loginUser({ email, password })` - User login
- `registerUser({ name, email, password, phone })` - User registration
- `hostLogin({ email, password })` - Host login
- `hostRegister({ name, email, password, phone, organizerProfile, organizerDocuments })` - Host registration
- `googleLogin(credential)` - Google OAuth login
- `verifyEmail({ email, otp })` - Email verification
- `verifyLoginOTP({ email, otp })` - Login OTP verification
- `updateProfile(data)` - Update user profile

**Sync Actions:**
- `logout()` - Clear auth state
- `setUser(user)` - Set user directly
- `clearError()` - Clear error message

**Selectors:**
- `selectAuthUser(state)`
- `selectIsAuthenticated(state)`
- `selectAuthLoading(state)`
- `selectAuthError(state)`

---

### Events Slice (`eventsSlice.js`)

**State:** `events[]`, `currentEvent`, `categories[]`, `pagination`, `loading`, `error`

**Async Actions:**
- `fetchEvents({ search, category, location, page, limit })` - Get all events
- `fetchEventById(id)` - Get single event
- `fetchCategories()` - Get all categories
- `createEvent(data)` - Create new event
- `updateEvent({ id, data })` - Update event
- `deleteEvent(id)` - Delete event

**Sync Actions:**
- `clearCurrentEvent()` - Clear current event
- `clearEventsError()` - Clear error

**Selectors:**
- `selectEvents(state)`
- `selectCurrentEvent(state)`
- `selectEventCategories(state)`
- `selectEventsLoading(state)`
- `selectEventsPagination(state)`

---

### Bookings Slice (`bookingsSlice.js`)

**State:** `userBookings[]`, `currentBooking`, `loading`, `error`

**Async Actions:**
- `fetchUserBookings()` - Get user's bookings
- `fetchBookingById(id)` - Get single booking
- `createBooking(data)` - Create new booking
- `cancelBooking(id)` - Cancel booking

**Sync Actions:**
- `clearCurrentBooking()`
- `clearBookingsError()`

**Selectors:**
- `selectUserBookings(state)`
- `selectCurrentBooking(state)`
- `selectBookingsLoading(state)`

---

### Wishlist Slice (`wishlistSlice.js`)

**State:** `items[]`, `wishlistIds[]`, `loading`, `error`

**Async Actions:**
- `fetchWishlist()` - Get user's wishlist
- `addToWishlist(eventId)` - Add event to wishlist
- `removeFromWishlist(eventId)` - Remove from wishlist
- `checkWishlist(eventId)` - Check if event is in wishlist

**Sync Actions:**
- `clearWishlistError()`

**Selectors:**
- `selectWishlistItems(state)`
- `selectWishlistIds(state)`
- `selectIsInWishlist(eventId)(state)` - Check if specific event is wishlisted
- `selectWishlistCount(state)`
- `selectWishlistLoading(state)`

---

### Admin Slice (`adminSlice.js`)

**State:** `dashboard`, `users[]`, `events[]`, `bookings[]`, `payments`, `fraudSignals`, `advancedAnalytics`, `supportTickets[]`, `locations[]`, `categories[]`, `reviews[]`, `securityLogs[]`, `loading`, `error`

**Async Actions:**
- `fetchAdminDashboard()` - Get admin dashboard stats
- `fetchAdminUsers()` - Get all users
- `fetchAdminEvents()` - Get all events
- `fetchAdminBookings()` - Get all bookings
- `fetchAdminPayments()` - Get payment summary
- `fetchFraudSignals()` - Get fraud signals
- `fetchAdvancedAnalytics()` - Get analytics data
- `fetchAdminSupport()` - Get support tickets
- `fetchAdminLocations()` - Get locations
- `fetchAdminCategories()` - Get categories
- `fetchAdminReviews()` - Get reviews
- `fetchAdminLogs()` - Get security logs

**Sync Actions:**
- `clearAdminError()`
- `updateAdminUsers(users)`
- `updateAdminEvents(events)`
- `updateAdminBookings(bookings)`

**Selectors:**
- `selectAdminDashboard(state)`
- `selectAdminUsers(state)`
- `selectAdminEvents(state)`
- `selectAdminBookings(state)`
- `selectAdminPayments(state)`
- `selectAdminFraud(state)`
- `selectAdminAnalytics(state)`
- `selectAdminSupport(state)`
- `selectAdminLocations(state)`
- `selectAdminCategories(state)`
- `selectAdminReviews(state)`
- `selectAdminLogs(state)`
- `selectAdminLoading(state)`

---

### Host Slice (`hostSlice.js`)

**State:** `stats`, `events[]`, `bookings[]`, `conversations[]`, `notifications[]`, `unreadCount`, `loading`, `error`

**Async Actions:**
- `fetchHostDashboard()` - Get host dashboard
- `fetchHostEvents()` - Get host's events
- `fetchHostBookings()` - Get host's bookings
- `fetchConversations()` - Get message conversations
- `fetchHostNotifications()` - Get notifications

**Sync Actions:**
- `clearHostError()`
- `updateHostEvents(events)`
- `updateHostBookings(bookings)`
- `markNotificationRead(id)`
- `markAllNotificationsRead()`

**Selectors:**
- `selectHostStats(state)`
- `selectHostEvents(state)`
- `selectHostBookings(state)`
- `selectHostConversations(state)`
- `selectHostNotifications(state)`
- `selectHostUnreadCount(state)`
- `selectHostLoading(state)`

---

### UI Slice (`uiSlice.js`)

**State:** `sidebarOpen`, `activeModal`, `globalLoading`, `selectedCity`, `theme`

**Sync Actions:**
- `toggleSidebar()`
- `setSidebarOpen(bool)`
- `openModal(modalName)`
- `closeModal()`
- `setGlobalLoading(bool)`
- `setSelectedCity(city)`
- `setTheme(theme)`

**Selectors:**
- `selectSidebarOpen(state)`
- `selectActiveModal(state)`
- `selectGlobalLoading(state)`
- `selectSelectedCity(state)`
- `selectTheme(state)`

---

## 🔧 Migration Guide

### From Context to Redux

**Before (Context):**
```jsx
const { user, login, logout } = useAuth();
await login(email, password);
```

**After (Redux):**
```jsx
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser } from '../store/slices/authSlice';
import { selectAuthUser } from '../store/selectors';

const dispatch = useAppDispatch();
const user = useAppSelector(selectAuthUser);

await dispatch(loginUser({ email, password })).unwrap();
```

### From Local State to Redux

**Before (useState):**
```jsx
const [events, setEvents] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  setLoading(true);
  api.get('/events').then(res => {
    setEvents(res.data);
    setLoading(false);
  });
}, []);
```

**After (Redux):**
```jsx
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchEvents, selectEvents, selectEventsLoading } from '../store/selectors';

const dispatch = useAppDispatch();
const events = useAppSelector(selectEvents);
const loading = useAppSelector(selectEventsLoading);

useEffect(() => {
  dispatch(fetchEvents());
}, [dispatch]);
```

## 📝 Notes

- **Context API still active.** Existing `AuthContext`, `ThemeContext`, `CityContext` still work. You can migrate gradually.
- **LocalStorage token** is automatically synced in `authSlice`.
- **DevTools:** Redux DevTools browser extension will show all state changes.
- **Performance:** Use `useAppSelector` with selectors to avoid unnecessary re-renders.

## 🐛 Debugging

1. Install **Redux DevTools** browser extension
2. Open DevTools → Redux tab
3. See all actions, state changes, and time-travel debugging

## 📚 Resources

- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [React-Redux Docs](https://react-redux.js.org/)