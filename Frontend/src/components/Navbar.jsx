import { Bot, Bell, Search } from "lucide-react";

export default function Navbar() {
  const token = localStorage.getItem("token");

  const handleLogin = () => {
    window.location.href = "http://localhost:5000/auth/google";
  };

  return (
    <nav className="navbar">
      <div className="logo">
        <Bot className="logo-icon" />
        <span>RoboManage</span>
      </div>

      {/* 🔥 Conditional Rendering */}
      {!token ? (
        <button className="login-btn" onClick={handleLogin}>
          Login with Google
        </button>
      ) : (
        <div className="nav-right">
          <Search className="nav-icon" />
          <Bell className="nav-icon" />
          <div className="avatar">JD</div>
        </div>
      )}
    </nav>
  );
}