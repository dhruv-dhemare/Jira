import React from "react";
import TimelineHeader from "./TimelineHeader";
import EventBar from "./EventBar";
import "../styles/timeline.css";

const TimelineGrid = ({ events }) => {
  return (
    <div className="timeline-container">
      <TimelineHeader />

      <div className="timeline-body">
        {events.map((event, index) => (
          <EventBar key={index} event={event} />
        ))}
      </div>
    </div>
  );
};

export default TimelineGrid;