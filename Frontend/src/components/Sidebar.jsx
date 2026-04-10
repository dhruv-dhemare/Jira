import { LayoutDashboard, Box, Calendar, User, LogOut } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  const handleLogout = () => {
    // 🔑 remove token
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const isActive = (path) => {
    return location.pathname.includes(path) ? "active" : "";
  };

  return (
    <div className="sidebar">
      <h3 className="org-name">Robotics Club</h3>

      <ul>
        <li className={isActive("/spaces")} onClick={() => window.location.href = "/spaces"}>
          <LayoutDashboard size={18} /> Spaces
        </li>
        <li className={isActive("/inventory")} onClick={() => window.location.href = "/inventory"}>
          <Box size={18} /> Inventory
        </li>
        <li className={isActive("/timeline")} onClick={() => window.location.href = "/timeline"}>
          <Calendar size={18} /> Timeline
        </li>
        <li className={isActive("/profile")} onClick={() => window.location.href = "/profile"}>
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