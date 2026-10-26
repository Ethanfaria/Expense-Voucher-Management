import { Link } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import { formatMoney } from "../../utils/format";
import StatCard from "../../components/StatCard";
import RecentList from "../../components/RecentList";

export default function DirectorDashboard() {
  const { data, error } = useFetch("/dashboard/director");

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="inline-block border-b-2 border-[#4cc2a8] pb-1.5 pr-6 text-xl font-semibold text-[#1b7f8c]">
          Director Dashboard
        </h1>
        <Link
          to="/director/pending"
          className="inline-flex items-center gap-2 rounded-full bg-[#4cc2a8] px-5 py-2 text-sm font-medium text-white shadow-[0_6px_16px_rgba(76,194,168,0.45)] transition hover:bg-[#3fb297]"
        >
          <i className="fa-solid fa-clock text-xs" aria-hidden="true" />
          Review pending
        </Link>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {!data && !error && <p className="text-slate-500">Loading...</p>}

      {data && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Pending Approval" value={data.pending_count} icon="fa-hourglass-half" />
            <StatCard label="Approved Today" value={data.approved_today} icon="fa-circle-check" />
            <StatCard label="Rejected Today" value={data.rejected_today} icon="fa-circle-xmark" />
            <StatCard label="Total Pending Amount" value={formatMoney(data.total_pending_amount)} icon="fa-indian-rupee-sign" />
          </div>

          <RecentList
            title="Recent Voucher Activity"
            rows={data.recent}
            base="/director/vouchers"
            dateKey="updated_at"
            dateLabel="Last Activity"
            showStatus
          />
        </>
      )}
    </div>
  );
}