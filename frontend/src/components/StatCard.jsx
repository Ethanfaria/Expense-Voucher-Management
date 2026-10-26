export default function StatCard({ label, value, icon }) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-[0_2px_14px_rgba(76,194,168,0.25)] ring-1 ring-[#d3efe8]">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e3f5f0] text-lg text-[#4cc2a8]">
        <i className={`fa-solid ${icon}`} aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-[#1b7f8c]">{value}</p>
      </div>
    </div>
  );
}