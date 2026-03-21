import React from "react";
import "../styles/timeline.css";

const getMonthIndex = (date) => {
  const d = new Date(date);
  const month = d.getMonth(); // 0-11
  return (month + 6) % 12; // shift for July start
};

const EventBar = ({ event }) => {
  const startIdx = getMonthIndex(event.startDate);
  const endIdx = getMonthIndex(event.endDate);

  const width = endIdx - startIdx + 1;

  return (
    <div className="timeline-row">
        {Array.from({ length: 12 }).map((_, i) => (
            <div key={i}></div>   // 👈 grid cells
        ))}

        {/* Event positioned on top */}
        <div
            className={`event ${event.status}`}
            style={{
            gridColumn: `${startIdx + 1} / span ${width}`
            }}
        >
            {event.title}
        </div>
    </div>
  );
};

export default EventBar;