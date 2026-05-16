import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster, resolveValue, toast } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CheckCircle2, Info, Loader2, X, XCircle } from 'lucide-react';

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

const toastTone = {
  success: {
    title: 'Success',
    icon: CheckCircle2,
    shell: 'border-emerald-100 bg-white',
    iconWrap: 'bg-emerald-50 text-emerald-600',
    progress: 'bg-emerald-500'
  },
  error: {
    title: 'Action needed',
    icon: XCircle,
    shell: 'border-red-100 bg-white',
    iconWrap: 'bg-red-50 text-red-600',
    progress: 'bg-red-500'
  },
  loading: {
    title: 'Working',
    icon: Loader2,
    shell: 'border-primary-100 bg-white',
    iconWrap: 'bg-primary-50 text-primary-600',
    progress: 'bg-primary-500',
    spin: true
  },
  blank: {
    title: 'Evento update',
    icon: Info,
    shell: 'border-cocoa-100 bg-white',
    iconWrap: 'bg-primary-50 text-primary-600',
    progress: 'bg-primary-500'
  }
};

const EventoToast = (toastItem) => {
  const tone = toastTone[toastItem.type] || toastTone.blank;
  const Icon = tone.icon;
  const duration = typeof toastItem.duration === 'number' && toastItem.duration > 0
    ? toastItem.duration
    : 4000;

  return (
    <div
      className={`evento-toast ${toastItem.visible ? 'evento-toast-enter' : 'evento-toast-exit'} ${tone.shell}`}
      role="status"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${tone.iconWrap}`}>
          <Icon className={`h-5 w-5 ${tone.spin ? 'animate-spin' : ''}`} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-cocoa-900">{tone.title}</p>
          <div className="mt-1 text-sm font-semibold leading-5 text-cocoa-500">
            {resolveValue(toastItem.message, toastItem)}
          </div>
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(toastItem.id)}
          className="rounded-md p-1 text-cocoa-300 transition hover:bg-[#f3eee9] hover:text-cocoa-700"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {toastItem.type !== 'loading' && (
        <span className="mt-4 block h-1 overflow-hidden rounded-full bg-cocoa-100">
          <span
            className={`block h-full origin-left rounded-full ${tone.progress} evento-toast-progress`}
            style={{ animationDuration: `${duration}ms` }}
          />
        </span>
      )}
    </div>
  );
};

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
    <div className="flex min-h-screen flex-col bg-[#fbf8f4] text-cocoa-900 transition-colors duration-300">
      <Navbar />
      <main className="flex-grow">
        <AnimatedRoutes />
      </main>
      {!hideFooter && <Footer />}
      <Toaster 
        position="top-right"
        gutter={14}
        containerStyle={{
          top: 88,
          right: 20
        }}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'transparent',
            boxShadow: 'none',
            padding: 0,
          },
          success: {
            duration: 3200,
          },
          error: {
            duration: 4500,
          },
        }}
      >
        {EventoToast}
      </Toaster>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
