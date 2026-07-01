import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

const initialState = {
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: false,
  loading: true,
  error: null
};

export const checkAuth = createAsyncThunk('auth/checkAuth', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token');
    const res = await api.get('/auth/me');
    return res.data;
  } catch (error) {
    localStorage.removeItem('token');
    return rejectWithValue(error.response?.data?.message || 'Not authenticated');
  }
});

export const loginUser = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.token) localStorage.setItem('token', res.data.token);
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/register', async ({ name, email, password, phone }, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register', { name, email, password, phone });
    if (res.data.token) localStorage.setItem('token', res.data.token);
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Registration failed');
  }
});

export const hostRegister = createAsyncThunk('auth/hostRegister', async ({ name, email, password, phone, organizerProfile, organizerDocuments }, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/host-register', { name, email, password, phone, organizerProfile, organizerDocuments });
    if (res.data.token) localStorage.setItem('token', res.data.token);
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Host registration failed');
  }
});

export const hostLogin = createAsyncThunk('auth/hostLogin', async ({ email, password }, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/host-login', { email, password });
    if (res.data.token) localStorage.setItem('token', res.data.token);
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Host login failed');
  }
});

export const googleLogin = createAsyncThunk('auth/googleLogin', async (credential, { rejectWithValue }) => {
  try {
    const payload = typeof credential === 'string' ? { credential } : credential;
    const res = await api.post('/auth/google', payload);
    if (res.data.token) localStorage.setItem('token', res.data.token);
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Google login failed');
  }
});

export const verifyEmail = createAsyncThunk('auth/verifyEmail', async ({ email, otp }, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/verify-email', { email, otp });
    if (res.data.token) localStorage.setItem('token', res.data.token);
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Verification failed');
  }
});

export const verifyLoginOTP = createAsyncThunk('auth/verifyLoginOTP', async ({ email, otp }, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/verify-login-otp', { email, otp });
    if (res.data.token) localStorage.setItem('token', res.data.token);
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'OTP verification failed');
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const res = await api.put('/auth/profile', data);
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Profile update failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      localStorage.removeItem('token');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    setUser(state, action) {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Check Auth
      .addCase(checkAuth.pending, (state) => { state.loading = true; })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.token = null;
      })
      // Login
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.user && (action.payload.verified || !action.payload.requiresVerification)) {
          state.user = action.payload.user;
          state.isAuthenticated = true;
          state.token = action.payload.token;
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.user && !action.payload.requiresVerification) {
          state.user = action.payload.user;
          state.isAuthenticated = true;
          state.token = action.payload.token;
        }
      })
      .addCase(registerUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Host Register
      .addCase(hostRegister.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(hostRegister.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.user && !action.payload.requiresVerification) {
          state.user = action.payload.user;
          state.isAuthenticated = true;
          state.token = action.payload.token;
        }
      })
      .addCase(hostRegister.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Host Login
      .addCase(hostLogin.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(hostLogin.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.user && !action.payload.requiresVerification) {
          state.user = action.payload.user;
          state.isAuthenticated = true;
          state.token = action.payload.token;
        }
      })
      .addCase(hostLogin.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Google Login
      .addCase(googleLogin.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.user && !action.payload.requiresVerification) {
          state.user = action.payload.user;
          state.isAuthenticated = true;
          state.token = action.payload.token;
        }
      })
      .addCase(googleLogin.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Verify Email
      .addCase(verifyEmail.fulfilled, (state, action) => {
        if (action.payload.user) {
          state.user = action.payload.user;
          state.isAuthenticated = true;
          state.token = action.payload.token;
        }
      })
      // Verify Login OTP
      .addCase(verifyLoginOTP.fulfilled, (state, action) => {
        if (action.payload.user) {
          state.user = action.payload.user;
          state.isAuthenticated = true;
          state.token = action.payload.token;
        }
      })
      // Update Profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        if (action.payload.user) state.user = action.payload.user;
      });
  }
});

export const { logout, setUser, clearError } = authSlice.actions;
export default authSlice.reducer;