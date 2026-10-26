import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { formatMoney, formatDate } from "../../utils/format";
import StatusBadge from "../../components/StatusBadge";

const tabs = [
  { key: "ALL", label: "All" },
  { key: "DRAFT", label: "Draft" },
  { key: "PENDING_APPROVAL", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

export default function MyVouchers() {
  const [vouchers, setVouchers] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .get("/vouchers/mine")
      .then((res) => !cancelled && setVouchers(res.data))
      .catch((err) =>
        !cancelled &&
        setError(err.response?.data?.error || "Could not load vouchers")
      );
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (v) => {
    if (!window.confirm(`Delete draft ${v.voucher_number}? This cannot be undone.`)) return;
    try {
      await api.delete(`/vouchers/${v.id}`);
      setVouchers((list) => list.filter((x) => x.id !== v.id));
    } catch (err) {
      setError(err.response?.data?.error || "Could not delete the voucher");
    }
  };

  const countOf = (key) =>
    key === "ALL" ? vouchers.length : vouchers.filter((v) => v.status === key).length;

  const visible =
    vouchers && (filter === "ALL" ? vouchers : vouchers.filter((v) => v.status === filter));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="inline-block border-b-2 border-[#4cc2a8] pb-1.5 pr-6 text-xl font-semibold text-[#1b7f8c]">
          My Vouchers
        </h1>
        <Link
          to="/employee/vouchers/new"
          className="inline-flex items-center gap-2 rounded-full bg-[#4cc2a8] px-5 py-2 text-sm font-medium text-white shadow-[0_6px_16px_rgba(76,194,168,0.45)] transition hover:bg-[#3fb297]"
        >
          <i className="fa-solid fa-plus text-xs" aria-hidden="true" />
          New Voucher
        </Link>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!vouchers && !error && <p className="text-slate-500">Loading...</p>}

      {vouchers && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`rounded-full px-4 py-1.5 text-sm transition ${
                  filter === t.key
                    ? "bg-[#4cc2a8] font-medium text-white"
                    : "bg-white text-slate-500 ring-1 ring-[#d3efe8] hover:text-[#1b7f8c]"
                }`}
              >
                {t.label} ({countOf(t.key)})
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="rounded-xl bg-white p-10 text-center text-slate-500 shadow-[0_2px_14px_rgba(76,194,168,0.25)]">
              <i className="fa-solid fa-file-circle-plus mb-3 text-3xl text-[#4cc2a8]" aria-hidden="true" />
              <p>No vouchers here yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl bg-white shadow-[0_2px_14px_rgba(76,194,168,0.25)] ring-1 ring-[#d3efe8]">
              <table className="w-full min-w-[44rem] text-left text-sm">
                <thead className="bg-[#e3f5f0] text-[#1b7f8c]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Voucher No.</th>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Department</th>
                    <th className="px-4 py-3 font-medium">Expense Date</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3f5f0]">
                  {visible.map((v) => (
                    <tr key={v.id} className="text-slate-700">
                      <td className="px-4 py-3 font-medium">{v.voucher_number}</td>
                      <td className="px-4 py-3">{v.title || <span className="text-slate-400">Untitled</span>}</td>
                      <td className="px-4 py-3">{v.department || "-"}</td>
                      <td className="px-4 py-3">{formatDate(v.expense_date)}</td>
                      <td className="px-4 py-3 text-right">{v.amount ? formatMoney(v.amount) : "-"}</td>
                      <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Link
                            to={`/employee/vouchers/${v.id}`}
                            aria-label="View"
                            title="View"
                            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-[#e3f5f0] hover:text-[#1b7f8c]"
                          >
                            <i className="fa-solid fa-eye text-sm" aria-hidden="true" />
                          </Link>
                          {v.status === "DRAFT" && (
                            <>
                              <Link
                                to={`/employee/vouchers/${v.id}/edit`}
                                aria-label="Edit"
                                title="Edit"
                                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-[#e3f5f0] hover:text-[#1b7f8c]"
                              >
                                <i className="fa-solid fa-pen text-sm" aria-hidden="true" />
                              </Link>
                              <button
                                onClick={() => handleDelete(v)}
                                aria-label="Delete"
                                title="Delete"
                                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                              >
                                <i className="fa-solid fa-trash text-sm" aria-hidden="true" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}