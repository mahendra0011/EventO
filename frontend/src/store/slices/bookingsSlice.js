import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchUserBookings = createAsyncThunk('bookings/fetchUserBookings', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/bookings');
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
  }
});

export const fetchBookingById = createAsyncThunk('bookings/fetchBookingById', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/bookings/${id}`);
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch booking');
  }
});

export const createBooking = createAsyncThunk('bookings/createBooking', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/bookings', data);
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create booking');
  }
});

export const cancelBooking = createAsyncThunk('bookings/cancelBooking', async (id, { rejectWithValue }) => {
  try {
    const res = await api.put(`/bookings/${id}/cancel`);
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to cancel booking');
  }
});

const initialState = {
  userBookings: [],
  currentBooking: null,
  loading: false,
  error: null
};

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    clearCurrentBooking(state) { state.currentBooking = null; },
    clearBookingsError(state) { state.error = null; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserBookings.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchUserBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.userBookings = action.payload.bookings || action.payload || [];
      })
      .addCase(fetchUserBookings.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchBookingById.pending, (state) => { state.loading = true; })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload.booking || action.payload;
      })
      .addCase(fetchBookingById.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createBooking.fulfilled, (state, action) => {
        const booking = action.payload.booking || action.payload;
        if (booking) state.userBookings.unshift(booking);
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        const updated = action.payload.booking || action.payload;
        state.userBookings = state.userBookings.map(b => b._id === updated._id ? updated : b);
        if (state.currentBooking?._id === updated._id) state.currentBooking = updated;
      });
  }
});

export const { clearCurrentBooking, clearBookingsError } = bookingsSlice.actions;
export default bookingsSlice.reducer;