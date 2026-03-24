import { BarChart3, CheckCircle2, Clock3, ListTodo } from "lucide-react";

export default function SummaryTab({ taskStats, taskAssignment }) {
  return (
    <div className="tab-content summary-content">
      {/* Task Stats */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon" aria-hidden="true">
            <BarChart3 />
          </div>
          <div className="stat-label">Total Tasks</div>
          <div className="stat-value">{taskStats.total}</div>
        </div>
        <div className="stat-card done">
          <div className="stat-icon" aria-hidden="true">
            <CheckCircle2 />
          </div>
          <div className="stat-label">Done</div>
          <div className="stat-value">{taskStats.done}</div>
        </div>
        <div className="stat-card inprogress">
          <div className="stat-icon" aria-hidden="true">
            <Clock3 />
          </div>
          <div className="stat-label">In Progress</div>
          <div className="stat-value">{taskStats.inProgress}</div>
        </div>
        <div className="stat-card todo">
          <div className="stat-icon" aria-hidden="true">
            <ListTodo />
          </div>
          <div className="stat-label">To Do</div>
          <div className="stat-value">{taskStats.toDo}</div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="progress-section">
        <h3>Overall Progress</h3>
        <div className="progress-bar">
          <div className="progress-segment done" style={{ width: "18%" }}></div>
          <div className="progress-segment inprogress" style={{ width: "27%" }}></div>
          <div className="progress-segment review" style={{ width: "18%" }}></div>
          <div className="progress-segment todo" style={{ width: "37%" }}></div>
        </div>
        <div className="progress-legend">
          <div className="legend-item">
            <span className="legend-dot done"></span>
            <span>Done 18%</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot inprogress"></span>
            <span>In Progress 27%</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot review"></span>
            <span>Review 18%</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot todo"></span>
            <span>To Do 37%</span>
          </div>
        </div>
      </div>

      {/* Task Assignment */}
      <div className="task-assignment-section">
        <h3>Task Assignment</h3>
        <div className="assignment-list">
          {taskAssignment.map((assignment, idx) => (
            <div key={idx} className="assignment-item">
              <div className={`assignment-avatar ${assignment.name === "Unassigned" ? "unassigned" : ""}`}>
                {assignment.name === "Unassigned" ? "?" : `${assignment.name.charAt(0)}${assignment.name.split(" ")[1]?.charAt(0)}`}
              </div>
              <div className="assignment-info">
                <div className="assignment-name">{assignment.name}</div>
                <div className="assignment-bar">
                  <div
                    className="assignment-fill"
                    style={{ width: `${assignment.percentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="assignment-stats">
                <span>{assignment.tasks} tasks</span>
                <span>{assignment.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
