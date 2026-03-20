import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Landing from "./pages/Landing";
import Spaces from "./pages/Spaces";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  return (
    <Router>
      <Routes>
        {/* 🔥 Root route logic */}
        <Route
          path="/"
          element={token ? <Navigate to="/spaces" /> : <Landing />}
        />
        <Route
          path="/spaces"
          element={
              <Spaces />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;