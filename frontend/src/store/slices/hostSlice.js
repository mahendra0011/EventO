import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchHostDashboard = createAsyncThunk('host/fetchDashboard', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/host/dashboard');
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch host dashboard');
  }
});

export const fetchHostEvents = createAsyncThunk('host/fetchEvents', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/events/organizer');
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch host events');
  }
});

export const fetchHostBookings = createAsyncThunk('host/fetchBookings', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/bookings/all');
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch host bookings');
  }
});

export const fetchConversations = createAsyncThunk('host/fetchConversations', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/messages/conversations');
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
  }
});

export const fetchHostNotifications = createAsyncThunk('host/fetchNotifications', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/notifications');
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
  }
});

const initialState = {
  stats: null,
  events: [],
  bookings: [],
  conversations: [],
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null
};

const hostSlice = createSlice({
  name: 'host',
  initialState,
  reducers: {
    clearHostError(state) { state.error = null; },
    updateHostEvents(state, action) { state.events = action.payload; },
    updateHostBookings(state, action) { state.bookings = action.payload; },
    markNotificationRead(state, action) {
      const id = action.payload;
      state.notifications = state.notifications.map(n => n._id === id ? { ...n, isRead: true } : n);
    },
    markAllNotificationsRead(state) {
      state.notifications = state.notifications.map(n => ({ ...n, isRead: true }));
      state.unreadCount = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHostDashboard.pending, (state) => { state.loading = true; })
      .addCase(fetchHostDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchHostDashboard.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchHostEvents.fulfilled, (state, action) => { state.events = action.payload.data || action.payload || []; })
      .addCase(fetchHostBookings.fulfilled, (state, action) => { state.bookings = action.payload.bookings || []; })
      .addCase(fetchConversations.fulfilled, (state, action) => { state.conversations = action.payload.conversations || []; })
      .addCase(fetchHostNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload.notifications || [];
        state.unreadCount = action.payload.unreadCount || 0;
      });
  }
});

export const { clearHostError, updateHostEvents, updateHostBookings, markNotificationRead, markAllNotificationsRead } = hostSlice.actions;
export default hostSlice.reducer;