import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { getRoleHome } from "./utils/roles";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";

function PagePlaceholder({ title }) {
  return <h1 className="text-xl font-semibold text-[#1b7f8c]">{title}</h1>;
}

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? getRoleHome(user.role) : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute roles={["EMPLOYEE"]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/employee" element={<EmployeeDashboard />} />
      </Route>

      <Route
        element={
          <ProtectedRoute roles={["DIRECTOR"]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/director" element={<PagePlaceholder title="Director Dashboard" />} />
      </Route>

      <Route
        element={
          <ProtectedRoute roles={["ACCOUNTS"]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/accounts" element={<PagePlaceholder title="Accounts Dashboard" />} />
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}