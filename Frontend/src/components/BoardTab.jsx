import { CalendarDays } from "lucide-react";
import { useState } from "react";

export default function BoardTab({
  boardData,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  onTaskClick,
  onAddTaskClick,
  currentUser,
}) {
  const [showAssignedToMe, setShowAssignedToMe] = useState(false);

  const columns = [
    { key: "todo", label: "TO DO" },
    { key: "review", label: "IN REVIEW" },
    { key: "done", label: "DONE" },
  ];

  // Filter board data based on filter selection
  const filteredBoardData = showAssignedToMe
    ? {
        todo: boardData.todo.filter(card => card.assigned_to === currentUser?.id),
        review: boardData.review.filter(card => card.assigned_to === currentUser?.id),
        done: boardData.done.filter(card => card.assigned_to === currentUser?.id),
      }
    : boardData;

  return (
    <div className="tab-content board-content">
      <div className="board-filter">
        <label className="filter-toggle">
          <input
            type="checkbox"
            checked={showAssignedToMe}
            onChange={(e) => setShowAssignedToMe(e.target.checked)}
          />
          <span>Assigned to me</span>
        </label>
      </div>
      <div className="board-grid">
        {columns.map((column) => (
          <div
            key={column.key}
            className="board-column"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.key)}
          >
            <div className="column-header">
              <span className="column-label">
                {column.label} <span className="column-count">{filteredBoardData[column.key].length}</span>
              </span>
              <button className="column-menu">⋯</button>
            </div>
            {column.key === "todo" && currentUser && ["manager", "master"].includes(currentUser.role) && (
              <button className="add-card-btn" onClick={() => onAddTaskClick(column.key)}>+ Add task</button>
            )}
            <div className="cards-container">
              {filteredBoardData[column.key].map((card) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, card, column.key)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onTaskClick(card)}
                  className="card"
                >
                  <div className="card-title">{card.title}</div>
                  {card.sprintName && (
                    <div className="card-sprint-tag">{card.sprintName}</div>
                  )}
                  <div className="card-footer">
                    {card.date && (
                      <span className="card-date">
                        <CalendarDays /> {card.date}
                      </span>
                    )}
                    <div className={`card-avatar ${!card.assignee ? "unassigned" : ""}`}>
                      {card.assignee || "?"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
