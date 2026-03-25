import { Plus } from "lucide-react";

export default function MembersTab({ members, loadingMembers, onAddMemberClick }) {
  const getAvatar = (url) => {
    if (!url) return null;
    // Transform Google profile image size parameter if present
    return url.replace(/=s\d+-c$/, "=s200-c");
  };

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
                  <img 
                    src={getAvatar(member.avatar)} 
                    alt={member.name}
                    referrerPolicy="no-referrer"
                  />
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
