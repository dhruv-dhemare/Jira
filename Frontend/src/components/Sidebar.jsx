import { LayoutDashboard, Box, Calendar, User, LogOut } from "lucide-react";

export default function Sidebar() {
  const handleLogout = () => {
    // 🔑 remove token
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div className="sidebar">
      <h3 className="org-name">Robotics Club</h3>

      <ul>
        <li className="active">
          <LayoutDashboard size={18} /> Spaces
        </li>
        <li>
          <Box size={18} /> Inventory
        </li>
        <li>
          <Calendar size={18} /> Timeline
        </li>
        <li>
          <User size={18} /> Profile
        </li>

        {/* 🔥 Logout */}
        <li className="logout" onClick={handleLogout} style={{ cursor: "pointer" }}>
          <LogOut size={18} /> Logout
        </li>
      </ul>
    </div>
  );
}