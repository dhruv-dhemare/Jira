import { useEffect, useState } from "react";
import { Mail, Shield, Calendar, Grid } from "lucide-react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";
import "../styles/profile.css";

export default function Profile() {
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("token");

    // 🔥 force full reset (avoids stale state issues)
    window.location.href = "/";
    };

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get("/users/me");
      setUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getAvatar = (url) => {
    if (!url) return null;
    return url.replace(/=s\d+-c$/, "=s200-c");
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="layout">
      <Navbar />

      <div className="main">
        <Sidebar />

        <div className="content">
          <div className="profile-container">

          {/* 🔷 CARD */}
          <div className="profile-card">
            <div className="profile-top">
              {user.avatar ? (
                <img
                  src={getAvatar(user.avatar)}
                  className="profile-avatar"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="avatar">
                  {user.name?.charAt(0)}
                </div>
              )}

              <div>
                <h3>{user.name}</h3>
                <p className="role">{user.role}</p>
              </div>
            </div>

            <div className="divider" />

            {/* 🔷 INFO */}
            <div className="profile-info">
              <div className="info-row">
                <Mail size={16} />
                <div>
                  <p className="label">Email</p>
                  <p>{user.email}</p>
                </div>
              </div>

              <div className="info-row">
                <Shield size={16} />
                <div>
                  <p className="label">Role</p>
                  <p>{user.role}</p>
                </div>
              </div>

              <div className="info-row">
                <Calendar size={16} />
                <div>
                  <p className="label">Joined</p>
                  <p>
                    {new Date(user.created_at).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                    })}
                    </p>
                </div>
              </div>

            </div>
          </div>

          {/* 🔷 ACTIONS */}
          <div className="profile-actions">
            {/* <div>Change Password</div>
            <div>Notification Preferences</div> */}
            <div className="logout" onClick={handleLogout}>
              Sign Out
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}