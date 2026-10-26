import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { fileUrl } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { getRoleHome } from "../utils/roles";
import { formatMoney, formatDate, formatDateTime } from "../utils/format";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";

const btnPrimary =
  "inline-flex items-center gap-2 rounded-full bg-[#4cc2a8] px-5 py-2 text-sm font-medium text-white shadow-[0_6px_16px_rgba(76,194,168,0.45)] transition hover:bg-[#3fb297] disabled:cursor-not-allowed disabled:opacity-60";
const btnOutline =
  "inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-[#1b7f8c] ring-1 ring-[#d3efe8] transition hover:bg-[#e3f5f0] disabled:opacity-60";
const btnDanger =
  "inline-flex items-center gap-2 rounded-full bg-red-50 px-5 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60";

function Card({ title, icon, children }) {
  return (
    <section className="rounded-xl bg-white p-6 shadow-[0_2px_14px_rgba(76,194,168,0.25)] ring-1 ring-[#d3efe8]">
      <h2 className="mb-4 flex items-center gap-3 font-semibold text-[#1b7f8c]">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e3f5f0] text-[#4cc2a8]">
          <i className={`fa-solid ${icon} text-xs`} aria-hidden="true" />
        </span>
        {title}
      </h2>
      <dl className="grid gap-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function Info({ label, children, wide }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">
        {children || "-"}
      </dd>
    </div>
  );
}

function SignatureBox({ label, path }) {
  return (
    <div className="sm:col-span-2">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      {path ? (
        <img
          src={fileUrl(path)}
          alt={label}
          className="mt-2 h-24 max-w-full rounded-lg bg-white object-contain p-2 ring-1 ring-[#d3efe8]"
        />
      ) : (
        <p className="mt-1 text-sm text-slate-400">Not signed</p>
      )}
    </div>
  );
}

