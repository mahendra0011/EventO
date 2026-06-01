import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Calendar, Clock, MapPin, IndianRupee, Users, Image, Tag, ArrowLeft, FileText, ShieldCheck, Plus, Trash2 } from 'lucide-react';

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
    eventType: 'Concert',
    image: '',
    price: '',
    totalTickets: '',
    budget: '',
    termsAndConditions: '',
    venuePermissionUrl: '',
    licenseDetails: '',
    ownershipProofUrl: '',
    onGroundContactName: '',
    onGroundContactPhone: '',
    crowdManagementPlan: '',
    gateInstructions: '',
    tags: ''
  });
  const [ticketCategories, setTicketCategories] = useState([
    { name: 'General', description: '', price: '', quantity: '' }
  ]);

  const [categories, setCategories] = useState(['Music', 'Sports', 'Technology', 'Business', 'Art', 'Food', 'Other']);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/events/categories');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setCategories(res.data);
          setFormData((prev) => ({
            ...prev,
            category: res.data.includes(prev.category) ? prev.category : res.data[0]
          }));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleTicketCategoryChange = (index, field, value) => {
    setTicketCategories((prev) => prev.map((category, categoryIndex) => (
      categoryIndex === index ? { ...category, [field]: value } : category
    )));
  };

  const addTicketCategory = () => {
    setTicketCategories((prev) => [...prev, { name: '', description: '', price: '', quantity: '' }]);
  };

  const removeTicketCategory = (index) => {
    setTicketCategories((prev) => prev.length === 1 ? prev : prev.filter((_, categoryIndex) => categoryIndex !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedTicketCategories = ticketCategories
        .map((category) => ({
          name: category.name.trim(),
          description: category.description.trim(),
          price: Number(category.price),
          quantity: Number(category.quantity)
        }))
        .filter((category) => category.name && category.quantity > 0 && category.price >= 0);

      if (normalizedTicketCategories.length === 0) {
        toast.error('Add at least one valid ticket category');
        setLoading(false);
        return;
      }

      const totalTicketCount = normalizedTicketCategories.reduce((sum, category) => sum + category.quantity, 0);
      const basePrice = normalizedTicketCategories[0]?.price || 0;

      const eventData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        venue: formData.venue,
        location: formData.location,
        category: formData.category,
        eventType: formData.eventType,
        price: basePrice,
        totalTickets: totalTicketCount,
        ticketCategories: normalizedTicketCategories,
        budget: Number(formData.budget || 0),
        termsAndConditions: formData.termsAndConditions,
        venuePermissionUrl: formData.venuePermissionUrl,
        licenseDetails: formData.licenseDetails,
        ownershipProofUrl: formData.ownershipProofUrl,
        onGroundContactName: formData.onGroundContactName,
        onGroundContactPhone: formData.onGroundContactPhone,
        crowdManagementPlan: formData.crowdManagementPlan,
        gateInstructions: formData.gateInstructions,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
      };

      // Only add image if provided
      if (formData.image && formData.image.trim()) {
        eventData.image = formData.image.trim();
      }

      await api.post('/events', eventData);
      toast.success('Event submitted for review. Ticket sales go live after approval.');
      navigate('/host');
    } catch (error) {
      console.error('Create event error:', error);
      toast.error(error.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf8f4] py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-cocoa-500 hover:text-primary-600 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-cocoa-900 mb-2">Create New Event</h1>
          <p className="text-cocoa-500 mb-8">Fill in the details to create a new event</p>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div>
                <label htmlFor="eventType" className="label">
                  Event Type *
                </label>
                <select
                  id="eventType"
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  {['Concert', 'Workshop', 'Stand-up Comedy', 'Conference', 'Sports', 'Festival', 'Screening', 'Other'].map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
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
              <p className="text-sm text-cocoa-400 mt-1">
                Leave empty to use default image
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="budget" className="label">
                  <IndianRupee className="h-4 w-4 inline mr-1" />
                  Planned Budget
                </label>
                <input
                  id="budget"
                  name="budget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.budget}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Estimated event budget"
                />
              </div>

              <div>
                <label htmlFor="venuePermissionUrl" className="label">
                  <ShieldCheck className="h-4 w-4 inline mr-1" />
                  Venue Permission URL
                </label>
                <input
                  id="venuePermissionUrl"
                  name="venuePermissionUrl"
                  type="url"
                  value={formData.venuePermissionUrl}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="ownershipProofUrl" className="label">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Ownership / Permission Proof URL
                </label>
                <input
                  id="ownershipProofUrl"
                  name="ownershipProofUrl"
                  type="url"
                  value={formData.ownershipProofUrl}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label htmlFor="licenseDetails" className="label">
                  Required Licenses / Permissions
                </label>
                <input
                  id="licenseDetails"
                  name="licenseDetails"
                  value={formData.licenseDetails}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Music license, police NOC, venue NOC..."
                />
              </div>
            </div>

            <div className="rounded-lg border border-cocoa-100 bg-[#fbf8f4] p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-cocoa-900">Ticket Categories</h2>
                  <p className="text-sm font-semibold text-cocoa-500">Create VIP, General, Early Bird, or custom ticket slabs.</p>
                </div>
                <button type="button" onClick={addTicketCategory} className="btn-secondary px-4 py-2 text-sm">
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
              <div className="space-y-4">
                {ticketCategories.map((ticketCategory, index) => (
                  <div key={index} className="grid gap-3 rounded-lg border border-white bg-white p-4 md:grid-cols-[1fr_0.8fr_0.8fr_auto]">
                    <div>
                      <label className="label">Name</label>
                      <input value={ticketCategory.name} onChange={(e) => handleTicketCategoryChange(index, 'name', e.target.value)} required className="input-field" placeholder="General" />
                    </div>
                    <div>
                      <label className="label">Price</label>
                      <input type="number" min="0" value={ticketCategory.price} onChange={(e) => handleTicketCategoryChange(index, 'price', e.target.value)} required className="input-field" placeholder="499" />
                    </div>
                    <div>
                      <label className="label">Quantity</label>
                      <input type="number" min="1" value={ticketCategory.quantity} onChange={(e) => handleTicketCategoryChange(index, 'quantity', e.target.value)} required className="input-field" placeholder="100" />
                    </div>
                    <button type="button" onClick={() => removeTicketCategory(index)} disabled={ticketCategories.length === 1} className="self-end rounded-lg border border-red-100 p-3 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40" title="Remove ticket category">
                      <Trash2 className="h-5 w-5" />
                    </button>
                    <div className="md:col-span-4">
                      <label className="label">Description</label>
                      <input value={ticketCategory.description} onChange={(e) => handleTicketCategoryChange(index, 'description', e.target.value)} className="input-field" placeholder="Includes front rows, refreshments, or access notes" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="onGroundContactName" className="label">
                  <Users className="h-4 w-4 inline mr-1" />
                  On-ground Contact Name
                </label>
                <input id="onGroundContactName" name="onGroundContactName" value={formData.onGroundContactName} onChange={handleChange} className="input-field" placeholder="Operations lead" />
              </div>
              <div>
                <label htmlFor="onGroundContactPhone" className="label">
                  On-ground Contact Phone
                </label>
                <input id="onGroundContactPhone" name="onGroundContactPhone" value={formData.onGroundContactPhone} onChange={handleChange} className="input-field" placeholder="+91..." />
              </div>
            </div>

            <div>
              <label htmlFor="crowdManagementPlan" className="label">Crowd Management Plan</label>
              <textarea id="crowdManagementPlan" name="crowdManagementPlan" value={formData.crowdManagementPlan} onChange={handleChange} rows={3} className="input-field" placeholder="Security, queues, support desk, emergency handling..." />
            </div>

            <div>
              <label htmlFor="gateInstructions" className="label">Gate / QR Scanning Instructions</label>
              <textarea id="gateInstructions" name="gateInstructions" value={formData.gateInstructions} onChange={handleChange} rows={3} className="input-field" placeholder="Entry gate, check-in timing, wristband or ID verification notes..." />
            </div>

            <div>
              <label htmlFor="termsAndConditions" className="label">Terms and Conditions</label>
              <textarea id="termsAndConditions" name="termsAndConditions" value={formData.termsAndConditions} onChange={handleChange} rows={4} className="input-field" placeholder="Refund rules, age limits, prohibited items, organizer terms..." />
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
              <p className="text-sm text-cocoa-400 mt-1">
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
