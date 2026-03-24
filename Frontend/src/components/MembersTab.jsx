import { Plus } from "lucide-react";

export default function MembersTab({ members, loadingMembers, onAddMemberClick }) {
  return (
    <div className="tab-content">
      <div className="members-header">
        <h3>Members</h3>
        <button className="add-member-btn" onClick={onAddMemberClick}>
          <Plus size="0.875rem" /> Add Member
        </button>
      </div>
      <div className="members-list">
        {loadingMembers ? (
          <div className="loading">Loading members...</div>
        ) : (
          members.map((member) => (
            <div key={member.id} className="member-item">
              {/* Avatar */}
              <div className="member-avatar">
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} />
                ) : (
                  <div className="avatar-fallback">{member.initials}</div>
                )}
              </div>

              {/* Info */}
              <div className="member-info">
                <div className="member-name">{member.name}</div>
                <div className="member-email">{member.email}</div>
              </div>

              {/* Role */}
              <div className="member-role">{member.role}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
