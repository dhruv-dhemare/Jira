import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import TimelineGrid from "../components/TimelineGrid";
import EventModal from "../components/EventModal";
import AddEventModal from "../components/AddEventModal";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";
import { getSocket } from "../socket/socket";
import "../styles/timeline.css";

const Timeline = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [user, setUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchCompetitions();
    fetchUser();
  }, []);

  // WebSocket listeners for real-time updates
  useEffect(() => {
    let socket = getSocket();
    
    // If socket not ready yet, wait for it to be ready
    if (!socket || !socket.connected) {
      console.log("⏳ Timeline: Socket not ready yet, polling for connection. Socket exists:", !!socket, "Connected:", socket?.connected);
      const checkSocket = setInterval(() => {
        socket = getSocket();
        if (socket?.connected) {
          console.log("✅ Timeline: Socket is now ready, clearing interval");
          clearInterval(checkSocket);
          setupSocketListeners(socket);
        }
      }, 100);
      
      return () => clearInterval(checkSocket);
    }

    // Socket exists and is connected, set up listeners
    console.log("✅ Timeline: Socket already connected, setting up listeners");
    const cleanup = setupSocketListeners(socket);
    return cleanup;

    function setupSocketListeners(socket) {
      console.log("🔌 Timeline: Setting up socket listeners");

      const handleCompetitionCreated = (competition) => {
        console.log("🎯 Competition created via socket:", competition);
        fetchCompetitions();
      };

      socket.on("competitionCreated", handleCompetitionCreated);
      console.log("🎯 Timeline: Socket listener 'competitionCreated' registered");

      return () => {
        console.log("🧹 Timeline: Cleaning up socket listeners");
        socket.off("competitionCreated", handleCompetitionCreated);
      };
    }
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get("/users/me");
      setUser(res.data);
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

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
            
            {/* Add Event Button - Only visible to managers */}
            {!loading && user?.role === "manager" && (
              <button 
                className="btn-add-event" 
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={15} />
                Add Event
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Event View Modal */}
      {selectedEvent && (
        <EventModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <AddEventModal 
          onClose={() => setShowAddModal(false)}
          onEventAdded={fetchCompetitions}
        />
      )}
    </div>
  );
};

export default Timeline;