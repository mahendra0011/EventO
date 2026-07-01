import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: false,
  activeModal: null,
  globalLoading: false,
  selectedCity: 'Bengaluru',
  theme: 'light'
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) { state.sidebarOpen = !state.sidebarOpen; },
    setSidebarOpen(state, action) { state.sidebarOpen = action.payload; },
    openModal(state, action) { state.activeModal = action.payload; },
    closeModal(state) { state.activeModal = null; },
    setGlobalLoading(state, action) { state.globalLoading = action.payload; },
    setSelectedCity(state, action) { state.selectedCity = action.payload; },
    setTheme(state, action) { state.theme = action.payload; }
  }
});

export const {
  toggleSidebar,
  setSidebarOpen,
  openModal,
  closeModal,
  setGlobalLoading,
  setSelectedCity,
  setTheme
} = uiSlice.actions;
export default uiSlice.reducer;