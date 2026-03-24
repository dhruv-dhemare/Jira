import { Plus, MoreVertical, AlertCircle } from "lucide-react";

export default function BacklogTab({ backlogItems }) {
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="tab-content">
      <div className="backlog-header">
        <h3>Backlog ({backlogItems.length} items)</h3>
      </div>
      {backlogItems.length === 0 ? (
        <div className="empty-state">
          <p>No overdue backlog tasks</p>
        </div>
      ) : (
        <div className="backlog-list">
          {backlogItems.map((item) => (
            <div key={item.id} className="backlog-item">
              <div className="drag-handle">⋮⋮</div>
              <div className="item-content">
                <div className="item-name">{item.name}</div>
                <div className="item-meta">
                  {/* {item.label && <span className="item-label">{item.label}</span>} */}
                  {item.assignee && <span className="item-assignee">Assigned to: {item.assignee}</span>}
                </div>
              </div>
              <div className="item-right">
                {item.deadline && (
                  <span className="item-deadline">
                    <AlertCircle size="0.875rem" />
                    Due: {formatDate(item.deadline)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
