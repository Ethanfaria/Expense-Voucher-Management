import useFetch from "../../hooks/useFetch";
import { formatMoney } from "../../utils/format";
import StatCard from "../../components/StatCard";
import RecentList from "../../components/RecentList";

export default function AccountsDashboard() {
  const { data, error } = useFetch("/dashboard/accounts");

  return (
    <div>
      <h1 className="mb-8 inline-block border-b-2 border-[#4cc2a8] pb-1.5 pr-6 text-xl font-semibold text-[#1b7f8c]">
        Accounts Dashboard
      </h1>

      {error && (
        <div role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {!data && !error && <p className="text-slate-500">Loading...</p>}

      {data && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Total Vouchers" value={data.total} icon="fa-layer-group" />
            <StatCard label="Pending Approval" value={data.pending} icon="fa-hourglass-half" />
            <StatCard label="Approved" value={data.approved} icon="fa-circle-check" />
            <StatCard label="Rejected" value={data.rejected} icon="fa-circle-xmark" />
            <StatCard label="Total Approved Amount" value={formatMoney(data.total_approved_amount)} icon="fa-indian-rupee-sign" />
          </div>

          <RecentList
            title="Recent Approved Vouchers"
            rows={data.recent}
            base="/accounts/vouchers"
            dateKey="approved_at"
            dateLabel="Approved On"
          />
        </>
      )}
    </div>
  );
}