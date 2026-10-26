import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navByRole = {
  EMPLOYEE: [
    { to: "/employee", label: "Dashboard", icon: "fa-gauge" },
    { to: "/employee/vouchers", label: "My Vouchers", icon: "fa-file-lines" },
    { to: "/employee/vouchers/new", label: "New Voucher", icon: "fa-plus" },
  ],
  DIRECTOR: [
    { to: "/director", label: "Dashboard", icon: "fa-gauge" },
    { to: "/director/pending", label: "Pending Approvals", icon: "fa-clock" },
    { to: "/director/vouchers", label: "All Vouchers", icon: "fa-list" },
  ],
  ACCOUNTS: [
    { to: "/accounts", label: "Dashboard", icon: "fa-gauge" },
    { to: "/accounts/vouchers", label: "All Vouchers", icon: "fa-list" },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const links = navByRole[String(user.role).toUpperCase()] || [];

  return (
    <div className="min-h-screen bg-[#f1faf8]">
      <header className="bg-white shadow-[0_2px_14px_rgba(76,194,168,0.25)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e3f5f0] text-[#4cc2a8]">
              <i className="fa-solid fa-file-invoice-dollar" aria-hidden="true" />
            </span>
            <span className="font-semibold text-[#1b7f8c]">Expense Vouchers</span>
          </div>

          <nav className="order-last flex w-full flex-wrap gap-1 md:order-none md:w-auto">
            {links.map((l, i) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={i === 0}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                    isActive
                      ? "bg-[#e3f5f0] font-medium text-[#1b7f8c]"
                      : "text-slate-500 hover:text-[#1b7f8c]"
                  }`
                }
              >
                <i className={`fa-solid ${l.icon} text-xs`} aria-hidden="true" />
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium text-slate-700">{user.name}</p>
              <p className="text-xs capitalize text-slate-400">
                {String(user.role).toLowerCase()}
              </p>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-full bg-[#4cc2a8] px-4 py-2 text-sm font-medium text-white shadow-[0_6px_16px_rgba(76,194,168,0.45)] transition hover:bg-[#3fb297] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4cc2a8]/40"
            >
              <i className="fa-solid fa-right-from-bracket text-xs" aria-hidden="true" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}