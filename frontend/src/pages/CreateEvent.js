import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Calendar, Clock, MapPin, IndianRupee, Users, Image, Tag, ArrowLeft } from 'lucide-react';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    location: '',
    category: 'Music',
    image: '',
    price: '',
    totalTickets: '',
    tags: ''
  });

  const categories = ['Music', 'Sports', 'Technology', 'Business', 'Art', 'Food', 'Other'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const eventData = {
        ...formData,
        price: Number(formData.price),
        totalTickets: Number(formData.totalTickets),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      await api.post('/events', eventData);
      toast.success('Event created successfully!');
      navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-primary-600 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Event</h1>
          <p className="text-gray-600 mb-8">Fill in the details to create a new event</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="label">
                Event Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Enter event title"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="label">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="input-field"
                placeholder="Describe your event..."
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="date" className="label">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Event Date *
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="time" className="label">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Event Time *
                </label>
                <input
                  id="time"
                  name="time"
                  type="text"
                  value={formData.time}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="e.g., 09:00 AM"
                />
              </div>
            </div>

            {/* Venue and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="venue" className="label">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Venue *
                </label>
                <input
                  id="venue"
                  name="venue"
                  type="text"
                  value={formData.venue}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="e.g., Convention Center"
                />
              </div>

              <div>
                <label htmlFor="location" className="label">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Location *
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="e.g., San Francisco, CA"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="label">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="input-field"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Image URL */}
            <div>
              <label htmlFor="image" className="label">
                <Image className="h-4 w-4 inline mr-1" />
                Image URL
              </label>
              <input
                id="image"
                name="image"
                type="url"
                value={formData.image}
                onChange={handleChange}
                className="input-field"
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave empty to use default image
              </p>
            </div>

            {/* Price and Tickets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="price" className="label">
                  <IndianRupee className="h-4 w-4 inline mr-1" />
                  Ticket Price (₹) *
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label htmlFor="totalTickets" className="label">
                  <Users className="h-4 w-4 inline mr-1" />
                  Total Tickets *
                </label>
                <input
                  id="totalTickets"
                  name="totalTickets"
                  type="number"
                  min="1"
                  value={formData.totalTickets}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="100"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="label">
                <Tag className="h-4 w-4 inline mr-1" />
                Tags
              </label>
              <input
                id="tags"
                name="tags"
                type="text"
                value={formData.tags}
                onChange={handleChange}
                className="input-field"
                placeholder="tech, conference, networking (comma separated)"
              />
              <p className="text-sm text-gray-500 mt-1">
                Separate tags with commas
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary"
              >
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
