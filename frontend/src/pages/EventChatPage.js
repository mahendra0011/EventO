import React, { useCallback, useEffect, useState } from 'react';
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

  const fetchEvent = useCallback(async () => {
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
  }, [eventId]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#fbf8f4]">
        <div className="text-center">
          <div className="mx-auto mb-3 h-12 w-12 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500"></div>
          <p className="text-sm text-cocoa-500">Loading event chat...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#fbf8f4]">
        <div className="text-center">
          <MessageCircle className="mx-auto mb-3 h-12 w-12 text-cocoa-300" />
          <h2 className="mb-2 text-xl font-bold text-cocoa-900">Event not found</h2>
          <p className="mb-4 text-sm text-cocoa-500">The event you're looking for doesn't exist.</p>
          <Link to="/dashboard" className="btn-primary">
            <ArrowLeft className="h-4 w-4 inline mr-1.5" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0 flex-col overflow-hidden bg-[#fbf8f4]">
      {/* Main Content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col px-4 py-4 sm:px-6 sm:py-5">
          {/* Breadcrumb */}
          <button
            onClick={() => navigate(-1)}
            className="mb-3 flex flex-shrink-0 items-center text-sm font-bold text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to {userRole === 'host' ? 'Host Panel' : 'Dashboard'}
          </button>

          {/* Page Header */}
          <div className="mb-4 flex flex-shrink-0 flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-extrabold text-cocoa-900 sm:text-3xl">Community Chat</h1>
              <p className="mt-1 text-sm text-cocoa-500">{event.title} &bull; {new Date(event.date).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-cocoa-100 bg-white px-3 py-1.5 text-sm font-semibold text-cocoa-500 shadow-sm">
                <Users className="h-4 w-4 text-primary-500" />
                <span>Confirmed attendees can participate</span>
              </div>
            </div>
          </div>

          {/* Chat Card */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-white bg-white shadow-2xl shadow-cocoa-900/10">
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
