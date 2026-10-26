import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roleHome } from "../utils/roles";

export default function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (!roles.includes(user.role)) {
    return <Navigate to={roleHome[user.role]} replace />;
  }

  return children;
}