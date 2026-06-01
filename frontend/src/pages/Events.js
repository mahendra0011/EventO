import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import EventCard from '../components/EventCard';
import { useCity } from '../context/CityContext';
import { Search, Filter, X, CalendarDays, SlidersHorizontal, ArrowLeft, ArrowRight, MapPin, Sparkles, Ticket, Users } from 'lucide-react';

const browseStats = [
  { icon: Ticket, value: 'Fast', label: 'ticket access' },
  { icon: MapPin, value: 'Local', label: 'city filters' },
  { icon: Users, value: 'Live', label: 'event communities' }
];

const revealContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07
    }
  }
};

const revealItem = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

const Events = () => {
  const [searchParams] = useSearchParams();
  const { selectedCity, clearCity } = useCity();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [categories, setCategories] = useState(['Music', 'Sports', 'Technology', 'Business', 'Art', 'Food', 'Other']);

  useEffect(() => {
    fetchEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategory, selectedCity?.city, currentPage]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/events/categories');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setCategories(res.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedCity?.city) params.append('city', selectedCity.city);
      params.append('page', currentPage);
      params.append('limit', 9);

      const res = await api.get(`/events?${params.toString()}`);
      setEvents(res.data.events || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEvents();
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    clearCity();
    setCurrentPage(1);
  };

  const hasFilters = Boolean(searchTerm || selectedCategory || selectedCity);

  return (
    <div className="min-h-screen bg-[#fbf8f4]">
      <section className="subtle-grid relative overflow-hidden bg-gradient-to-br from-primary-50 via-[#fff8f2] to-[#fbf8f4]">
        <div
          className="absolute inset-y-0 right-0 hidden w-1/2 bg-cover bg-center opacity-25 lg:block"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80')" }}
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <span className="section-kicker">
              <CalendarDays className="h-4 w-4" />
              Curated experiences
            </span>
            <h1 className="text-4xl font-extrabold text-cocoa-900 sm:text-5xl lg:text-6xl">
              Browse events that feel worth showing up for.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-cocoa-500">
              Search concerts, conferences, workshops, sports, food events, and local meetups with clean filters and quick ticket access.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="hidden rounded-lg border border-white bg-white/85 p-5 shadow-2xl shadow-cocoa-900/10 backdrop-blur lg:block"
          >
            <div className="overflow-hidden rounded-lg">
              <img
                src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=85"
                alt="Guests at an event"
                className="h-56 w-full object-cover"
              />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {browseStats.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + index * 0.08, duration: 0.4 }}
                  className="rounded-lg bg-[#fbf8f4] p-4"
                >
                  <item.icon className="mb-3 h-5 w-5 text-primary-600" />
                  <p className="font-extrabold text-cocoa-900">{item.value}</p>
                  <p className="text-xs font-bold uppercase text-cocoa-400">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-cocoa-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.45 }}
            className="surface-panel p-4 md:p-5"
          >
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cocoa-300" />
                <input
                  type="text"
                  placeholder="Search by title, venue, city, or description"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-12 pr-4"
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                {hasFilters && (
                  <button type="button" onClick={clearFilters} className="btn-secondary px-4 py-3">
                    <X className="h-4 w-4" />
                    Clear
                  </button>
                )}
                <button type="submit" className="btn-primary px-6 py-3">
                  <Search className="h-4 w-4" />
                  Search
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex items-center gap-2 text-sm font-extrabold text-cocoa-700">
                <SlidersHorizontal className="h-4 w-4 text-primary-600" />
                Categories
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <motion.button
                    type="button"
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                      selectedCategory === category
                        ? 'border-primary-500 bg-primary-500 text-white shadow-sm'
                        : 'border-cocoa-100 bg-[#f7f3ee] text-cocoa-600 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600'
                    }`}
                  >
                    {category}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="section-kicker">
              {hasFilters ? <Filter className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
              {hasFilters ? 'Filtered events' : 'All events'}
            </div>
            <h2 className="text-3xl font-extrabold text-cocoa-900">
              {selectedCategory
                ? `${selectedCategory} events${selectedCity ? ` in ${selectedCity.city}` : ''}`
                : selectedCity ? `Events in ${selectedCity.city}` : 'Available events'}
            </h2>
            {selectedCity && (
              <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-sm font-bold text-primary-700">
                <MapPin className="h-4 w-4" />
                {selectedCity.city}
                <span className="text-primary-400">/</span>
                {selectedCity.state}
              </p>
            )}
          </div>
          <p className="text-sm font-bold text-cocoa-400">
            {loading ? 'Loading events...' : `${events.length} result${events.length === 1 ? '' : 's'} on page ${currentPage}`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="surface-panel overflow-hidden">
                <div className="h-56 animate-pulse bg-cocoa-100" />
                <div className="space-y-4 p-5">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-cocoa-100" />
                  <div className="h-4 w-full animate-pulse rounded bg-primary-50" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-primary-50" />
                  <div className="h-10 w-full animate-pulse rounded bg-primary-50" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <>
            <motion.div
              variants={revealContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
            >
              {events.map((event, index) => (
                <motion.div key={event._id} variants={revealItem}>
                  <EventCard event={event} index={index} />
                </motion.div>
              ))}
            </motion.div>

            {totalPages > 1 && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary px-4 py-2.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    type="button"
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`h-11 min-w-11 rounded-lg border px-4 text-sm font-bold transition-all ${
                      currentPage === i + 1
                        ? 'border-primary-500 bg-primary-500 text-white'
                        : 'border-cocoa-100 bg-white text-cocoa-700 hover:border-primary-200 hover:text-primary-600'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary px-4 py-2.5"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="surface-panel py-16 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-lg bg-primary-50 text-primary-400">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-extrabold text-cocoa-900">No events found</h3>
            <p className="mx-auto mt-2 max-w-md text-cocoa-500">
              Try a different search term, change the city from the navbar, clear filters, or check back after hosts publish more events.
            </p>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="btn-primary mt-6">
                <X className="h-4 w-4" />
                Clear filters
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default Events;