function Notice({ notice }) {
  if (!notice) return null;
  return (
    <div role="alert" className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
      <p>{notice.message}</p>
      {notice.details?.length > 0 && (
        <ul className="mt-1 list-disc pl-5">
          {notice.details.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function VoucherDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const role = String(user.role).toUpperCase();
  const listPath = `${getRoleHome(user.role)}/vouchers`;

  const [voucher, setVoucher] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null); 
  const [file, setFile] = useState(null);
  const [saveSignature, setSaveSignature] = useState(false);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/vouchers/${id}`);
      setVoucher(res.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Could not load the voucher");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const closeModal = () => {
    setModal(null);
    setFile(null);
    setSaveSignature(false);
    setReason("");
    setNotice(null);
  };

  const run = async (action) => {
    setBusy(true);
    setNotice(null);
    try {
      await action();
      closeModal();
      await load();
    } catch (err) {
      const data = err.response?.data;
      setNotice({ message: data?.error || "Something went wrong", details: data?.details });
    } finally {
      setBusy(false);
    }
  };

  const submitVoucher = () => {
    if (!window.confirm("Submit for approval? You will not be able to edit it afterwards.")) return;
    run(() => api.post(`/vouchers/${id}/submit`));
  };

  const approve = () =>
    run(async () => {
      if (file) {
        const form = new FormData();
        form.append("signature", file);
        if (!saveSignature) {
          await api.post(`/vouchers/${id}/approve`, form);
          return;
        }
        await api.post("/users/me/signature", form);
      }
      await api.post(`/vouchers/${id}/approve`);
    });

  const reject = () => {
    if (!reason.trim()) {
      setNotice({ message: "Rejection reason is required" });
      return;
    }
    run(() => api.post(`/vouchers/${id}/reject`, { rejection_reason: reason }));
  };

  const backLink = (
    <Link to={listPath} className="mb-4 inline-flex items-center gap-2 text-sm text-[#1b7f8c] hover:underline">
      <i className="fa-solid fa-arrow-left text-xs" aria-hidden="true" />
      Back to vouchers
    </Link>
  );

  if (error) {
    return (
      <div>
        {backLink}
        <div role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }
  if (!voucher) return <p className="text-slate-500">Loading...</p>;

  const isDraftOwner = role === "EMPLOYEE" && voucher.status === "DRAFT";
  const canDecide = role === "DIRECTOR" && voucher.status === "PENDING_APPROVAL";

  return (
    <div>
      {backLink}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="border-b-2 border-[#4cc2a8] pb-1.5 pr-6 text-xl font-semibold text-[#1b7f8c]">
            {voucher.voucher_number}
          </h1>
          <StatusBadge status={voucher.status} />
        </div>

        <div className="flex flex-wrap gap-2">
          {isDraftOwner && (
            <>
              <Link to={`${listPath}/${voucher.id}/edit`} className={btnOutline}>
                <i className="fa-solid fa-pen text-xs" aria-hidden="true" />
                Edit
              </Link>
              <button onClick={submitVoucher} disabled={busy} className={btnPrimary}>
                <i className="fa-solid fa-paper-plane text-xs" aria-hidden="true" />
                Submit for approval
              </button>
            </>
          )}
          {canDecide && (
            <>
              <button onClick={() => setModal("reject")} className={btnDanger}>
                <i className="fa-solid fa-xmark text-xs" aria-hidden="true" />
                Reject
              </button>
              <button onClick={() => setModal("approve")} className={btnPrimary}>
                <i className="fa-solid fa-check text-xs" aria-hidden="true" />
                Approve
              </button>
            </>
          )}
        </div>
      </div>

      {!modal && <Notice notice={notice} />}

      {voucher.status === "REJECTED" && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">
          <p className="mb-1 font-medium">
            <i className="fa-solid fa-circle-xmark mr-2" aria-hidden="true" />
            Rejected
          </p>
          <p className="whitespace-pre-wrap">{voucher.rejection_reason}</p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Basic Information" icon="fa-file-lines">
          <Info label="Voucher Date">{formatDate(voucher.voucher_date)}</Info>
          <Info label="Expense Date">{formatDate(voucher.expense_date)}</Info>
          <Info label="Department">{voucher.department}</Info>
          <Info label="Category">{voucher.category}</Info>
          <Info label="Expense Title" wide>{voucher.title}</Info>
          <Info label="Amount">{voucher.amount ? formatMoney(voucher.amount) : null}</Info>
          <Info label="Description" wide>{voucher.description}</Info>
        </Card>

        <div className="space-y-5">
          <Card title="Employee" icon="fa-user">
            <Info label="Name">{voucher.employee_name}</Info>
            <Info label="Employee ID">{voucher.employee_code}</Info>
            <SignatureBox label="Employee signature" path={voucher.employee_signature_path} />
          </Card>

          <Card title="Approval" icon="fa-stamp">
            <Info label="Status"><StatusBadge status={voucher.status} /></Info>
            <Info label="Reviewed by">{voucher.director_name}</Info>
            <Info label="Approval Date">
              {voucher.approved_at ? formatDateTime(voucher.approved_at) : null}
            </Info>
            <SignatureBox label="Director signature" path={voucher.director_signature_path} />
          </Card>

          <Card title="Audit" icon="fa-clock-rotate-left">
            <Info label="Created">{formatDateTime(voucher.created_at)}</Info>
            <Info label="Last Updated">{formatDateTime(voucher.updated_at)}</Info>
          </Card>
        </div>
      </div>

      {modal === "approve" && (
        <Modal title="Approve voucher" onClose={closeModal}>
          <Notice notice={notice} />
          <p className="mb-3 text-sm text-slate-600">
            Upload your signature, or leave this empty to use the one you saved earlier.
          </p>
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => setFile(e.target.files[0] || null)}
            className="block w-full text-sm text-slate-600 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-[#e3f5f0] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#1b7f8c]"
          />
          {file && (
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={saveSignature}
                onChange={(e) => setSaveSignature(e.target.checked)}
                className="accent-[#4cc2a8]"
              />
              Save this as my signature for future approvals
            </label>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={closeModal} className={btnOutline}>Cancel</button>
            <button onClick={approve} disabled={busy} className={btnPrimary}>
              {busy ? "Approving..." : "Approve"}
            </button>
          </div>
        </Modal>
      )}

      {modal === "reject" && (
        <Modal title="Reject voucher" onClose={closeModal}>
          <Notice notice={notice} />
          <label htmlFor="reason" className="mb-2 block text-sm text-slate-600">
            Reason for rejection (the employee will see this)
          </label>
          <textarea
            id="reason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-2xl bg-white p-3 text-sm text-slate-700 ring-1 ring-[#d3efe8] focus:outline-none focus:ring-2 focus:ring-[#4cc2a8]"
          />
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={closeModal} className={btnOutline}>Cancel</button>
            <button onClick={reject} disabled={busy} className={btnDanger}>
              {busy ? "Rejecting..." : "Reject"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}