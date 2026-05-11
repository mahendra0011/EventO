import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, IndianRupee, Ticket, Heart, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { addToWishlist, removeFromWishlist, checkWishlist } from '../utils/api';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80';

const EventCard = ({ event, index = 0 }) => {
  const { user } = useAuth();
  const [inWishlist, setInWishlist] = useState(false);

  useEffect(() => {
    if (user && event?._id) {
      checkWishlist(event._id)
        .then(res => setInWishlist(res.inWishlist))
        .catch(err => {
          console.error('Wishlist check failed:', err);
        });
    }
  }, [user, event?._id]);

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }

    try {
      if (inWishlist) {
        await removeFromWishlist(event._id);
        setInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(event._id);
        setInWishlist(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const availableTickets = Number(event.availableTickets ?? 0);
  const isSoldOut = availableTickets === 0;
  const isLowStock = availableTickets > 0 && availableTickets <= 10;
  const image = event.image || FALLBACK_IMAGE;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: index * 0.06,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className="card group flex h-full flex-col"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-cocoa-100">
        <Link to={`/events/${event._id}`} className="block h-full" aria-label={`View ${event.title}`}>
            <img
              src={image}
              alt={event.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cocoa-900/35 via-transparent to-transparent" />
        </Link>

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-extrabold text-primary-600 shadow-sm backdrop-blur">
            {event.category}
          </span>
          {isLowStock && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-700 shadow-sm">
              {availableTickets} left
            </span>
          )}
          {isSoldOut && (
            <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
              Sold out
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleWishlist}
          className={`absolute right-4 top-4 rounded-lg p-2.5 shadow-sm transition-all ${
            inWishlist
              ? 'bg-red-500 text-white'
              : 'bg-white/95 text-cocoa-500 hover:text-red-500'
          }`}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className="h-4 w-4" fill={inWishlist ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link to={`/events/${event._id}`}>
              <h3 className="line-clamp-1 text-lg font-black tracking-tight text-cocoa-900 transition-colors group-hover:text-primary-600">
                {event.title}
              </h3>
            </Link>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-cocoa-500">
              {event.description}
            </p>
          </div>
        </div>

        <div className="space-y-3 text-sm font-semibold text-cocoa-500">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
              <Calendar className="h-4 w-4" />
            </span>
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Clock className="h-4 w-4" />
            </span>
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <MapPin className="h-4 w-4" />
            </span>
            <span className="line-clamp-1">{event.venue}, {event.location}</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-4 border-t border-cocoa-100 pt-5">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-cocoa-300">From</p>
            <div className="mt-1 flex items-center text-xl font-black text-primary-500">
              <IndianRupee className="h-5 w-5" />
              <span>{Number(event.price || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
            isSoldOut
              ? 'bg-red-50 text-red-700'
              : 'bg-emerald-50 text-emerald-700'
          }`}>
            <Ticket className="h-3.5 w-3.5" />
            {isSoldOut ? 'Unavailable' : `${availableTickets} tickets`}
          </span>
        </div>

        <Link to={`/events/${event._id}`} className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-primary-600">
          View details
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </motion.article>
  );
};

export default EventCard;
