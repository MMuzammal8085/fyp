import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Mail,
  Star,
  Download,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
  MessageSquare,
  FileText,
  Zap,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import AppShell from "../components/AppShell";
import { formatDate } from "../utils/interview";
import { getResumeDownloadUrl } from "../utils/resumeDownload";

type CandidateResultResponse = {
  applicant_name?: string;
  applicant_email?: string;
  interviewId?: string;
  job_title?: string;
  job_description?: string;
  resumeUrl?: string;
  resume_score?: number;
  overall_score?: number;
  overall_rating?: number;
  interview_summary?: string;
  transcript?: string;
  analysis?: any;
  question_results?: any[];
  status?: string;
  isShortlisted?: boolean;
  shortlistedAt?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function CandidateResult() {
  const { email } = useParams();
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);

  const candidateEmail = useMemo(
    () =>
      String(email ?? "")
        .trim()
        .toLowerCase(),
    [email],
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<CandidateResultResponse | null>(null);
  const loadSeqRef = useRef(0);

  useEffect(() => {
    if (!token || !candidateEmail) return;
    void load(candidateEmail);
  }, [token, candidateEmail]);

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  const load = async (email: string) => {
    const seq = (loadSeqRef.current += 1);
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get<CandidateResultResponse>(
        `/interviews/results/email/${encodeURIComponent(email)}`,
      );
      if (seq !== loadSeqRef.current) return;
      setData(res.data);
    } catch (err: any) {
      if (seq !== loadSeqRef.current) return;
      setError(
        err?.response?.data?.message || "Failed to load candidate results",
      );
    } finally {
      if (seq === loadSeqRef.current) {
        setLoading(false);
      }
    }
  };

  const toggleShortlist = async () => {
    if (!candidateEmail) {
      setError("Missing candidate email");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await axiosInstance.patch(
        `/interviews/results/email/${encodeURIComponent(
          candidateEmail,
        )}/shortlist`,
        { shortlisted: !(data?.isShortlisted === true) },
      );
      await load(candidateEmail);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update shortlist status";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const analysis = data?.analysis;
  const dimensionScores =
    analysis && typeof analysis === "object" ? analysis.dimension_scores : null;
  const recommendation =
    analysis && typeof analysis === "object" ? analysis.recommendation : null;
  const summary =
    analysis && typeof analysis === "object" ? analysis.summary : null;
  const strengths =
    analysis &&
    typeof analysis === "object" &&
    Array.isArray(analysis.strengths)
      ? analysis.strengths
      : [];
  const weaknesses =
    analysis &&
    typeof analysis === "object" &&
    Array.isArray(analysis.weaknesses)
      ? analysis.weaknesses
      : [];
  const risks =
    analysis && typeof analysis === "object" && Array.isArray(analysis.risks)
      ? analysis.risks
      : [];
  const quotes =
    analysis &&
    typeof analysis === "object" &&
    analysis.evidence &&
    Array.isArray(analysis.evidence.quotes)
      ? analysis.evidence.quotes
      : [];

  const hasAnalysis = !!analysis;
  const hasTranscript = !!data?.transcript;
  const hasQuestionResults =
    Array.isArray(data?.question_results) && data.question_results.length > 0;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "prepared":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRecommendationColor = (rec?: string) => {
    switch (rec) {
      case "hire":
        return "bg-emerald-100 text-emerald-800";
      case "no_hire":
        return "bg-red-100 text-red-800";
      case "maybe":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-linear-to-br from-cyan-900 via-teal-900 to-slate-900 text-white p-6 md:p-8 shadow-xl">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">
            Candidate Result
          </p>
          <h1 className="mt-2 text-2xl md:text-3xl font-semibold truncate">
            {data?.applicant_name || "Candidate"}
          </h1>
          <p className="mt-2 text-cyan-100/90 flex items-center gap-2 truncate">
            <Mail size={16} className="text-cyan-200/80" />
            {data?.applicant_email || candidateEmail}
          </p>
          <p className="mt-2 text-sm text-cyan-200/90 truncate">
            {data?.job_title ? `Role: ${data.job_title}` : ""}
          </p>
          <p className="mt-2 text-xs text-cyan-200/70">
            Updated: {formatDate(data?.updatedAt)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-300 bg-white px-4 py-2.5 text-cyan-700 hover:bg-cyan-50 transition"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="flex gap-2 flex-wrap">
            {/* Shortlist Button */}
            <button
              type="button"
              onClick={() => void toggleShortlist()}
              disabled={loading}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition border ${
                data?.isShortlisted === true
                  ? "bg-cyan-100 text-cyan-800 border-cyan-300 hover:bg-cyan-200"
                  : "bg-linear-to-r from-cyan-700 to-teal-700 text-white border-cyan-700 hover:shadow-md shadow-cyan-500/20"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              title={
                data?.isShortlisted === true
                  ? "Click to remove from shortlist"
                  : "Click to shortlist"
              }
            >
              <Star size={16} />
              {data?.isShortlisted === true ? "Shortlisted" : "Shortlist"}
            </button>

            {/* Download Resume Button */}
            {data?.resumeUrl ? (
              <a
                href={getResumeDownloadUrl(data.resumeUrl)}
                download={`${data.applicant_name ?? "candidate"}-resume.pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition border bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                title="Download resume"
              >
                <Download size={16} />
                Resume
              </a>
            ) : null}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Warning: No AI Analysis */}
        {!loading && data && !hasAnalysis && data.status === "prepared" && (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">⏳ Awaiting Analysis</p>
              <p className="text-xs mt-1">
                AI analysis will appear after the candidate completes the
                interview.
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center gap-2 text-slate-600 py-10">
            <Loader2 className="animate-spin" size={18} />
            Loading candidate details...
          </div>
        )}

        {/* Main Content */}
        {!loading && data && (
          <>
            {/* Score Cards - Only show if analysis contains real scores */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50/30 to-teal-50/30 p-5 shadow-sm hover:shadow-md hover:border-cyan-300/50 transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">
                    Resume Score
                  </p>
                  <FileText size={18} className="text-cyan-600" />
                </div>
                <p className="text-3xl font-bold bg-linear-to-r from-cyan-700 to-teal-700 bg-clip-text text-transparent mt-2">
                  {typeof data.resume_score === "number" &&
                  typeof data.analysis?.resume_score === "number"
                    ? data.resume_score.toFixed(1)
                    : "-"}
                </p>
                <p className="text-xs text-slate-500 mt-1">out of 100</p>
                {typeof data.resume_score === "number" &&
                  typeof data.analysis?.resume_score !== "number" && (
                    <p className="text-xs text-amber-600 mt-2">
                      ⚠️ Pending AI analysis
                    </p>
                  )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50/30 to-teal-50/30 p-5 shadow-sm hover:shadow-md hover:border-cyan-300/50 transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">
                    Interview Rating
                  </p>
                  <Star size={18} className="text-cyan-600" />
                </div>
                <p className="text-3xl font-bold bg-linear-to-r from-cyan-700 to-teal-700 bg-clip-text text-transparent mt-2">
                  {typeof data.overall_rating === "number" &&
                  typeof data.analysis?.overall_rating === "number"
                    ? data.overall_rating.toFixed(1)
                    : "-"}
                </p>
                <p className="text-xs text-slate-500 mt-1">out of 10</p>
                {data.status === "prepared" && (
                  <p className="text-xs text-blue-600 mt-2">
                    ⏳ Awaiting interview
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50/30 to-teal-50/30 p-5 shadow-sm hover:shadow-md hover:border-cyan-300/50 transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">
                    Overall Score
                  </p>
                  <BarChart3 size={18} className="text-cyan-600" />
                </div>
                <p className="text-3xl font-bold bg-linear-to-r from-cyan-700 to-teal-700 bg-clip-text text-transparent mt-2">
                  {typeof data.overall_score === "number" &&
                  typeof data.analysis?.resume_score === "number"
                    ? data.overall_score.toFixed(1)
                    : "-"}
                </p>
                <p className="text-xs text-slate-500 mt-1">calculated score</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50/30 to-teal-50/30 p-5 shadow-sm hover:shadow-md hover:border-cyan-300/50 transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">Status</p>
                  <CheckCircle size={18} className="text-cyan-600" />
                </div>
                <p className="mt-2">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      data.status,
                    )}`}
                  >
                    {data.status || "unknown"}
                  </span>
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Completed: {formatDate(data.completedAt)}
                </p>
              </div>
            </div>

            {/* AI Analysis Section */}
            {hasAnalysis && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={20} className="text-amber-600" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    AI Analysis & Sentiment
                  </h2>
                </div>

                {/* Recommendation */}
                {recommendation && (
                  <div className="mb-4">
                    <span
                      className={`inline-block px-3 py-1.5 rounded-full text-sm font-semibold ${getRecommendationColor(
                        recommendation,
                      )}`}
                    >
                      {recommendation === "hire"
                        ? "✓ Recommended for Hire"
                        : recommendation === "no_hire"
                          ? "✗ Not Recommended"
                          : "? Consider Further"}
                    </span>
                  </div>
                )}

                {/* Summary */}
                {summary && (
                  <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-600 font-semibold mb-2">
                      Summary
                    </p>
                    <p className="text-sm text-slate-800 leading-6">
                      {String(summary)}
                    </p>
                  </div>
                )}

                {/* Dimension Scores */}
                {dimensionScores && typeof dimensionScores === "object" && (
                  <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-600 font-semibold mb-3">
                      Competency Scores (0-10)
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {Object.entries(dimensionScores).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
                        >
                          <span className="text-sm text-slate-700 font-medium">
                            {key.replace(/_/g, " ")}
                          </span>
                          <span className="text-lg font-bold text-cyan-700">
                            {typeof value === "number" ? value.toFixed(1) : "-"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths, Weaknesses, Risks */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-600 font-semibold mb-2">
                      ✓ Strengths
                    </p>
                    <ul className="text-sm text-slate-800 space-y-1">
                      {strengths.length ? (
                        strengths.map((s: any, idx: number) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-cyan-600">•</span>
                            <span>{String(s)}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-500 italic">None recorded</li>
                      )}
                    </ul>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-600 font-semibold mb-2">
                      ⚠ Weaknesses
                    </p>
                    <ul className="text-sm text-slate-800 space-y-1">
                      {weaknesses.length ? (
                        weaknesses.map((s: any, idx: number) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-amber-600">•</span>
                            <span>{String(s)}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-500 italic">None recorded</li>
                      )}
                    </ul>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-600 font-semibold mb-2">
                      ⚡ Risks
                    </p>
                    <ul className="text-sm text-slate-800 space-y-1">
                      {risks.length ? (
                        risks.map((s: any, idx: number) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-red-600">•</span>
                            <span>{String(s)}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-500 italic">None recorded</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Evidence Quotes */}
                {quotes.length > 0 && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-600 font-semibold mb-3">
                      Evidence & Quotes
                    </p>
                    <div className="space-y-2">
                      {quotes.slice(0, 6).map((q: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 bg-white rounded-lg border-l-4 border-cyan-600 text-sm text-slate-800 italic"
                        >
                          "{String(q)}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Question Responses Section */}
            {hasQuestionResults && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare size={20} className="text-blue-600" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Interview Questions & Responses
                  </h2>
                </div>

                <div className="space-y-4">
                  {data.question_results.map((q: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-sm font-semibold text-slate-900 flex-1">
                          Q{q.order || idx + 1}. {String(q.question || "")}
                        </h3>
                        {typeof q.score === "number" && (
                          <span className="shrink-0 inline-block px-2.5 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                            {q.score}/{q.maxScore || 10}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 leading-6 bg-slate-50 p-3 rounded">
                        {String(q.answer || "No response recorded")}
                      </p>
                      {q.status && (
                        <p className="text-xs text-slate-500 mt-2">
                          Status: {q.status}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Transcript Section */}
            {hasTranscript && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={20} className="text-purple-600" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Interview Transcript
                  </h2>
                </div>
                <div className="max-h-96 overflow-auto bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <pre className="whitespace-pre-wrap text-sm text-slate-800 leading-6 font-mono">
                    {data.transcript}
                  </pre>
                </div>
              </section>
            )}

            {/* No Data States */}
            {!hasAnalysis && !hasTranscript && !hasQuestionResults && (
              <div className="text-center py-10 text-slate-500">
                <AlertCircle size={40} className="mx-auto mb-3 opacity-30" />
                <p>Interview data is still being processed.</p>
                <p className="text-sm mt-1">Please refresh in a moment.</p>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
