import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import eventsReducer from './slices/eventsSlice';
import bookingsReducer from './slices/bookingsSlice';
import wishlistReducer from './slices/wishlistSlice';
import adminReducer from './slices/adminSlice';
import hostReducer from './slices/hostSlice';
import uiReducer from './slices/uiSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventsReducer,
    bookings: bookingsReducer,
    wishlist: wishlistReducer,
    admin: adminReducer,
    host: hostReducer,
    ui: uiReducer
  }
});

export default store;