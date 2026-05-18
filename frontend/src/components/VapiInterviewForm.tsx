import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import VapiCallComponent from "./VapiCallComponent";
import { buildInterviewSystemPrompt } from "../utils/interviewPrompt";

interface VapiCallData {
  assistantId: string;
  systemPrompt: string;
  variableValues: Record<string, any>;
  email?: string;
  interviewId?: string;
}

export default function VapiInterviewForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vapiCallData, setVapiCallData] = useState<VapiCallData | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    interviewId: "",
    totalTimeMinutes: 5,
    jobTitle: "",
    jobDescription: "",
    resumeDescription: "",
    compulsoryQuestions: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "totalTimeMinutes" ? parseInt(value, 10) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (
        !formData.username ||
        !formData.email ||
        !formData.jobTitle ||
        !formData.jobDescription ||
        !formData.resumeDescription ||
        !formData.compulsoryQuestions
      ) {
        throw new Error("Please fill in all required fields");
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error("Please enter a valid email address");
      }

      const assistantId = String(
        import.meta.env.VITE_VAPI_ASSISTANT_ID ?? "",
      ).trim();

      if (!assistantId) {
        throw new Error("VITE_VAPI_ASSISTANT_ID is not configured");
      }

      const systemPrompt = buildInterviewSystemPrompt({
        candidateName: formData.username.trim(),
        jobTitle: formData.jobTitle.trim(),
        jobDescription: formData.jobDescription.trim(),
        interviewTimeMinutes: formData.totalTimeMinutes,
        compulsoryQuestions: formData.compulsoryQuestions
          .split(/\r?\n/)
          .map((line) => line.replace(/^\s*\d+[.)-]?\s*/, "").trim())
          .filter(Boolean),
        resumeSummary: formData.resumeDescription.trim(),
        resumeData: {
          resumeDescription: formData.resumeDescription.trim(),
        },
      });

      setVapiCallData({
        assistantId,
        systemPrompt,
        email: formData.email.trim().toLowerCase(),
        interviewId: formData.interviewId.trim() || undefined,
        variableValues: {
          username: formData.username.trim(),
          totalTimeMinutes: formData.totalTimeMinutes,
          jobTitle: formData.jobTitle.trim(),
          jobDescription: formData.jobDescription.trim(),
          resumeDescription: formData.resumeDescription.trim(),
          compulsoryQuestions: formData.compulsoryQuestions
            .split(/\r?\n/)
            .map((line) => line.replace(/^\s*\d+[.)-]?\s*/, "").trim())
            .filter(Boolean)
            .join("\n"),
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start interview call";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // If call has been initiated, show the call component
  if (vapiCallData) {
    return (
      <VapiCallComponent
        callData={vapiCallData}
        email={vapiCallData.email}
        interviewId={vapiCallData.interviewId}
        onCallEnd={() => setVapiCallData(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Interview Setup
          </h1>
          <p className="text-gray-600 mb-8">
            Please provide the interview details below to begin your AI voice
            interview.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email address"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Interview ID (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview ID (Optional)
              </label>
              <input
                type="text"
                name="interviewId"
                value={formData.interviewId}
                onChange={handleInputChange}
                placeholder="Enter interview ID if available"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position Applying For *
              </label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
                placeholder="e.g., Senior Software Engineer"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description *
              </label>
              <textarea
                name="jobDescription"
                value={formData.jobDescription}
                onChange={handleInputChange}
                placeholder="Paste the job description here..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>

            {/* Resume/Background */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Background/Resume *
              </label>
              <textarea
                name="resumeDescription"
                value={formData.resumeDescription}
                onChange={handleInputChange}
                placeholder="Summarize your experience, skills, and qualifications..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>

            {/* Compulsory Questions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Questions *
              </label>
              <textarea
                name="compulsoryQuestions"
                value={formData.compulsoryQuestions}
                onChange={handleInputChange}
                placeholder="Enter numbered questions (one per line)&#10;Example:&#10;1. Why are you interested in this role?&#10;2. Tell us about your experience with React.&#10;3. How do you handle challenges?"
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Duration (minutes) *
              </label>
              <input
                type="number"
                name="totalTimeMinutes"
                value={formData.totalTimeMinutes}
                onChange={handleInputChange}
                min="5"
                max="120"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended: 30-60 minutes
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={20} />}
              {loading ? "Initializing Interview..." : "Start Interview"}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-6">
            * All fields are required. Your responses will be recorded and
            evaluated.
          </p>
        </div>
      </div>
    </div>
  );
}
