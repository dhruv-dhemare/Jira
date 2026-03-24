import { useState, useMemo } from "react";
import { X } from "lucide-react";

export default function CalendarTab({ tasksData = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState(null);

  // Get task events organized by date
  const tasksByDate = useMemo(() => {
    const events = {};
    
    tasksData.forEach(task => {
      if (task.deadline) {
        const deadline = new Date(task.deadline);
        const dateKey = deadline.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        if (!events[dateKey]) {
          events[dateKey] = [];
        }
        events[dateKey].push({
          id: task.id,
          title: task.title,
          description: task.description,
          assignee: task.assigned_to ? task.assigned_to : null,
          deadline: task.deadline,
          created_at: task.created_at,
          status: task.status,
        });
      }
    });
    
    return events;
  }, [tasksData]);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate).toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
    const end = new Date(endDate).toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
    return `${start} — ${end}`;
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "done" || statusLower === "completed") return "status-done";
    if (statusLower === "in review" || statusLower === "in_progress" || statusLower === "inprogress") return "status-inprogress";
    if (statusLower === "todo") return "status-todo";
    return "status-default";
  };

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  return (
    <div className="tab-content">
      <div className="calendar-header">
        <h3>{monthName}</h3>
        <div className="calendar-nav">
          <button className="nav-btn" onClick={prevMonth}>&lt;</button>
          <button className="nav-btn" onClick={nextMonth}>&gt;</button>
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
        {[...Array(42)].map((_, idx) => {
          const day = idx - firstDay;
          const isCurrentMonth = day >= 0 && day < daysInMonth;
          
          if (isCurrentMonth) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day + 1);
            const dateKey = date.toISOString().split('T')[0];
            const dayTasks = tasksByDate[dateKey] || [];
            
            return (
              <div key={idx} className="calendar-day">
                <div className="calendar-date">{day + 1}</div>
                {dayTasks.length > 0 && (
                  <div className="calendar-events">
                    {dayTasks.map((task) => (
                      <div 
                        key={task.id} 
                        className="event-indicator" 
                        title={task.title}
                        onClick={() => setSelectedTask(task)}
                        style={{ cursor: "pointer" }}
                      >
                        {task.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          
          return (
            <div key={idx} className="calendar-day other-month">
            </div>
          );
        })}
      </div>

      {/* Task Modal */}
      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedTask.title}</h2>
              <button 
                className="modal-close" 
                onClick={() => setSelectedTask(null)}
              >
                <X size="1.5rem" />
              </button>
            </div>

            <div className="modal-body">
              {selectedTask.description && (
                <p className="modal-description">{selectedTask.description}</p>
              )}

              <div className="modal-info">
                <div className="info-row">
                  <label>Duration:</label>
                  <span>
                    {selectedTask.created_at && selectedTask.deadline
                      ? formatDateRange(selectedTask.created_at, selectedTask.deadline)
                      : selectedTask.deadline
                      ? new Date(selectedTask.deadline).toLocaleDateString("en-US", { 
                          month: "short", 
                          day: "numeric", 
                          year: "numeric" 
                        })
                      : "No date"}
                  </span>
                </div>

                <div className="info-row">
                  <label>Status:</label>
                  <span className={`status-badge ${getStatusColor(selectedTask.status)}`}>
                    {selectedTask.status || "Unassigned"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
