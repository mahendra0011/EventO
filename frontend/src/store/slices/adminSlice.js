import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchAdminDashboard = createAsyncThunk('admin/fetchDashboard', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/admin/dashboard');
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard');
  }
});

export const fetchAdminUsers = createAsyncThunk('admin/fetchUsers', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/admin/users?limit=200');
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
  }
});

export const fetchAdminEvents = createAsyncThunk('admin/fetchEvents', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/admin/events?limit=200');
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch events');
  }
});

export const fetchAdminBookings = createAsyncThunk('admin/fetchBookings', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/admin/bookings?limit=200');
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
  }
});

export const fetchAdminPayments = createAsyncThunk('admin/fetchPayments', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/admin/payments');
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch payments');
  }
});

export const fetchFraudSignals = createAsyncThunk('admin/fetchFraud', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/admin/fraud');
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch fraud signals');
  }
});

export const fetchAdvancedAnalytics = createAsyncThunk('admin/fetchAdvancedAnalytics', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/admin/analytics/advanced');
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics');
  }
});

export const fetchAdminSupport = createAsyncThunk('admin/fetchSupport', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/admin/support?limit=200');
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch support');
  }
});

export const fetchAdminLocations = createAsyncThunk('admin/fetchLocations', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/admin/locations');
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch locations');
  }
});

export const fetchAdminCategories = createAsyncThunk('admin/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/admin/categories');
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
  }
});

export const fetchAdminReviews = createAsyncThunk('admin/fetchReviews', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/admin/reviews?limit=200');
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch reviews');
  }
});

export const fetchAdminLogs = createAsyncThunk('admin/fetchLogs', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/admin/security/logs?limit=200');
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch logs');
  }
});

const initialState = {
  dashboard: null,
  users: [],
  events: [],
  bookings: [],
  payments: null,
  fraudSignals: null,
  advancedAnalytics: null,
  supportTickets: [],
  locations: [],
  categories: [],
  reviews: [],
  securityLogs: [],
  loading: false,
  error: null
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminError(state) { state.error = null; },
    updateAdminUsers(state, action) { state.users = action.payload; },
    updateAdminEvents(state, action) { state.events = action.payload; },
    updateAdminBookings(state, action) { state.bookings = action.payload; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => { state.dashboard = action.payload; })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => { state.users = action.payload.users || []; })
      .addCase(fetchAdminEvents.fulfilled, (state, action) => { state.events = action.payload.events || []; })
      .addCase(fetchAdminBookings.fulfilled, (state, action) => { state.bookings = action.payload.bookings || []; })
      .addCase(fetchAdminPayments.fulfilled, (state, action) => { state.payments = action.payload; })
      .addCase(fetchFraudSignals.fulfilled, (state, action) => { state.fraudSignals = action.payload; })
      .addCase(fetchAdvancedAnalytics.fulfilled, (state, action) => { state.advancedAnalytics = action.payload; })
      .addCase(fetchAdminSupport.fulfilled, (state, action) => { state.supportTickets = action.payload.tickets || []; })
      .addCase(fetchAdminLocations.fulfilled, (state, action) => { state.locations = action.payload.locations || []; })
      .addCase(fetchAdminCategories.fulfilled, (state, action) => { state.categories = action.payload.categories || []; })
      .addCase(fetchAdminReviews.fulfilled, (state, action) => { state.reviews = action.payload.reviews || []; })
      .addCase(fetchAdminLogs.fulfilled, (state, action) => { state.securityLogs = action.payload.logs || []; });
  }
});

export const { clearAdminError, updateAdminUsers, updateAdminEvents, updateAdminBookings } = adminSlice.actions;
export default adminSlice.reducer;