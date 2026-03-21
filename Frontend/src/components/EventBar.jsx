import React from "react";
import "../styles/timeline.css";

const EventBar = ({ event, selectedYear, onEventClick }) => {
  
  const startYear = parseInt(selectedYear.split("-")[0]);
  const endYear = parseInt(selectedYear.split("-")[1]);

  const timelineStart = new Date(startYear, 6, 1); // July 1
  const timelineEnd = new Date(endYear, 5, 30); // June 30

  // Extract date part (YYYY-MM-DD) from ISO string and parse at midnight
  const startDateOnly = event.startDate.split("T")[0];
  const endDateOnly = event.endDate.split("T")[0];
  
  let start = new Date(startDateOnly + "T00:00:00");
  let end = new Date(endDateOnly + "T00:00:00");

  // 🔥 Clamp inside timeline
  if (start < timelineStart) start = timelineStart;
  if (end > timelineEnd) end = timelineEnd;

  const totalDays =
    (timelineEnd - timelineStart) / (1000 * 60 * 60 * 24);

  const startOffset =
    (start - timelineStart) / (1000 * 60 * 60 * 24);

  const duration =
    (end - start) / (1000 * 60 * 60 * 24) + 1;

  // Prevent invalid values
  if (duration <= 0) {
    return null;
  }

  const left = Math.max((startOffset / totalDays) * 100, 0);
  const width = Math.max((duration / totalDays) * 100, 0.5); // minimum visible

  return (
    <div className="timeline-row" style={{ position: "relative" }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="timeline-cell"></div>
      ))}

      <div
        className={`event ${event.status}`}
        style={{
          position: "absolute",
          left: `${left}%`,
          width: `${width}%`,
        }}
        title={event.title}
        onClick={() => onEventClick && onEventClick(event)}
      >
        {event.title}
      </div>
    </div>
  );
};

export default EventBar;