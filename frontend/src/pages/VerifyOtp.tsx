import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import axiosInstance from "../api/axiosInstance";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const value = params.get("email");
    return value ? value : "";
  }, [location.search]);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await axiosInstance.post("/user/verify-otp", { code });
      setSuccess("Account verified. You can sign in now.");
      navigate("/signin", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-cyan-50 via-white to-amber-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_35px_100px_-45px_rgba(15,23,42,0.45)] lg:grid-cols-2">
        <section className="relative overflow-hidden bg-linear-to-br from-slate-900 via-cyan-900 to-teal-800 p-8 text-white sm:p-10 lg:p-12">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/20 blur-2xl" />
          <div className="absolute -bottom-16 -left-14 h-52 w-52 rounded-full bg-amber-300/20 blur-2xl" />

          <div className="relative z-10 flex h-full flex-col">
            <p className="text-xs font-semibold tracking-[0.24em] text-cyan-100/90 uppercase">
              HR Hub
            </p>
            <h1 className="mt-4 max-w-sm text-3xl leading-tight font-extrabold sm:text-4xl">
              Verify your account and secure your workspace.
            </h1>
            <p className="mt-4 max-w-md text-sm text-cyan-50/90 sm:text-base">
              Enter the one-time password sent to your email to activate your
              account and continue to sign in.
            </p>

            <div className="mt-8 space-y-3">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm">
                <CheckCircle2 size={16} />
                OTP-based account protection
              </p>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm">
                <CheckCircle2 size={16} />
                Quick verification in under a minute
              </p>
            </div>

            <p className="mt-auto pt-10 text-sm text-cyan-50/85">
              Back to login?
              <Link
                to="/signin"
                className="ml-2 inline-flex items-center gap-1 font-semibold text-white underline decoration-cyan-200/70 underline-offset-4"
              >
                Go to sign in
                <ArrowRight size={15} />
              </Link>
            </p>
          </div>
        </section>

        <section className="flex items-center bg-white p-5 sm:p-8 lg:p-10">
          <div className="w-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_25px_60px_-45px_rgba(15,23,42,0.7)] sm:p-8">
            <div className="mb-6 border-b border-slate-100 pb-4">
              <h2 className="text-2xl font-bold text-slate-900">Verify OTP</h2>
              <p className="mt-1 text-sm text-slate-600">
                Enter the code sent to your email
              </p>
              {email && (
                <p className="mt-2 text-xs text-slate-500">
                  Email:{" "}
                  <span className="font-medium text-slate-700">{email}</span>
                </p>
              )}
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {success}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  OTP Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter the 6-digit OTP"
                  className="w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 placeholder-slate-400 transition focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
                <p className="mt-2 text-xs text-slate-500">
                  OTP expires in approximately 10 minutes.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-lg bg-linear-to-r from-cyan-700 to-teal-700 p-3 font-semibold text-white transition hover:shadow-lg hover:shadow-cyan-100 disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Verify"
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-600">
              Back to
              <Link
                to="/signin"
                className="ml-1 font-medium text-cyan-700 hover:underline"
              >
                Sign In
              </Link>
            </p>

            <p className="mt-2 text-center text-xs text-slate-500">
              Don&apos;t have an account?
              <Link to="/signup" className="ml-1 text-cyan-700 hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
