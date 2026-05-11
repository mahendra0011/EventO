import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import EventCard from '../components/EventCard';
import { Search, Filter, X, CalendarDays, SlidersHorizontal, ArrowLeft, ArrowRight } from 'lucide-react';

const Events = () => {
  const [searchParams] = useSearchParams();
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
  }, [searchTerm, selectedCategory, currentPage]);

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
    setCurrentPage(1);
  };

  const hasFilters = Boolean(searchTerm || selectedCategory);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/55" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary-100 backdrop-blur">
              <CalendarDays className="h-4 w-4" />
              Curated experiences
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Browse events that feel worth showing up for.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
              Search concerts, conferences, workshops, sports, food events, and local meetups with clean filters and quick ticket access.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <form onSubmit={handleSearch} className="surface-panel p-4 md:p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
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
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <SlidersHorizontal className="h-4 w-4 text-primary-600" />
                Categories
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    type="button"
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                      selectedCategory === category
                        ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="section-kicker">
              <Filter className="h-3.5 w-3.5" />
              {hasFilters ? 'Filtered events' : 'All events'}
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">
              {selectedCategory ? `${selectedCategory} events` : 'Available events'}
            </h2>
          </div>
          <p className="text-sm font-medium text-slate-500">
            {loading ? 'Loading events...' : `${events.length} result${events.length === 1 ? '' : 's'} on page ${currentPage}`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="surface-panel overflow-hidden">
                <div className="h-56 animate-pulse bg-slate-200" />
                <div className="space-y-4 p-5">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                  <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event, index) => (
                <EventCard key={event._id} event={event} index={index} />
              ))}
            </div>

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
                        ? 'border-slate-950 bg-slate-950 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-primary-200 hover:text-primary-700'
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
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-950">No events found</h3>
            <p className="mx-auto mt-2 max-w-md text-slate-500">
              Try a different search term, clear the category, or check back after hosts publish more events.
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
