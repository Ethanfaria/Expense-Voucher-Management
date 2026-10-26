import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import api, { fileUrl } from "../../api/axios";

const categories = [
  "Travel",
  "Meals",
  "Accommodation",
  "Fuel",
  "Office Supplies",
  "Communication",
  "Other",
];

const emptyForm = {
  expense_date: "",
  department: "",
  title: "",
  category: "",
  description: "",
  amount: "",
};

const inputCls =
  "w-full rounded-full bg-white px-5 py-3 text-sm text-slate-700 shadow-[0_2px_14px_rgba(76,194,168,0.15)] ring-1 ring-[#d3efe8] transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4cc2a8]";

function FormField({ id, label, required, wide, children }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="mb-1.5 block text-sm text-slate-600">
        {label}
        {required && <span className="text-[#4cc2a8]"> *</span>}
      </label>
      {children}
    </div>
  );
}

export default function VoucherForm() {
  const { id } = useParams(); 
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();
  const warning = location.state?.warning;

  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [existingSignature, setExistingSignature] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const backPath = isEdit ? `/employee/vouchers/${id}` : "/employee/vouchers";

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    api
      .get(`/vouchers/${id}`)
      .then((res) => {
        if (cancelled) return;
        const v = res.data;
        if (v.status !== "DRAFT") {
          navigate(`/employee/vouchers/${id}`, { replace: true });
          return;
        }
        setForm({
          expense_date: v.expense_date ? String(v.expense_date).slice(0, 10) : "",
          department: v.department || "",
          title: v.title || "",
          category: v.category || "",
          description: v.description || "",
          amount: v.amount ?? "",
        });
        setExistingSignature(v.employee_signature_path);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.data?.error || "Could not load the voucher");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, navigate]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleFile = (e) => {
    const chosen = e.target.files[0];
    if (!chosen) return;
    if (chosen.size > 2 * 1024 * 1024) {
      setError("Signature image must be 2 MB or smaller");
      e.target.value = "";
      return;
    }
    setError("");
    setFile(chosen);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.amount !== "" && !(Number(form.amount) > 0)) {
      setError("Amount must be greater than zero");
      return;
    }

    setSaving(true);
    let voucherId = id;

    try {
      const body = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v === "" ? null : v])
      );
      if (isEdit) {
        await api.put(`/vouchers/${id}`, body);
      } else {
        const res = await api.post("/vouchers", body);
        voucherId = res.data.id;
      }
    } catch (err) {
      setError(err.response?.data?.error || "Could not save the voucher");
      setSaving(false);
      return;
    }

    if (file) {
      try {
        const data = new FormData();
        data.append("signature", file);
        await api.post(`/vouchers/${voucherId}/signature`, data);
      } catch (err) {
        const msg = `Voucher saved as a draft, but the signature upload failed: ${
          err.response?.data?.error || "unknown error"
        }`;
        if (isEdit) {
          setError(msg);
          setSaving(false);
        } else {
          navigate(`/employee/vouchers/${voucherId}/edit`, {
            replace: true,
            state: { warning: msg },
          });
          setSaving(false);
        }
        return;
      }
    }

    navigate(`/employee/vouchers/${voucherId}`);
  };

  if (loading) return <p className="text-slate-500">Loading...</p>;

  const signatureSrc = preview || fileUrl(existingSignature);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to={backPath}
        className="mb-4 inline-flex items-center gap-2 text-sm text-[#1b7f8c] hover:underline"
      >
        <i className="fa-solid fa-arrow-left text-xs" aria-hidden="true" />
        Back
      </Link>

      <h1 className="mb-6 inline-block border-b-2 border-[#4cc2a8] pb-1.5 pr-6 text-xl font-semibold text-[#1b7f8c]">
        {isEdit ? "Edit Draft Voucher" : "New Voucher"}
      </h1>

      {warning && (
        <div role="alert" className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {warning}
        </div>
      )}
      {error && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <i className="fa-solid fa-circle-exclamation mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-xl bg-white p-6 shadow-[0_2px_14px_rgba(76,194,168,0.25)] ring-1 ring-[#d3efe8]"
      >
        <p className="mb-5 text-xs text-slate-400">
          <span className="text-[#4cc2a8]">*</span> Required before you can submit for approval.
          A draft can be saved with fields still empty.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="title" label="Expense Title" required wide>
            <input id="title" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Client lunch" className={inputCls} />
          </FormField>

          <FormField id="department" label="Department" required>
            <input id="department" name="department" value={form.department} onChange={handleChange} placeholder="e.g. Sales" className={inputCls} />
          </FormField>

          <FormField id="category" label="Expense Category">
            <select id="category" name="category" value={form.category} onChange={handleChange} className={inputCls}>
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </FormField>

          <FormField id="expense_date" label="Expense Date" required>
            <input id="expense_date" name="expense_date" type="date" value={form.expense_date} onChange={handleChange} className={inputCls} />
          </FormField>

          <FormField id="amount" label="Amount (₹)" required>
            <input id="amount" name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={handleChange} placeholder="0.00" className={inputCls} />
          </FormField>

          <FormField id="description" label="Description" wide>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              className="w-full rounded-2xl bg-white p-4 text-sm text-slate-700 shadow-[0_2px_14px_rgba(76,194,168,0.15)] ring-1 ring-[#d3efe8] transition focus:outline-none focus:ring-2 focus:ring-[#4cc2a8]"
            />
          </FormField>

          <div className="sm:col-span-2">
            <label htmlFor="signature" className="mb-1.5 block text-sm text-slate-600">
              Your signature <span className="text-[#4cc2a8]">*</span>
              <span className="ml-2 text-xs text-slate-400">PNG or JPG, max 2 MB</span>
            </label>
            {signatureSrc ? (
              <img
                src={signatureSrc}
                alt="Signature preview"
                className="mb-3 h-24 max-w-full rounded-lg bg-white object-contain p-2 ring-1 ring-[#d3efe8]"
              />
            ) : (
              <p className="mb-3 text-sm text-slate-400">No signature uploaded yet.</p>
            )}
            <input
              id="signature"
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleFile}
              className="block w-full text-sm text-slate-600 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-[#e3f5f0] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#1b7f8c]"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-2">
          <Link
            to={backPath}
            className="inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#1b7f8c] ring-1 ring-[#d3efe8] transition hover:bg-[#e3f5f0]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[#4cc2a8] px-6 py-2.5 text-sm font-medium text-white shadow-[0_6px_16px_rgba(76,194,168,0.45)] transition hover:bg-[#3fb297] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4cc2a8]/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />}
            {saving ? "Saving" : "Save Draft"}
          </button>
        </div>
      </form>
    </div>
  );
}