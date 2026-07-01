import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchWishlist = createAsyncThunk('wishlist/fetchWishlist', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/wishlist');
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist');
  }
});

export const addToWishlist = createAsyncThunk('wishlist/addToWishlist', async (eventId, { rejectWithValue }) => {
  try {
    const res = await api.post('/wishlist', { eventId });
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to add to wishlist');
  }
});

export const removeFromWishlist = createAsyncThunk('wishlist/removeFromWishlist', async (eventId, { rejectWithValue }) => {
  try {
    await api.delete(`/wishlist/${eventId}`);
    return eventId;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to remove from wishlist');
  }
});

export const checkWishlist = createAsyncThunk('wishlist/checkWishlist', async (eventId, { rejectWithValue }) => {
  try {
    const res = await api.get(`/wishlist/check/${eventId}`);
    return { eventId, isWishlisted: res.data.isWishlisted };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to check wishlist');
  }
});

const initialState = {
  items: [],
  wishlistIds: [],
  loading: false,
  error: null
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearWishlistError(state) { state.error = null; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => { state.loading = true; })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.wishlist || action.payload || [];
        state.wishlistIds = state.items.map(item => item.event?._id || item.event);
      })
      .addCase(fetchWishlist.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        const item = action.payload.wishlistItem || action.payload;
        if (item) {
          state.items.push(item);
          state.wishlistIds.push(item.event?._id || item.event);
        }
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        const eventId = action.payload;
        state.items = state.items.filter(item => (item.event?._id || item.event) !== eventId);
        state.wishlistIds = state.wishlistIds.filter(id => id !== eventId);
      })
      .addCase(checkWishlist.fulfilled, (state, action) => {
        const { eventId, isWishlisted } = action.payload;
        if (isWishlisted && !state.wishlistIds.includes(eventId)) {
          state.wishlistIds.push(eventId);
        } else if (!isWishlisted) {
          state.wishlistIds = state.wishlistIds.filter(id => id !== eventId);
        }
      });
  }
});

export const { clearWishlistError } = wishlistSlice.actions;
export default wishlistSlice.reducer;