import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { roleHome } from "./utils/roles";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";

function Placeholder({ title }) {
  const { user, logout } = useAuth();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2">
        Logged in as {user.name} ({user.role})
      </p>
      <button
        onClick={logout}
        className="mt-4 px-4 py-2 bg-gray-800 text-white rounded"
      >
        Log out
      </button>
    </div>
  );
}

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? roleHome[user.role] : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/employee"
        element={
          <ProtectedRoute roles={["EMPLOYEE"]}>
            <Placeholder title="Employee Dashboard" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/director"
        element={
          <ProtectedRoute roles={["DIRECTOR"]}>
            <Placeholder title="Director Dashboard" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/accounts"
        element={
          <ProtectedRoute roles={["ACCOUNTS"]}>
            <Placeholder title="Accounts Dashboard" />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
