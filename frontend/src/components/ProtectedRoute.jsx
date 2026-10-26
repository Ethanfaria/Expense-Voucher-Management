import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRoleHome } from "../utils/roles";

export default function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (!roles.includes(String(user.role).toUpperCase())) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  return children;
}