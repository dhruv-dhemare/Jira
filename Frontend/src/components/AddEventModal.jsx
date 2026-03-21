import React, { useState } from "react";
import api from "../api/axios";
import "../styles/eventModal.css";

const AddEventModal = ({ onClose, onEventAdded }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      setError("Event title is required");
      return;
    }

    if (!formData.start_date) {
      setError("Start date is required");
      return;
    }

    if (!formData.end_date) {
      setError("End date is required");
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      setError("Start date must be before end date");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/competitions", {
        name: formData.name,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
      });

      if (response.data) {
        onEventAdded();
        onClose();
      }
    } catch (err) {
      console.error("Error creating competition:", err);
      setError(err.response?.data?.error || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose}></div>

      {/* Modal */}
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title">Add Event to Timeline</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="form-error">{error}</div>}

          {/* Event Title */}
          <div className="modal-section">
            <label className="form-label">Event Title *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter event title"
              className="form-input"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="modal-section">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter event description (optional)"
              className="form-textarea"
              rows="4"
              maxLength={500}
            />
          </div>

          {/* Start Date */}
          <div className="modal-section">
            <label className="form-label">Start Date *</label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          {/* End Date */}
          <div className="modal-section">
            <label className="form-label">End Date *</label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          {/* Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? "Creating..." : "Add Event"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddEventModal;
