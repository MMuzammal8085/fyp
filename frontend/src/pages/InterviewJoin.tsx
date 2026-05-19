import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import ConversationPanel from "../components/ConversationPanel";

type ResolveInviteResponse = {
  email: string;
  interviewId: string;
  job_title?: string;
  description?: string;
  status?: "pending" | "prepared";
};

type PrepareResponse = {
  message?: string;
  email?: string;
  inviteToken?: string;
  interviewId?: string;
  jobTitle?: string;
  jobDescription?: string;
  compulsoryQuestions?: string[];
  interviewTimeMinutes?: number;
  resumeData?: any;
  resumeSummary?: string;
  systemPrompt?: string;
  meetingUrl: string;
  interviewUrl?: string;
  conversationId?: string;
  clientSecret?: string;
  signedUrl?: string;
  agentId?: string;
  assistantId?: string;
  vapiPublicKey?: string;
  overall_score?: number;
  conversationError?: string;
  parserWarning?: string;
};

export default function InterviewJoin() {
  const [params] = useSearchParams();
  const token = useMemo(
    () => String(params.get("token") ?? "").trim(),
    [params],
  );

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [username, setUsername] = useState("");
  const [resume, setResume] = useState<File | null>(null);

  // Conversation state
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [conversationData, setConversationData] =
    useState<PrepareResponse | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid interview link.");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    axiosInstance
      .get<ResolveInviteResponse>(
        `/public/interview-invites/${encodeURIComponent(token)}`,
      )
      .then((res) => {
        if (cancelled) return;
        setEmail(res.data.email ?? "");
        setJobTitle(res.data.job_title ?? "");
      })
      .catch((err: any) => {
        if (cancelled) return;
        setError(
          err?.response?.data?.message || "Invalid or expired interview link.",
        );
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid interview link.");
      return;
    }

    if (!username.trim()) {
      setError("Username is required.");
      return;
    }

    if (!resume) {
      setError("Please upload your resume (PDF).");
      return;
    }

    const isPdf =
      resume.type === "application/pdf" ||
      resume.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Resume must be a PDF file.");
      return;
    }

    const form = new FormData();
    form.append("username", username.trim());
    form.append("resume", resume);

    setSubmitting(true);
    try {
      const res = await axiosInstance.post<PrepareResponse>(
        `/public/interview-invites/${encodeURIComponent(token)}/prepare`,
        form,
      );

      setConversationData(res.data);
      setInterviewStarted(true);

      if (res.data.parserWarning) {
        console.warn("Resume parser warning:", res.data.parserWarning);
      }
      if (res.data.conversationError) {
        console.warn(
          "Conversation initialization warning:",
          res.data.conversationError,
        );
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to start interview");
    } finally {
      setSubmitting(false);
    }
  };

  // Show conversation panel if interview has started
  if (interviewStarted && conversationData) {
    return (
      <ConversationPanel
        conversationData={conversationData}
        candidateName={username}
        jobTitle={jobTitle}
        inviteToken={token}
        onExit={() => {
          setInterviewStarted(false);
          setConversationData(null);
          setUsername("");
          setResume(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h1 className="text-xl font-semibold text-slate-900">
              Start Interview
            </h1>
            <p className="text-sm text-slate-600">
              {jobTitle
                ? `Role: ${jobTitle}`
                : "Complete the steps below to begin."}
            </p>
          </div>

          <div className="p-6 space-y-4">
            {error ? (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
                {error}
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  placeholder={loading ? "Loading..." : ""}
                  className="w-full p-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your name"
                  className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  disabled={loading || Boolean(error)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Resume (PDF)
                </label>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => setResume(e.target.files?.[0] ?? null)}
                  className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900"
                  disabled={loading || Boolean(error)}
                />
              </div>

              <button
                type="submit"
                disabled={loading || submitting || Boolean(error)}
                className="w-full rounded-lg px-4 py-2.5 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-70"
              >
                {submitting ? "Starting..." : "Upload Resume & Start"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
