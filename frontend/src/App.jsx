import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { getRoleHome } from "./utils/roles";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import MyVouchers from "./pages/employee/MyVouchers";
import VoucherDetails from "./pages/VoucherDetails";
import VoucherForm from "./pages/employee/VoucherForm";
import DirectorDashboard from "./pages/director/DirectorDashboard";
import AccountsDashboard from "./pages/accounts/AccountsDashboard";
import VoucherList from "./pages/VoucherList";

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
        <Route path="/employee/vouchers" element={<MyVouchers />} />
        <Route path="/employee/vouchers/:id" element={<VoucherDetails />} />
        <Route path="/employee/vouchers/new" element={<VoucherForm />} />
        <Route path="/employee/vouchers/:id/edit" element={<VoucherForm />} />
      </Route>

      <Route
        element={
          <ProtectedRoute roles={["DIRECTOR"]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/director" element={<DirectorDashboard />} />
        <Route
          path="/director/pending"
          element={
            <VoucherList
              key="pending"
              title="Pending Approvals"
              fixedStatus="PENDING_APPROVAL"
            />
          }
        />
        <Route
          path="/director/vouchers"
          element={<VoucherList key="all" title="All Vouchers" />}
        />
        <Route path="/director/vouchers/:id" element={<VoucherDetails />} />
      </Route>

      <Route
        element={
          <ProtectedRoute roles={["ACCOUNTS"]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/accounts" element={<AccountsDashboard />} />
        <Route
          path="/accounts/vouchers"
          element={<VoucherList key="all" title="All Vouchers" />}
        />
        <Route path="/accounts/vouchers/:id" element={<VoucherDetails />} />
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
