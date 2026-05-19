import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import AuthLayout from "../components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await axiosInstance.post("/user/forgot-password", { email });
      setSuccess(
        res.data?.message ||
          "If an account exists for this email, a reset link has been sent.",
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to process request",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your email and we'll send a secure reset link"
      heroTitle="Recover access securely"
      heroBody="Reset links expire in one hour. We never reveal whether an email exists in our system."
      footer={
        <p className="mt-auto pt-10 text-sm text-cyan-50/85">
          Remember your password?
          <Link
            to="/signin"
            className="ml-2 font-semibold text-white underline decoration-cyan-200/70 underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      }
    >
      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text)]">
            Email address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="input-field"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="animate-spin" size={18} /> : "Send reset link"}
        </button>
      </form>
    </AuthLayout>
  );
}
