import React from "react";
import TimelineGrid from "../components/TimelineGrid";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";  
import "../styles/timeline.css";

const Timeline = () => {

  // 🔥 Dummy Events (customized)
  const events = [
    {
      title: "Internship Drive",
      desc: "Company hiring season",
      startDate: "2025-08-01",
      endDate: "2025-08-20",
      status: "completed"
    },
    {
      title: "Tech Fest",
      desc: "Annual college fest",
      startDate: "2025-09-10",
      endDate: "2025-10-15",
      status: "completed"
    },
    {
      title: "Winter Internship",
      desc: "Ongoing internships",
      startDate: "2025-12-01",
      endDate: "2025-12-25",
      status: "ongoing"
    },
    {
      title: "National Robotics Competition",
      desc: "Big national event",
      startDate: "2026-02-01",
      endDate: "2026-03-10",
      status: "upcoming"
    },
    {
      title: "Robo Race",
      desc: "Fun robotics event",
      startDate: "2026-05-01",
      endDate: "2026-05-25",
      status: "upcoming"
    }
  ];

   return (
      <div className="layout">
        <Navbar />
  
        <div className="main">
          <Sidebar />
  
          <div className="content">
            <div className="content-header">
              <h2>Timeline</h2>
              <TimelineGrid events={events} />
            </div>
            
          </div>
        </div>
      </div>
    );
};



export default Timeline;