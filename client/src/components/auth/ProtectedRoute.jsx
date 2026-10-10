
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles, children }) {
  const token = localStorage.getItem("ecotrack-token");

  let user = null;

  try {
    const storedUser = localStorage.getItem("ecotrack-user");
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  // Login required.
  if (!token || !user || !user.role) {
    return <Navigate to="/login" replace />;
  }

  // Redirect users to the dashboard matching their stored role.
  if (!allowedRoles.includes(user.role)) {
    if (user.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (user.role === "user") {
      return <Navigate to="/user/dashboard" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return children;
}
