import { Plus, MoreVertical } from "lucide-react";

export default function BacklogTab({ backlogItems }) {
  return (
    <div className="tab-content">
      <div className="backlog-header">
        <h3>Backlog ({backlogItems.length} items)</h3>
      </div>
      <div className="backlog-list">
        {backlogItems.map((item) => (
          <div key={item.id} className="backlog-item">
            <div className="drag-handle">⋮⋮</div>
            <div className="item-name">{item.name}</div>
            <div className="item-label">{item.label}</div>
            <div className="item-points">{item.points}</div>
            <button className="more-options">
              <MoreVertical size="1rem" />
            </button>
          </div>
        ))}
        <div className="add-item">
          <Plus size="1rem" /> Add a backlog item...
        </div>
      </div>
    </div>
  );
}
