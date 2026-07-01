import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchEvents = createAsyncThunk('events/fetchEvents', async (filters = {}, { rejectWithValue }) => {
  try {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.location) params.append('location', filters.location);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    const res = await api.get(`/events?${params}`);
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch events');
  }
});

export const fetchEventById = createAsyncThunk('events/fetchEventById', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/events/${id}`);
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch event');
  }
});

export const fetchCategories = createAsyncThunk('events/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/events/categories');
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
  }
});

export const createEvent = createAsyncThunk('events/createEvent', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/events', data);
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create event');
  }
});

export const updateEvent = createAsyncThunk('events/updateEvent', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/events/${id}`, data);
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update event');
  }
});

export const deleteEvent = createAsyncThunk('events/deleteEvent', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/events/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete event');
  }
});

const initialState = {
  events: [],
  currentEvent: null,
  categories: [],
  pagination: { page: 1, totalPages: 1, total: 0 },
  loading: false,
  error: null
};

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearCurrentEvent(state) { state.currentEvent = null; },
    clearEventsError(state) { state.error = null; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload.events || action.payload || [];
        if (action.payload.pagination) state.pagination = action.payload.pagination;
      })
      .addCase(fetchEvents.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchEventById.pending, (state) => { state.loading = true; })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEvent = action.payload.event || action.payload;
      })
      .addCase(fetchEventById.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload.categories || action.payload || [];
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        if (action.payload.event) state.events.unshift(action.payload.event);
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        const updated = action.payload.event || action.payload;
        state.events = state.events.map(e => e._id === updated._id ? updated : e);
        if (state.currentEvent?._id === updated._id) state.currentEvent = updated;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.events = state.events.filter(e => e._id !== action.payload);
      });
  }
});

export const { clearCurrentEvent, clearEventsError } = eventsSlice.actions;
export default eventsSlice.reducer;