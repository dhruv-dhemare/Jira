import React, { useState, useEffect } from "react";
import TimelineGrid from "../components/TimelineGrid";
import EventModal from "../components/EventModal";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";
import "../styles/timeline.css";

const Timeline = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/competitions");
      
      // Transform API response to component format
      const transformedEvents = res.data.map((comp) => ({
        id: comp.id,
        title: comp.name,
        desc: comp.description || "",
        startDate: comp.start_date,  // Keep as string (YYYY-MM-DD)
        endDate: comp.end_date,      // Keep as string (YYYY-MM-DD)
        status: comp.status === "complete" ? "completed" : comp.status,
      }));
      
      setEvents(transformedEvents);
      setError(null);
    } catch (err) {
      console.error("Error fetching competitions:", err);
      setError("Failed to load competitions");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout">
      <Navbar />

      <div className="main">
        <Sidebar />

        <div className="content">
          <div className="content-header">
            <h2>Timeline</h2>
            {loading && <p>Loading competitions...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            {!loading && <TimelineGrid events={events} onEventSelect={setSelectedEvent} />}
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {selectedEvent && (
        <EventModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}
    </div>
  );
};

export default Timeline;