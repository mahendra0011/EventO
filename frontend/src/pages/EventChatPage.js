import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import EventChat from '../components/EventChat';
import { ArrowLeft, Users, MessageCircle, AlertCircle } from 'lucide-react';

const EventChatPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine user role
  const userRole = user?.role || 'user';

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading event chat...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-serif text-white mb-2">Event not found</h2>
          <p className="text-slate-400 mb-6">The event you're looking for doesn't exist.</p>
          <Link to="/dashboard" className="btn-primary">
            <ArrowLeft className="h-4 w-4 inline mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-slate-400 hover:text-amber-500 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to {userRole === 'host' ? 'Host Panel' : 'Dashboard'}
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif text-white tracking-tight">
                Community Chat
              </h1>
              <p className="text-slate-400 mt-1">
                {event.title} • {new Date(event.date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-amber-500" />
                  <span className="text-slate-300">
                    Confirmed attendees can participate
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-2xl overflow-hidden shadow-2xl h-[calc(100vh-10rem)]">
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
  );
};

export default EventChatPage;
