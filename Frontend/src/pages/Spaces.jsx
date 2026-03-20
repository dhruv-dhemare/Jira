import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import SpaceCard from "../components/SpaceCard";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import "../styles/spaces.css";

export default function Spaces() {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  if (!localStorage.getItem("token")) {
    window.location.href = "/";
  }

  useEffect(() => {
    handleAuthAndFetch();
  }, []);

  const handleAuthAndFetch = async () => {
    // 🔑 Extract token from URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token);
      window.history.replaceState({}, document.title, "/spaces");
    }
    

    try {
      const res = await api.get("/projects");
      setSpaces(res.data);
    } catch (err) {
      console.error("Failed to fetch projects", err);
    } finally {
      setLoading(false);
    }
  };

  const createSpace = async () => {
  try {
    const res = await api.post("/projects", {
      name: "New Project",
      description: "Test project",
    });

    setSpaces((prev) => [...prev, res.data]);
  } catch (err) {
    console.error(err);
  }
};

// useEffect(() => {
//   console.log("Spaces loaded");
//   console.log("URL:", window.location.href);

//   const params = new URLSearchParams(window.location.search);
//   const token = params.get("token");

//   console.log("TOKEN FROM URL:", token);

//   if (token) {
//     localStorage.setItem("token", token);
//     window.history.replaceState({}, document.title, "/spaces");
//   }
// }, []);

  return (
    <div className="layout">
      <Navbar />

      <div className="main">
        <Sidebar />

        <div className="content">
          <div className="content-header">
            <div>
              <h2>Spaces</h2>
              <p>Manage your robotics projects</p>
            </div>

            <button className="create-btn" onClick={createSpace}>
            + Create Space
            </button>
          </div>

          {/* 🔄 Loading */}
          {loading && <p>Loading projects...</p>}

          {/* ❌ Empty */}
          {!loading && spaces.length === 0 && (
            <p>No projects yet. Create one 🚀</p>
          )}

          {/* ✅ Data */}
          <div className="grid">
            {spaces.map((space) => (
              <SpaceCard 
                key={space.id}
                title={space.name}
                desc={space.description}
                members={"--"}   // not available yet
                date={"--"}      // not available yet
                type={"SCRUM"}   // placeholder
                onClick={() => navigate(`/project/${space.id}`)}  
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}