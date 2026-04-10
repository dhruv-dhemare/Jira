import React, { useState, useMemo } from "react";
import TimelineHeader from "./TimelineHeader";
import EventBar from "./EventBar";
import "../styles/timeline.css";

const TimelineGrid = ({ events, onEventSelect }) => {
  const [selectedYear, setSelectedYear] = useState("2025-2026");

  // Filter events based on selected academic year (July-June)
  const filteredEvents = useMemo(() => {
    const startYear = parseInt(selectedYear.split("-")[0]);
    const endYear = parseInt(selectedYear.split("-")[1]);

    const yearStart = new Date(startYear, 6, 1); // July 1
    const yearEnd = new Date(endYear, 5, 30); // June 30

    const parseLocalDate = (dateString) => {
      const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    const filtered = events.filter((event) => {
      const startDate = parseLocalDate(event.startDate);
      const endDate = parseLocalDate(event.endDate);

      const overlaps = startDate <= yearEnd && endDate >= yearStart;
      return overlaps;
    });
    
    return filtered;
  }, [selectedYear, events]);

  return (
    <>
      <div className="timeline-top-header">
        <div className="timeline-top-right">
          <select
            className="year-selector"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="2024-2025">2024-2025</option>
            <option value="2025-2026">2025-2026</option>
            <option value="2026-2027">2026-2027</option>
          </select>
        </div>
      </div>

      <div className="timeline-container">
        <TimelineHeader />

        <div className="timeline-body">
          {/* Render events */}
          {filteredEvents.map((event, index) => (
            <EventBar
              key={index}
              event={event}
              selectedYear={selectedYear}
              onEventClick={onEventSelect}
            />
          ))}

          {/* Ensure minimum 4 rows */}
          {Array.from({
            length: Math.max(4 - filteredEvents.length, 0),
          }).map((_, index) => (
            <div key={`empty-${index}`} className="timeline-row">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={`cell-${i}`} className="timeline-cell"></div>
              ))}
            </div>
          ))}
        </div>

        <div className="timeline-footer">
          <div className="legend-item">
            <div className="legend-dot completed"></div>
            <span>Completed</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot ongoing"></div>
            <span>Ongoing</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot upcoming"></div>
            <span>Upcoming</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default TimelineGrid;