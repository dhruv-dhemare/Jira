import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Landing from "./pages/Landing";
import Spaces from "./pages/Spaces";
import SpaceDetail from "./pages/SpaceDetail";
import Profile from "./pages/Profile";
import CreateSpace from "./pages/CreateSpace";
import Timeline from "./pages/Timeline";
import Inventory from "./pages/Inventory";
import ProtectedRoute from "./components/ProtectedRoute";
import { connectSocket, getSocket, disconnectSocket } from "./socket/socket";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    // Initialize socket connection when user logs in
    if (token) {
      connectSocket(token);
      
      const socket = getSocket();
      socket?.on("connect", () => {
        console.log("✅ Socket connected");
        // Join user room for notifications
        socket.emit("joinUserRoom");
      });

      socket?.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });

      socket?.on("error", (error) => {
        console.error("Socket error:", error);
      });

      // Listen for notifications
      socket?.on("notification", (notification) => {
        console.log("🔔 Notification:", notification);
        // You can add toast notification here
      });
    } else {
      // Disconnect socket when user logs out
      disconnectSocket();
    }

    // Listen for storage changes (logout from other tabs/windows)
    const handleStorageChange = () => {
      setToken(localStorage.getItem("token"));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [token]);

  return (
    <Router>
      <Routes>
        {/* Landing page - always accessible */}
        <Route path="/" element={<Landing />} />
        <Route
          path="/spaces"
          element={
              <Spaces />
          }
        />
        <Route
          path="/spaces/:id"
          element={
            <SpaceDetail />
          }
        />
        <Route
          path="/create-space"
          element={
            <CreateSpace />
          }
        />
        <Route
          path="/profile"
          element={
            <Profile />
          }
        />
        <Route
          path="/timeline"
          element={
            <Timeline />
          }
        />
        <Route
          path="/inventory"
          element={
            <Inventory />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;