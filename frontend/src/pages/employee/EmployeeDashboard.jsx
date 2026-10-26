import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { formatMoney } from "../../utils/format";
import StatCard from "../../components/StatCard";

const cards = [
  { key: "total", label: "Total Vouchers", icon: "fa-layer-group" },
  { key: "draft", label: "Draft", icon: "fa-pen" },
  { key: "pending", label: "Pending Approval", icon: "fa-hourglass-half" },
  { key: "approved", label: "Approved", icon: "fa-circle-check" },
  { key: "rejected", label: "Rejected", icon: "fa-circle-xmark" },
  {
    key: "total_claimed",
    label: "Total Amount Claimed",
    icon: "fa-indian-rupee-sign",
    money: true,
  },
];

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .get("/dashboard/employee")
      .then((res) => !cancelled && setStats(res.data))
      .catch(
        (err) =>
          !cancelled &&
          setError(err.response?.data?.error || "Could not load the dashboard"),
      );
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="mb-8 inline-block border-b-2 border-[#4cc2a8] pb-1.5 pr-6 text-xl font-semibold text-[#1b7f8c]">
        Welcome, {user.name}
      </h1>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {!stats && !error && <p className="text-slate-500">Loading...</p>}

      {stats && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <StatCard
              key={c.key}
              label={c.label}
              icon={c.icon}
              value={c.money ? formatMoney(stats[c.key]) : stats[c.key]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
