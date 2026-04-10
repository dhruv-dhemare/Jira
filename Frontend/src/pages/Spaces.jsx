import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import SpaceCard from "../components/SpaceCard";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { getSocket } from "../socket/socket";
import "../styles/spaces.css";

export default function Spaces() {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // 🔐 Auth check (React-friendly)
  useEffect(() => {
    // Check localStorage first, then check URL for token
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    console.log("urlToken:", urlToken); 
    
    if (!localStorage.getItem("token") && !urlToken) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    handleAuthAndFetch();
  }, []);

  const handleAuthAndFetch = async () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token);
      window.history.replaceState({}, document.title, "/spaces");
    }

    try {
      const [projectsRes, userRes] = await Promise.all([
        api.get("/projects"),
        api.get("/users/me"),
      ]);

      setSpaces(projectsRes.data);
      setUser(userRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  // WebSocket listeners for real-time project updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket?.connected) return;

    const handleProjectCreated = (project) => {
      console.log("🏢 New project created:", project);
      handleAuthAndFetch();
    };

    const handleProjectUpdated = (project) => {
      console.log("🏢 Project updated:", project);
      setSpaces((prev) =>
        prev.map((p) => (p.id === project.id ? project : p))
      );
    };

    socket.on("projectCreated", handleProjectCreated);
    socket.on("projectUpdated", handleProjectUpdated);

    return () => {
      socket.off("projectCreated", handleProjectCreated);
      socket.off("projectUpdated", handleProjectUpdated);
    };
  }, []);

  // 📅 Format date helper
  const formatDate = (date) => {
    if (!date) return "--";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // ➕ Create project (basic for now)
  // const createSpace = async () => {
  //   try {
  //     const res = await api.post("/projects", {
  //       name: "New Project",
  //       description: "Test project",
  //       start_date: new Date().toISOString().split("T")[0],
  //       end_date: null,
  //     });

  //     setSpaces((prev) => [...prev, res.data]);
  //   } catch (err) {
  //     console.error("Create project failed", err);
  //   }
  // };

  return (
    <div className="layout">
      <Navbar />

      <div className="main">
        <Sidebar />

        <div className="content">
          <div className="content-header">
            <div>
              <h2>Spaces</h2>
            </div>

            {user?.role === "manager" && (
              <button
                className="create-btn"
                onClick={() => navigate("/create-space")}
              >
                + Create Space
              </button>
            )}
          </div>

          {/* 🔄 Loading */}
          {loading && <p>Loading projects...</p>}

          {/* ❌ Empty */}
          {!loading && spaces.length === 0 && (
            <p>No projects yet. Create one 🚀</p>
          )}

          {/* ✅ Projects Grid */}
          <div className="grid">
            {spaces.map((space) => (
              <SpaceCard
                key={space.id}
                title={space.name}
                desc={space.description || "No description"}
                members={"--"} // can upgrade later
                date={
                  space.end_date
                    ? `Deadline: ${formatDate(space.end_date)}`
                    : `Created: ${formatDate(space.created_at)}`
                }
                type={space.status?.toUpperCase() || "ACTIVE"}
                onClick={() => navigate(`/spaces/${space.id}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}