import { Bot, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const token = localStorage.getItem("token");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const cleanAvatar = user?.avatar?.replace(/=s\d+-c$/, "=s200-c");
  const handleLogin = () => {
    window.location.href = "http://localhost:5000/auth/google";
  };

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await api.get("/users/me");
      setUser(res.data);
    } catch (err) {
      console.error("Failed to fetch user", err);
    }
  };

  return (
    <nav className="navbar">
      <div className="logo">
        <Bot className="logo-icon" />
        <span>RoboManage</span>
      </div>

      {!token ? (
        <button className="login-btn" onClick={handleLogin}>
          Login with Google
        </button>
      ) : (
        <div className="nav-right">
          <Bell className="nav-icon" />

          {/* 🔥 Avatar from backend */}
          {user?.avatar ? (
            <img
              src={cleanAvatar}
              alt="avatar"
              className="avatar-img"
              referrerPolicy="no-referrer"
              onClick={() => navigate("/profile")}
            />
          ) : (
            <div className="avatar" onClick={() => navigate("/profile")}
>?</div>
          )}
        </div>
      )}
    </nav>
  );
}