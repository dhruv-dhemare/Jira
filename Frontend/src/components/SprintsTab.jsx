import { Plus, ChevronDown, ChevronRight, CheckCircle2, Play, Circle, Trash2 } from "lucide-react";

export default function SprintsTab({ sprints, expandedSprintIds, toggleSprintExpanded, sprintTasksById, onCreateSprintClick, onDeleteSprint, currentUser }) {
  return (
    <div className="tab-content">
      <div className="sprints-header">
        <h3>Sprints</h3>
        {currentUser && ["manager", "master"].includes(currentUser.role) && (
          <button className="create-sprint-btn" onClick={onCreateSprintClick}>
            <Plus size="0.875rem" /> Create Sprint
          </button>
        )}
      </div>
      <div className="sprints-list">
        {sprints.map((sprint) => (
          <div key={sprint.id} className="sprint-item">
            <button
              type="button"
              className="sprint-header"
              onClick={() => toggleSprintExpanded(sprint.id)}
              aria-expanded={expandedSprintIds.has(sprint.id)}
            >
              <span className="sprint-toggle" aria-hidden="true">
                {expandedSprintIds.has(sprint.id) ? (
                  <ChevronDown size="1rem" />
                ) : (
                  <ChevronRight size="1rem" />
                )}
              </span>
              <span className={`sprint-status-icon ${sprint.status.toLowerCase()}`} aria-hidden="true">
                {sprint.status === "COMPLETED" ? (
                  <CheckCircle2 size="1.1rem" />
                ) : sprint.status === "ACTIVE" ? (
                  <Play size="1.1rem" />
                ) : (
                  <Circle size="1.1rem" />
                )}
              </span>
              <span className="sprint-info">
                <span className="sprint-name">{sprint.name}</span>
              </span>
              <span className="sprint-stats">
                <span className="sprint-date">{sprint.date}</span>
                <span className={`status-badge ${sprint.status.toLowerCase()}`}>
                  {sprint.status}
                </span>
                <span className="task-count" aria-label={`${sprint.tasks} tasks`}>
                  {sprint.tasks}
                </span>
              </span>
              <button
                type="button"
                className="sprint-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete sprint "${sprint.name}"?`)) {
                    onDeleteSprint(sprint.id);
                  }
                }}
                aria-label={`Delete sprint ${sprint.name}`}
                title="Delete sprint"
              >
                <Trash2 size="1rem" />
              </button>
            </button>

            {expandedSprintIds.has(sprint.id) && (
              <div className="sprint-body">
                <div className="sprint-goal">Goal: {sprint.goal}</div>

                {sprint.tasks > 0 && (
                  <div className="sprint-tasks" role="list">
                    {sprintTasksById[sprint.id].map((task) => {
                      const deadlineDate = task.deadline ? new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;
                      return (
                        <div key={task.id} className="sprint-task-row" role="listitem">
                          <span className={`task-status-dot ${task.status}`} aria-hidden="true" />
                          <span className="sprint-task-title">{task.title}</span>
                          <span className="sprint-task-meta">
                            {deadlineDate && (
                              <span className="sprint-task-deadline">{deadlineDate}</span>
                            )}
                            <span
                              className={`sprint-task-avatar ${!task.assignee ? "unassigned" : ""}`}
                              aria-label={task.assignee ? `Assignee ${task.assignee}` : "Unassigned"}
                            >
                              {task.assignee || "?"}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
