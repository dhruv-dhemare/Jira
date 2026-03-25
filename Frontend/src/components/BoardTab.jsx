import { CalendarDays } from "lucide-react";

export default function BoardTab({
  boardData,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  onTaskClick,
}) {
  const columns = [
    { key: "todo", label: "TO DO" },
    { key: "review", label: "IN REVIEW" },
    { key: "done", label: "DONE" },
  ];

  return (
    <div className="tab-content board-content">
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
                {column.label} <span className="column-count">{boardData[column.key].length}</span>
              </span>
              <button className="column-menu">⋯</button>
            </div>
            <div className="cards-container">
              {boardData[column.key].map((card) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, card, column.key)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onTaskClick(card)}
                  className="card"
                >
                  <div className="card-title">{card.title}</div>
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
              <button className="add-card-btn">+ Add task</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
