import React from "react";
import "../styles/eventModal.css";

const EventModal = ({ event, onClose }) => {
  if (!event) return null;

  // Format date display
  const formatDate = (dateString) => {
    const date = new Date(dateString.split("T")[0] + "T00:00:00");
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  const startDate = formatDate(event.startDate);
  const endDate = formatDate(event.endDate);

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "#9ca3af";
      case "ongoing":
        return "#16a34a";
      case "upcoming":
        return "#2563eb";
      default:
        return "#6b7280";
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose}></div>

      {/* Modal */}
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title">{event.title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {event.desc && (
            <div className="modal-section">
              <p className="modal-description">{event.desc}</p>
            </div>
          )}

          <div className="modal-section">
            <div className="modal-row">
              <span className="modal-label">Duration:</span>
              <span className="modal-value">{startDate} — {endDate}</span>
            </div>
          </div>

          <div className="modal-section">
            <div className="modal-row">
              <span className="modal-label">Status:</span>
              <span 
                className="modal-status" 
                style={{ backgroundColor: getStatusColor(event.status) }}
              >
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EventModal;
