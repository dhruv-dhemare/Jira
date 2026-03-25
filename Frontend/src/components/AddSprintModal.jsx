export default function AddSprintModal({
  showModal,
  name,
  startDate,
  endDate,
  goal,
  creating,
  onNameChange,
  onStartDateChange,
  onEndDateChange,
  onGoalChange,
  onCancel,
  onCreate,
}) {
  if (!showModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <h3>Create Sprint</h3>

        <div className="modal-form-group">
          <label>Sprint Name</label>
          <input
            type="text"
            placeholder="e.g., Sprint 1 - Foundation"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="modal-input"
          />
        </div>

        <div className="modal-form-row">
          <div className="modal-form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="modal-input"
            />
          </div>

          <div className="modal-form-group">
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="modal-input"
            />
          </div>
        </div>

        <div className="modal-form-group">
          <label>Sprint Goal (Optional)</label>
          <textarea
            placeholder="What is the goal for this sprint?"
            value={goal}
            onChange={(e) => onGoalChange(e.target.value)}
            className="modal-textarea"
            rows="3"
          />
        </div>

        <div className="modal-actions">
          <button onClick={onCancel} className="modal-btn modal-btn-cancel">
            Cancel
          </button>

          <button onClick={onCreate} disabled={creating} className="modal-btn modal-btn-primary">
            {creating ? "Creating..." : "Create Sprint"}
          </button>
        </div>
      </div>
    </div>
  );
}
