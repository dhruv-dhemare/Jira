import React from "react";
import "../styles/timeline.css";

const months = ["Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun"];

const TimelineHeader = () => {
  return (
    <div className="timeline-header">
      {months.map((month, index) => (
        <div key={index} className="month">
          {month}
        </div>
      ))}
    </div>
  );
};

export default TimelineHeader;