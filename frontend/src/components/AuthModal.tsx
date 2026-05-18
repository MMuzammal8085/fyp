import { useState } from "react";
import { Eye, EyeOff, Loader2, X } from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        // Step 1: create inactive user + send OTP
        if (!otpSent) {
          await axiosInstance.post("/user/signup", {
            email,
            password,
            username,
            role: 1, // HR
          });

          setOtpSent(true);
          return;
        }

        // Step 2: verify OTP (activates account)
        await axiosInstance.post("/user/verify-otp", { code: otp });

        // Step 3: login
        const response = await axiosInstance.post("/auth/login", {
          email,
          password,
        });

        const token = response.data?.access_token;
        if (token) {
          localStorage.setItem("token", token);
        }

        onClose();
        navigate("/signin");
      } else {
        const response = await axiosInstance.post("/auth/login", {
          email,
          password,
        });

        const token = response.data?.access_token;
        if (token) {
          localStorage.setItem("token", token);
        }
        onClose();
        navigate("/signin");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isSignup ? "Create Account" : "Welcome Back"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-500 text-sm mb-6">
            {isSignup
              ? "Sign up to get started with IntelliHire"
              : "Login to your account"}
          </p>

          {error && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            {isSignup && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="ABC Company"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-600 hover:text-gray-900"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* OTP */}
            {isSignup && otpSent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OTP Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="Enter the 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-600 mt-2">
                  We sent an OTP to your email. Enter it to complete signup.
                </p>
              </div>
            )}

            {/* Buttons */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-indigo-600 to-indigo-700 text-white p-3 rounded-lg flex items-center justify-center hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-70 font-medium"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : isSignup ? (
                otpSent ? (
                  "Complete Sign Up"
                ) : (
                  "Send OTP"
                )
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Toggle */}
          <p className="text-center text-sm mt-4 text-gray-600">
            {isSignup ? "Already have an account?" : "Don't have an account?"}
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setError("");
                setOtp("");
                setOtpSent(false);
              }}
              className="ml-1 text-indigo-600 font-medium hover:underline"
            >
              {isSignup ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
