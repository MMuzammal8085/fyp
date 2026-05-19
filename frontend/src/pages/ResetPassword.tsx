import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import AuthLayout from "../components/AuthLayout";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const email = useMemo(() => searchParams.get("email") ?? "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (!token || !email) {
      setError("Invalid or missing reset link. Request a new one.");
      return;
    }

    setLoading(true);

    try {
      const res = await axiosInstance.post("/user/reset-password", {
        email,
        token,
        password,
      });
      setSuccess(res.data?.message || "Password updated successfully");
      setTimeout(() => navigate("/signin", { replace: true }), 1500);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to reset password",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Choose a strong password with at least 8 characters"
      heroTitle="Set a new password"
      heroBody="Your reset token is single-use and time-limited for your security."
      footer={
        <p className="mt-auto pt-10 text-sm text-cyan-50/85">
          <Link
            to="/forgot-password"
            className="font-semibold text-white underline decoration-cyan-200/70 underline-offset-4"
          >
            Request a new link
          </Link>
        </p>
      }
    >
      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text)]">
            New password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute top-3 right-3 text-[var(--text-muted)]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text)]">
            Confirm password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="input-field"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            "Update password"
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
