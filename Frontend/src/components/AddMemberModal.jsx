export default function AddMemberModal({
  showModal,
  email,
  role,
  adding,
  onEmailChange,
  onRoleChange,
  onCancel,
  onAdd,
}) {
  if (!showModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal add-member-modal">
        <h3 className="modal-title">Add Member</h3>

        <input
          type="email"
          placeholder="Enter email"
          className="modal-input-email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
        />

        {/* Role Selection */}
        <div className="role-selection">
          <label className="role-option">
            <input
              type="radio"
              value="master"
              checked={role === "master"}
              onChange={(e) => onRoleChange(e.target.value)}
            />
            <span className="role-label">Master</span>
          </label>

          <label className="role-option">
            <input
              type="radio"
              value="worker"
              checked={role === "worker"}
              onChange={(e) => onRoleChange(e.target.value)}
            />
            <span className="role-label">Worker</span>
          </label>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>

          <button 
            className="btn-primary" 
            onClick={onAdd} 
            disabled={adding}
          >
            {adding ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
