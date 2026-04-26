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
    <div className="min-h-screen bg-[#0d1117] overflow-hidden flex flex-col">
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
          <div className="flex flex-col bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
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
