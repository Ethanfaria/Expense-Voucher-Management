import { Link } from "react-router-dom";
import { formatMoney, formatDateTime } from "../utils/format";
import StatusBadge from "./StatusBadge";

export default function RecentList({ title, rows, base, dateKey, dateLabel, showStatus }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 font-semibold text-[#1b7f8c]">{title}</h2>

      {rows.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-500 shadow-[0_2px_14px_rgba(76,194,168,0.25)]">
          Nothing here yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-[0_2px_14px_rgba(76,194,168,0.25)] ring-1 ring-[#d3efe8]">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-[#e3f5f0] text-[#1b7f8c]">
              <tr>
                <th className="px-4 py-3 font-medium">Voucher No.</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                {showStatus && <th className="px-4 py-3 font-medium">Status</th>}
                <th className="px-4 py-3 font-medium">{dateLabel}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3f5f0]">
              {rows.map((r) => (
                <tr key={r.id} className="text-slate-700">
                  <td className="px-4 py-3 font-medium">
                    <Link to={`${base}/${r.id}`} className="text-[#1b7f8c] hover:underline">
                      {r.voucher_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{r.title || "-"}</td>
                  <td className="px-4 py-3">{r.employee_name}</td>
                  <td className="px-4 py-3 text-right">{formatMoney(r.amount)}</td>
                  {showStatus && (
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  )}
                  <td className="px-4 py-3">{formatDateTime(r[dateKey])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}