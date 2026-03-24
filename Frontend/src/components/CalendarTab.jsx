export default function CalendarTab() {
  return (
    <div className="tab-content">
      <div className="calendar-header">
        <h3>March 2025</h3>
        <div className="calendar-nav">
          <button className="nav-btn">&lt;</button>
          <button className="nav-btn">&gt;</button>
        </div>
      </div>
      <div className="calendar-grid">
        {/* Weekday headers */}
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
        {/* Calendar days */}
        {[...Array(35)].map((_, idx) => {
          const day = idx - 1;
          return (
            <div
              key={idx}
              className={`calendar-day ${day < 0 || day >= 31 ? "other-month" : ""}`}
            >
              {day >= 0 && day < 31 ? day + 1 : ""}
              {day === 14 && <div className="event-indicator">Design chassis blueprint</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
