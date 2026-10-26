import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roleHome, getRoleHome } from "../utils/roles";

function Field({ id, label, icon, right, ...inputProps }) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>

      <span className="pointer-events-none absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-[#e3f5f0] text-[#4cc2a8]">
        <i className={`fa-solid ${icon} text-xs`} aria-hidden="true" />
      </span>

      <input
        id={id}
        {...inputProps}
        className="w-full rounded-full bg-white py-3.5 pl-14 pr-12 text-sm text-slate-700 shadow-[0_2px_14px_rgba(76,194,168,0.25)] ring-1 ring-[#d3efe8] transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4cc2a8]"
      />

      {right}
    </div>
  );
}

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user && roleHome[String(user.role).toUpperCase()]) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const loggedIn = await login(email, password);
      navigate(getRoleHome(loggedIn.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Could not reach the server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f1faf8] px-4 py-10">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-[#bfe6df]/70" />
      <div className="pointer-events-none absolute -left-10 -top-56 h-[30rem] w-[30rem] rounded-full bg-[#d6efea]/70" />
      <div className="pointer-events-none absolute -bottom-52 -right-40 h-[30rem] w-[30rem] rounded-full bg-[#c9ebe4]/70" />
      <div className="pointer-events-none absolute -bottom-72 right-24 h-[30rem] w-[30rem] rounded-full bg-[#dff3ef]/80" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-[0_20px_60px_rgba(27,127,140,0.18)] md:min-h-[34rem] md:grid-cols-2">
        <div className="flex flex-col p-8 md:p-10">
          <div className="flex flex-1 items-center justify-center py-10">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-xs space-y-5"
              noValidate
            >
              <h1 className="mb-8 inline-block border-b-2 border-[#4cc2a8] pb-1.5 pr-6 text-xl font-semibold text-[#1b7f8c]">
                Login
              </h1>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  <i
                    className="fa-solid fa-circle-exclamation mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{error}</span>
                </div>
              )}

              <Field
                id="email"
                label="Email"
                icon="fa-envelope"
                type="email"
                required
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Field
                id="password"
                label="Password"
                icon="fa-lock"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                right={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:text-[#1b7f8c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4cc2a8]"
                  >
                    <i
                      className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}
                      aria-hidden="true"
                    />
                  </button>
                }
              />

              <div className="flex items-center justify-between gap-4 pt-2">
                <p className="text-xs leading-snug text-[#1b7f8c]">
                  Forgot your password?
                  <br />
                  Ask your admin.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-full bg-[#4cc2a8] px-8 py-2.5 text-sm font-medium text-white shadow-[0_6px_16px_rgba(76,194,168,0.45)] transition hover:bg-[#3fb297] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4cc2a8]/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && (
                    <i
                      className="fa-solid fa-spinner fa-spin"
                      aria-hidden="true"
                    />
                  )}
                  {loading ? "Signing in" : "Login"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="relative hidden overflow-hidden md:block">
          <div className="absolute left-[8%] top-1/2 h-[46rem] w-[46rem] -translate-y-1/2 rounded-full bg-[#dff4ef]" />
          <div className="absolute left-[30%] top-1/2 h-[40rem] w-[40rem] -translate-y-1/2 rounded-full bg-[#a9e2d4]" />
          <div className="absolute left-[55%] top-1/2 h-[36rem] w-[36rem] -translate-y-1/2 rounded-full bg-[#6dcab4]" />
        </div>
      </div>
    </div>
  );
}
