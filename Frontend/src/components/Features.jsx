import {
  LayoutGrid,
  Kanban,
  Zap,
  Calendar,
  Users,
  Shield
} from "lucide-react";

export default function Features() {
  const features = [
    {
      title: "Spaces & Projects",
      desc: "Organize your work into structured workspaces, making it easy to manage multiple projects, teams, and workflows in one centralized platform.",
      icon : LayoutGrid,
    },
    {
      title: "Kanban & Scrum",
      desc: "Adapt flexible workflows using Kanban boards or Scrum methodologies to suit your team’s process and improve productivity.",
      icon : Kanban,
    },
    {
      title: "Real-time Sync",
      desc: "Collaborate instantly with your team through real-time updates, ensuring everyone stays aligned and up-to-date without delays.",
      icon : Zap,
    },
    {
      title: "Sprint Planning",
      desc: "Efficiently plan, execute, and track sprints with intuitive tools that help your team stay focused and meet deadlines.",
      icon : Calendar,
    },
    {
      title: "Team Management",
      desc: "Easily manage team members, assign roles, and control permissions to ensure smooth collaboration and secure access control.",
      icon : Users,
    },
    {
      title: "Inventory Tracking",
      desc: "Monitor and manage all your robotics components with ease, keeping track of availability, usage, and stock levels in real time.",
      icon : Shield,
    }
  ];

  return (
    <section className="features">
      {features.map((f, i) => (
        <div key={i} className="feature-card">
          <f.icon className="feature-icon" />
          <h3>{f.title}</h3>
          <p>{f.desc}</p>
        </div>
      ))}
    </section>
  );
}