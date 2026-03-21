import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";
import "../styles/createSpace.css";

export default function CreateSpace() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔒 Validation
    if (!name.trim()) {
      alert("Project name is required");
      return;
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      alert("Start date cannot be after deadline");
      return;
    }

    try {
      setLoading(true);

      await api.post("/projects", {
        name,
        description,
        start_date: startDate || null,
        end_date: endDate || null,
      });

      navigate("/spaces");
    } catch (err) {
      console.error("Failed to create project", err);
      alert("Something went wrong");
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
          <h2>Create Space</h2>

          <form className="create-form" onSubmit={handleSubmit}>
            
            {/* Project Name */}
            <div className="form-group">
              <label>Project Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter project name"
                required
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this project about?"
              />
            </div>

            {/* Start Date */}
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* Deadline */}
            <div className="form-group">
              <label>Deadline</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Submit */}
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}