import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { getRoleHome } from "../utils/roles";
import { formatMoney, formatDate } from "../utils/format";
import StatusBadge from "../components/StatusBadge";

const sortOptions = [
  { key: "newest", label: "Newest first", sort: "created_at", order: "desc" },
  { key: "oldest", label: "Oldest first", sort: "created_at", order: "asc" },
  { key: "amount_desc", label: "Amount: high to low", sort: "amount", order: "desc" },
  { key: "amount_asc", label: "Amount: low to high", sort: "amount", order: "asc" },
  { key: "expense_desc", label: "Expense date: latest", sort: "expense_date", order: "desc" },
  { key: "expense_asc", label: "Expense date: earliest", sort: "expense_date", order: "asc" },
];

const emptyFilters = {
  search: "",
  status: "",
  department: "",
  category: "",
  from: "",
  to: "",
  min_amount: "",
  max_amount: "",
  sortKey: "newest",
};

const inputCls =
  "w-full rounded-full bg-white px-4 py-2.5 text-sm text-slate-700 ring-1 ring-[#d3efe8] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4cc2a8]";

function F({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export default function VoucherList({ title, fixedStatus }) {
  const { user } = useAuth();
  const base = `${getRoleHome(user.role)}/vouchers`;

  const [draft, setDraft] = useState(emptyFilters);     
  const [applied, setApplied] = useState(emptyFilters); 
  const [vouchers, setVouchers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const { sortKey, ...rest } = applied;
    const params = {};
    Object.entries(rest).forEach(([k, v]) => {
      if (v !== "") params[k] = v;
    });
    if (fixedStatus) params.status = fixedStatus;
    const s = sortOptions.find((o) => o.key === sortKey) || sortOptions[0];
    params.sort = s.sort;
    params.order = s.order;

    setLoading(true);
    api
      .get("/vouchers", { params })
      .then((res) => {
        if (cancelled) return;
        setVouchers(res.data);
        setError("");
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || "Could not load vouchers");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applied, fixedStatus]);

  const handleChange = (e) =>
    setDraft((d) => ({ ...d, [e.target.name]: e.target.value }));

  const handleApply = (e) => {
    e.preventDefault();
    setApplied(draft);
  };

  const handleReset = () => {
    setDraft(emptyFilters);
    setApplied(emptyFilters);
  };

  return (
    <div>
      <h1 className="mb-6 inline-block border-b-2 border-[#4cc2a8] pb-1.5 pr-6 text-xl font-semibold text-[#1b7f8c]">
        {title}
      </h1>

      <form
        onSubmit={handleApply}
        className="mb-6 rounded-xl bg-white p-5 shadow-[0_2px_14px_rgba(76,194,168,0.25)] ring-1 ring-[#d3efe8]"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <F label="Search" className="sm:col-span-2">
            <input
              name="search"
              value={draft.search}
              onChange={handleChange}
              placeholder="Voucher number or employee name"
              className={inputCls}
            />
          </F>

          {!fixedStatus && (
            <F label="Status">
              <select name="status" value={draft.status} onChange={handleChange} className={inputCls}>
                <option value="">All statuses</option>
                <option value="PENDING_APPROVAL">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </F>
          )}

          <F label="Sort by">
            <select name="sortKey" value={draft.sortKey} onChange={handleChange} className={inputCls}>
              {sortOptions.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </F>

          <F label="Department">
            <input name="department" value={draft.department} onChange={handleChange} className={inputCls} />
          </F>
          <F label="Category">
            <input name="category" value={draft.category} onChange={handleChange} className={inputCls} />
          </F>
          <F label="Expense date from">
            <input type="date" name="from" value={draft.from} onChange={handleChange} className={inputCls} />
          </F>
          <F label="Expense date to">
            <input type="date" name="to" value={draft.to} onChange={handleChange} className={inputCls} />
          </F>
          <F label="Min amount (₹)">
            <input type="number" min="0" step="0.01" name="min_amount" value={draft.min_amount} onChange={handleChange} className={inputCls} />
          </F>
          <F label="Max amount (₹)">
            <input type="number" min="0" step="0.01" name="max_amount" value={draft.max_amount} onChange={handleChange} className={inputCls} />
          </F>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full bg-white px-5 py-2 text-sm font-medium text-[#1b7f8c] ring-1 ring-[#d3efe8] transition hover:bg-[#e3f5f0]"
          >
            Reset
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-[#4cc2a8] px-5 py-2 text-sm font-medium text-white shadow-[0_6px_16px_rgba(76,194,168,0.45)] transition hover:bg-[#3fb297]"
          >
            <i className="fa-solid fa-magnifying-glass text-xs" aria-hidden="true" />
            Apply
          </button>
        </div>
      </form>

      {error && (
        <div role="alert" className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!vouchers && !error && <p className="text-slate-500">Loading...</p>}

      {vouchers && (
        <div className={loading ? "opacity-60 transition" : "transition"}>
          <p className="mb-2 text-sm text-slate-500">
            {vouchers.length} voucher{vouchers.length === 1 ? "" : "s"}
          </p>

          {vouchers.length === 0 ? (
            <div className="rounded-xl bg-white p-10 text-center text-slate-500 shadow-[0_2px_14px_rgba(76,194,168,0.25)]">
              <i className="fa-solid fa-folder-open mb-3 text-3xl text-[#4cc2a8]" aria-hidden="true" />
              <p>No vouchers match these filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl bg-white shadow-[0_2px_14px_rgba(76,194,168,0.25)] ring-1 ring-[#d3efe8]">
              <table className="w-full min-w-[50rem] text-left text-sm">
                <thead className="bg-[#e3f5f0] text-[#1b7f8c]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Voucher No.</th>
                    <th className="px-4 py-3 font-medium">Employee</th>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Department</th>
                    <th className="px-4 py-3 font-medium">Expense Date</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3f5f0]">
                  {vouchers.map((v) => (
                    <tr key={v.id} className="text-slate-700">
                      <td className="px-4 py-3 font-medium">{v.voucher_number}</td>
                      <td className="px-4 py-3">{v.employee_name}</td>
                      <td className="px-4 py-3">{v.title || "-"}</td>
                      <td className="px-4 py-3">{v.department || "-"}</td>
                      <td className="px-4 py-3">{formatDate(v.expense_date)}</td>
                      <td className="px-4 py-3 text-right">{formatMoney(v.amount)}</td>
                      <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`${base}/${v.id}`}
                          aria-label="View"
                          title="View"
                          className="inline-grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-[#e3f5f0] hover:text-[#1b7f8c]"
                        >
                          <i className="fa-solid fa-eye text-sm" aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}