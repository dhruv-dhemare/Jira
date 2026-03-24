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
      <div className="modal">
        <h3>Add Member</h3>

        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
        />

        {/* Role Radio Buttons */}
        <div className="role-selection">
          <label>
            <input
              type="radio"
              value="master"
              checked={role === "master"}
              onChange={(e) => onRoleChange(e.target.value)}
            />
            Master
          </label>

          <label>
            <input
              type="radio"
              value="worker"
              checked={role === "worker"}
              onChange={(e) => onRoleChange(e.target.value)}
            />
            Worker
          </label>
        </div>

        <div className="modal-actions">
          <button onClick={onCancel}>Cancel</button>

          <button onClick={onAdd} disabled={adding}>
            {adding ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
