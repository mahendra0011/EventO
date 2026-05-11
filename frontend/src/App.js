import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { PageTransition } from './components/animated';

// Pages
import Home from './pages/Home';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail'; // Add this line
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminPanel from './pages/AdminPanel';
import CreateEvent from './pages/CreateEvent';
import BookingConfirmation from './pages/BookingConfirmation';
import EventChatPage from './pages/EventChatPage';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false, hostOnly = false, allowHosts = false, allowAdmins = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf8f4]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-cocoa-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to={user.role === 'host' ? '/host' : '/dashboard'} replace />;
  }

  if (hostOnly && user.role !== 'host') {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  if (user.role === 'admin' && !adminOnly && !allowAdmins) {
    return <Navigate to="/admin" replace />;
  }

  if (user.role === 'host' && !hostOnly && !allowHosts) {
    return <Navigate to="/host" replace />;
  }

  return children;
};

// Animated Routes Component
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route 
          path="/" 
          element={
            <PageTransition>
              <Home />
            </PageTransition>
          } 
        />
        <Route 
          path="/events" 
          element={
            <PageTransition>
              <Events />
            </PageTransition>
          } 
        />
        <Route
          path="/events/:id"
          element={
            <PageTransition>
              <EventDetail />
            </PageTransition>
          }
        />
        <Route
          path="/events/:eventId/chat"
          element={
            <ProtectedRoute allowHosts>
              <PageTransition>
                <EventChatPage />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/login"
          element={
            <PageTransition>
              <Login />
            </PageTransition>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PageTransition>
              <Register />
            </PageTransition>
          } 
        />
        <Route
          path="/verify-email"
          element={
            <PageTransition>
              <VerifyEmail />
            </PageTransition>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PageTransition>
              <ForgotPassword />
            </PageTransition>
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            <PageTransition>
              <ResetPassword />
            </PageTransition>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PageTransition>
              <ResetPassword />
            </PageTransition>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <PageTransition>
                <Dashboard />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/host"
          element={
            <ProtectedRoute hostOnly>
              <PageTransition>
                <AdminDashboard />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <PageTransition>
                <AdminPanel />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/host/create-event"
          element={
            <ProtectedRoute hostOnly>
              <PageTransition>
                <CreateEvent />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking/:id/confirmation"
          element={
            <ProtectedRoute>
              <PageTransition>
                <BookingConfirmation />
              </PageTransition>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

// Main App Content component (inside Router)
function AppContent() {
  const location = useLocation();
  // Hide footer only on chat pages
  const hideFooter = location.pathname.includes('/chat');

  return (
    <div className="flex min-h-screen flex-col bg-[#fbf8f4] text-cocoa-900">
      <Navbar />
      <main className="flex-grow">
        <AnimatedRoutes />
      </main>
      {!hideFooter && <Footer />}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#3a271d',
            color: '#fff',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 20px 45px rgba(58, 39, 29, 0.18)',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
