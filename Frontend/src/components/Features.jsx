export default function Features() {
  const features = [
    {
      title: "Spaces & Projects",
      desc: "Organize work into structured workspaces.",
    },
    {
      title: "Kanban & Scrum",
      desc: "Flexible workflows for every team.",
    },
    {
      title: "Real-time Sync",
      desc: "Collaborate instantly with your team.",
    },
    {
      title: "Sprint Planning",
      desc: "Plan and track sprints with ease.",
    },
    {
      title: "Team Management",
      desc: "Manage members, roles, and permissions.",
    },
    {
      title: "Inventory Tracking",
      desc: "Keep track of all your robotics parts.",
    },
  ];

  return (
    <section className="features">
      {features.map((f, i) => (
        <div key={i} className="feature-card">
          <h3>{f.title}</h3>
          <p>{f.desc}</p>
        </div>
      ))}
    </section>
  );
}