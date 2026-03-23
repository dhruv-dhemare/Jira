export default function SpaceCard({ title, desc, members, date, type, onClick }) {
  return (
    <div className="space-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="card-header">
        <span className="icon">⬜</span>
        <span className="tag">{type}</span>
      </div>

      <h3>{title}</h3>
      <p>{desc}</p>

      <div className="card-footer">
        <span>👥 {members} members</span>
        <span>{date}</span>
      </div>
    </div>
  );
}