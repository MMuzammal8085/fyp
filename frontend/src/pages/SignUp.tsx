import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import axiosInstance from "../api/axiosInstance";

export default function SignUp() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await axiosInstance.post("/user/signup", {
        username,
        email,
        password,
        role: 1, // HR
      });

      setSuccess(
        "OTP sent to your email. Please verify to activate your account.",
      );
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Sign up failed");
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
              Build your HR workspace in a few minutes.
            </h1>
            <p className="mt-4 max-w-md text-sm text-cyan-50/90 sm:text-base">
              Create your account to manage recruiting, attendance, payroll, and
              daily HR operations from one modern platform.
            </p>

            <div className="mt-8 space-y-3">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm">
                <CheckCircle2 size={16} />
                One dashboard for all people workflows
              </p>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm">
                <CheckCircle2 size={16} />
                Secure onboarding with OTP verification
              </p>
            </div>

            <p className="mt-auto pt-10 text-sm text-cyan-50/85">
              Already have an account?
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
              <h2 className="text-2xl font-bold text-slate-900">Sign Up</h2>
              <p className="mt-1 text-sm text-slate-600">Create an account</p>
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
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ABC Company"
                  className="w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 placeholder-slate-400 transition focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 placeholder-slate-400 transition focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 placeholder-slate-400 transition focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute top-3 right-3 text-slate-600 hover:text-slate-900"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Minimum 6 characters.
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
                  "Create Account"
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-600">
              Already have an account?
              <Link
                to="/signin"
                className="ml-1 font-medium text-cyan-700 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
