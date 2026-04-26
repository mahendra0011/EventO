import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import EventChat from '../components/EventChat';
import { ArrowLeft, Users, MessageCircle } from 'lucide-react';

const EventChatPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userRole = user?.role || 'user';

  useEffect(() => { fetchEvent(); }, [eventId]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/events/${eventId}`);
      setEvent(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('Event not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-3"></div>
          <p className="text-[#8b949e] text-sm">Loading event chat...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-[#484f58] mx-auto mb-3" />
          <h2 className="text-xl font-serif text-white mb-2">Event not found</h2>
          <p className="text-[#8b949e] mb-4 text-sm">The event you're looking for doesn't exist.</p>
          <Link to="/dashboard" className="btn-primary">
            <ArrowLeft className="h-4 w-4 inline mr-1.5" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      {/* Navbar */}
      <nav className="h-14 bg-[#161b22] border-b border-[#30363d] px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
              <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
              <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
              <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
              <line x1="3" y1="14" x2="21" y2="14" strokeWidth="2"/>
              <line x1="3" y1="18" x2="21" y2="18" strokeWidth="2"/>
            </svg>
          </div>
          <span className="text-[#58a6ff] font-medium text-lg">Evento</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-[#8b949e] hover:text-[#e6edf3] text-sm">Home</a>
          <a href="/events" className="text-[#8b949e] hover:text-[#e6edf3] text-sm">Events</a>
          <a href="/host" className="flex items-center gap-1.5 text-[#8b949e] hover:text-[#e6edf3] text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" strokeWidth="2"/>
              <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Host Panel
          </a>
          <button className="relative p-2 text-[#8b949e] hover:bg-[#21262d] rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeWidth="2" strokeLinecap="round"/>
              <path d="M13.73 21a2 2 0 01-3.46 0" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="absolute top-1 right-1 w-4 h-4 bg-[#f85149] text-white text-xs rounded-full flex items-center justify-center">5</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-[#8b949e] hover:bg-[#21262d] rounded-lg text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeWidth="2" strokeLinecap="round"/>
              <polyline points="16,17 21,12 16,7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="21" y1="12" x2="9" y2="12" strokeWidth="2"/>
            </svg>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 py-6 h-full flex flex-col">
          {/* Breadcrumb */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-[#58a6ff] hover:underline mb-4 text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to {userRole === 'host' ? 'Host Panel' : 'Dashboard'}
          </button>

          {/* Page Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-[#e6edf3]">Community Chat</h1>
              <p className="text-sm text-[#8b949e] mt-0.5">{event.title} • {new Date(event.date).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161b22] border border-[#30363d] rounded-full text-sm text-[#8b949e]">
                <Users className="h-4 w-4 text-amber-500" />
                <span>Confirmed attendees can participate</span>
              </div>
            </div>
          </div>

          {/* Chat Card */}
          <div className="flex-1 min-h-0 bg-[#161b22] border border-[#30363d] rounded-xl flex flex-col overflow-hidden">
            <EventChat
              eventId={eventId}
              eventTitle={event.title}
              currentUser={{
                id: user._id,
                name: user.name,
                role: user.role
              }}
              userRole={userRole}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventChatPage;
