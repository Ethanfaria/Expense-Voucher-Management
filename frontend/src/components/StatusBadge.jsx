const styles = {
  DRAFT: { label: "Draft", cls: "bg-slate-100 text-slate-600", icon: "fa-pen" },
  PENDING_APPROVAL: { label: "Pending", cls: "bg-amber-50 text-amber-700", icon: "fa-hourglass-half" },
  APPROVED: { label: "Approved", cls: "bg-[#e3f5f0] text-[#1b7f8c]", icon: "fa-circle-check" },
  REJECTED: { label: "Rejected", cls: "bg-red-50 text-red-700", icon: "fa-circle-xmark" },
};

export default function StatusBadge({ status }) {
  const s = styles[status] || { label: status, cls: "bg-slate-100 text-slate-600", icon: "fa-circle" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${s.cls}`}>
      <i className={`fa-solid ${s.icon} text-[10px]`} aria-hidden="true" />
      {s.label}
    </span>
  );
}