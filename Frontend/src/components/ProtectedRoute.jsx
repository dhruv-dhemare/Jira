import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const location = useLocation();

  // 🔥 allow if token is coming in URL
  const params = new URLSearchParams(location.search);
  const urlToken = params.get("token");

  if (!token && !urlToken) {
    return <Navigate to="/" replace />;
  }

  return children;
}