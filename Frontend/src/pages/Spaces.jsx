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
    let socket = getSocket();
    
    // If socket not ready yet, wait for it to be ready
    if (!socket || !socket.connected) {
      console.log("⏳ Spaces: Socket not ready yet, polling for connection. Socket exists:", !!socket, "Connected:", socket?.connected);
      const checkSocket = setInterval(() => {
        socket = getSocket();
        if (socket?.connected) {
          console.log("✅ Spaces: Socket is now ready, clearing interval");
          clearInterval(checkSocket);
          setupSocketListeners(socket);
        }
      }, 100);
      
      return () => clearInterval(checkSocket);
    }

    // Socket exists and is connected, set up listeners
    console.log("✅ Spaces: Socket already connected, setting up listeners");
    const cleanup = setupSocketListeners(socket);
    return cleanup;

    function setupSocketListeners(socket) {
      console.log("🔌 Spaces: Setting up socket listeners");

      const handleProjectCreated = (project) => {
        console.log("🏢 New project created via socket:", project);
        handleAuthAndFetch();
      };

      const handleProjectUpdated = (project) => {
        console.log("🏢 Project updated via socket:", project);
        setSpaces((prev) =>
          prev.map((p) => (p.id === project.id ? project : p))
        );
      };

      socket.on("projectCreated", handleProjectCreated);
      socket.on("projectUpdated", handleProjectUpdated);
      console.log("🏢 Spaces: Socket listeners registered");

      return () => {
        console.log("🧹 Spaces: Cleaning up socket listeners");
        socket.off("projectCreated", handleProjectCreated);
        socket.off("projectUpdated", handleProjectUpdated);
      };
    }
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