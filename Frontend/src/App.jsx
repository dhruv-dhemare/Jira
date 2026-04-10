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

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    // Listen for storage changes (logout from other tabs/windows)
    const handleStorageChange = () => {
      setToken(localStorage.getItem("token"));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

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