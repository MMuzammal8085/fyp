import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Mail,
  CheckCircle,
  Clock,
  TrendingUp,
  Download,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import AppShell from "../components/AppShell";
import InterviewInvitePanel from "../components/InterviewInvitePanel";
import { extractId, formatDate } from "../utils/interview";

type InterviewItem = {
  _id?: any;
  job_title?: string;
  description?: string;
  createdAt?: string;
  questions?: string[];
};

type ResultQuestion = {
  question?: string;
  answer?: string;
  score?: number;
  maxScore?: number;
  status?: string;
  order?: number;
};

type CandidateRow = {
  applicant_name?: string;
  applicant_email?: string;
  resumeUrl?: string;
  resume_score?: number;
  overall_score?: number;
  overall_rating?: number;
  interview_summary?: string;
  transcript?: string;
  analysis?: any;
  isShortlisted?: boolean;
  shortlistedAt?: string;
  status?: string;
  preparedAt?: string;
  completedAt?: string;
};

type InviteRow = {
  email?: string;
  status?: "pending" | "prepared" | "completed";
  username?: string;
  resumeUrl?: string;
  sentAt?: string;
  preparedAt?: string;
};

type ResultsResponse = {
  interviewId?: string;
  job_title?: string;
  description?: string;
  createdAt?: string;
  totalInvitesSent?: number;
  totalResults?: number;
  shortlisted?: number;
  pending?: number;
  shortlistThreshold?: number;
  resumeScore?: number;
  overallRating?: number;
  interviewSummary?: string;
  questionResults?: ResultQuestion[];
  note?: string;
  invites?: InviteRow[];
  candidates?: CandidateRow[];
};

type ResultsTab = "invites" | "results" | "shortlisted" | "pending";

export default function InterviewResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);
  const interviewId = id ?? "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shortlistUpdatingEmail, setShortlistUpdatingEmail] = useState<
    string | null
  >(null);
  const [interview, setInterview] = useState<InterviewItem | null>(null);
  const [results, setResults] = useState<ResultsResponse | null>(null);
  const [tab, setTab] = useState<ResultsTab>("invites");
  const loadSeqRef = useRef(0);

  useEffect(() => {
    if (!token || !interviewId) return;
    void loadData(interviewId);
  }, [token, interviewId]);

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  const loadData = async (interviewId: string) => {
    const seq = (loadSeqRef.current += 1);
    setLoading(true);
    setError("");
    try {
      const [interviewRes, resultsRes] = await Promise.all([
        axiosInstance.get<InterviewItem>(
          `/interviews/${encodeURIComponent(interviewId)}`,
        ),
        axiosInstance.get<ResultsResponse>(
          `/interviews/${encodeURIComponent(interviewId)}/results`,
        ),
      ]);

      if (seq !== loadSeqRef.current) return;
      setInterview(interviewRes.data);
      setResults(resultsRes.data);
    } catch (err: any) {
      if (seq !== loadSeqRef.current) return;
      setError(
        err?.response?.data?.message || "Failed to load interview results",
      );
    } finally {
      if (seq === loadSeqRef.current) {
        setLoading(false);
      }
    }
  };

  const safeInvites = useMemo(
    () => (Array.isArray(results?.invites) ? results!.invites! : []),
    [results],
  );

  const safeCandidates = useMemo(
    () => (Array.isArray(results?.candidates) ? results!.candidates! : []),
    [results],
  );

  const inProgressCandidates = useMemo(
    () => safeCandidates.filter((c) => c.status !== "completed"),
    [safeCandidates],
  );

  const shortlistedCandidates = useMemo(() => {
    return safeCandidates.filter((c) => c.isShortlisted === true);
  }, [safeCandidates]);

  const setShortlisted = async (email: string, shortlisted: boolean) => {
    const clean = String(email ?? "")
      .trim()
      .toLowerCase();
    if (!clean || !interviewId) return;

    setShortlistUpdatingEmail(clean);
    setError("");
    try {
      await axiosInstance.patch(
        `/interviews/${encodeURIComponent(
          interviewId,
        )}/results/email/${encodeURIComponent(clean)}/shortlist`,
        { shortlisted },
      );
      await loadData(interviewId);
      if (shortlisted) {
        setTab("shortlisted");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to update shortlist status",
      );
    } finally {
      setShortlistUpdatingEmail(null);
    }
  };

  const candidateEmails = useMemo(
    () =>
      new Set(
        safeCandidates
          .map((c) => String(c.applicant_email ?? "").toLowerCase())
          .filter(Boolean),
      ),
    [safeCandidates],
  );

  const completedCandidateEmails = useMemo(
    () =>
      new Set(
        safeCandidates
          .filter((c) => c.status === "completed")
          .map((c) => String(c.applicant_email ?? "").toLowerCase())
          .filter(Boolean),
      ),
    [safeCandidates],
  );

  const pendingInvites = useMemo(
    () =>
      safeInvites.filter((inv) => {
        const email = String(inv.email ?? "").toLowerCase();
        if (!email) return false;
        // Pending means: not yet completed (includes prepared/in-progress).
        return !completedCandidateEmails.has(email);
      }),
    [safeInvites, completedCandidateEmails],
  );

  const openCandidate = (email?: string) => {
    const clean = String(email ?? "")
      .trim()
      .toLowerCase();
    if (!clean) return;
    navigate(`/interviews/results/email/${encodeURIComponent(clean)}`);
  };

  const CandidateList = ({
    rows,
    emptyLabel,
  }: {
    rows: CandidateRow[];
    emptyLabel: string;
  }) => {
    if (!rows.length) {
      return <div className="text-sm text-slate-500">{emptyLabel}</div>;
    }

    return (
      <div className="space-y-3">
        {rows.map((row) => {
          const email = String(row.applicant_email ?? "").trim();
          const name = String(row.applicant_name ?? "").trim();
          const shortlisted = row.isShortlisted === true;
          const updating =
            Boolean(shortlistUpdatingEmail) &&
            shortlistUpdatingEmail === email.toLowerCase();
          const analysis =
            row.analysis && typeof row.analysis === "object"
              ? row.analysis
              : null;
          const recommendation = analysis?.recommendation || null;

          return (
            <div
              key={email || name}
              className="rounded-xl border border-slate-200 hover:border-cyan-300/50 bg-white p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => openCandidate(email)}
                    className="flex items-center gap-2 text-slate-900 font-semibold min-w-0 hover:text-cyan-700 transition"
                    title="Open candidate details"
                  >
                    <Mail size={16} className="text-cyan-600" />
                    <span className="truncate">{email || "Unknown email"}</span>
                  </button>
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    {name ? `${name}` : ""}
                    {row.status ? ` • ${row.status}` : ""}
                  </p>
                </div>
                <div className="shrink-0">
                  {recommendation && (
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                        recommendation === "hire"
                          ? "bg-green-100 text-green-700"
                          : recommendation === "no_hire"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {recommendation === "hire"
                        ? "✓ Recommended"
                        : recommendation === "no_hire"
                          ? "✗ Not Recommended"
                          : "? Maybe"}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg p-2 border border-cyan-100">
                  <p className="text-xs text-slate-600">Resume</p>
                  <p className="text-lg font-bold text-cyan-700">
                    {typeof row.resume_score === "number"
                      ? row.resume_score.toFixed(0)
                      : "-"}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg p-2 border border-cyan-100">
                  <p className="text-xs text-slate-600">Overall</p>
                  <p className="text-lg font-bold text-cyan-700">
                    {typeof row.overall_score === "number"
                      ? row.overall_score.toFixed(0)
                      : "-"}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg p-2 border border-cyan-100">
                  <p className="text-xs text-slate-600">Rating</p>
                  <p className="text-lg font-bold text-cyan-700">
                    {typeof row.overall_rating === "number"
                      ? row.overall_rating.toFixed(1)
                      : "-"}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg p-2 border border-cyan-100">
                  <p className="text-xs text-slate-600">Date</p>
                  <p className="text-xs font-semibold text-cyan-700 line-clamp-2">
                    {formatDate(row.completedAt || row.preparedAt)}
                  </p>
                </div>
              </div>

              {analysis && (
                <div className="mb-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs font-semibold text-slate-700 mb-1">
                    Analysis Preview
                  </p>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {analysis.summary || "No summary available"}
                  </p>
                </div>
              )}

              <div className="flex gap-2 justify-between">
                <button
                  type="button"
                  onClick={() => openCandidate(email)}
                  className="flex-1 rounded-lg bg-linear-to-r from-cyan-700 to-teal-700 text-white text-sm font-medium py-2 hover:shadow-md transition"
                >
                  View Details
                </button>
                {row.resumeUrl ? (
                  <a
                    href={row.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg px-4 py-2 text-sm font-medium transition border bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                    title="Download resume"
                  >
                    <Download size={16} />
                  </a>
                ) : null}
                {email ? (
                  <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      void setShortlisted(email, !shortlisted);
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    disabled={updating}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition border ${
                      shortlisted
                        ? "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200"
                        : "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
                    } ${updating ? "opacity-60 cursor-not-allowed" : ""}`}
                    title={
                      shortlisted
                        ? "Click to remove from shortlist"
                        : "Click to shortlist"
                    }
                  >
                    {updating
                      ? "Updating..."
                      : shortlisted
                        ? "Shortlisted"
                        : "Shortlist"}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const InviteList = ({ rows }: { rows: InviteRow[] }) => {
    if (!rows.length) {
      return <div className="text-sm text-slate-500">No invites found.</div>;
    }
    return (
      <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 overflow-hidden bg-white">
        {rows.map((row) => {
          const email = String(row.email ?? "").trim();
          const emailLower = email.toLowerCase();
          const canOpen = email
            ? candidateEmails.has(email.toLowerCase())
            : false;
          const derivedStatus = emailLower
            ? completedCandidateEmails.has(emailLower)
              ? "completed"
              : row.status
            : row.status;

          const Container: any = canOpen ? "button" : "div";
          return (
            <Container
              key={email}
              {...(canOpen
                ? {
                    onClick: () => openCandidate(email),
                    type: "button",
                  }
                : {})}
              className={`p-4 flex items-start justify-between gap-4 w-full text-left ${
                canOpen ? "hover:bg-slate-50 transition" : ""
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-slate-900 font-medium">
                  <Mail size={16} className="text-slate-500" />
                  <span className="truncate">{email || "Unknown email"}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {derivedStatus ? `Invite status: ${derivedStatus}` : ""}
                  {row.username ? `  •  Username: ${row.username}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-slate-500">
                  Sent: {formatDate(row.sentAt)}
                </p>
                {row.preparedAt ? (
                  <p className="text-xs text-slate-500 mt-1">
                    Prepared: {formatDate(row.preparedAt)}
                  </p>
                ) : null}
                {canOpen ? (
                  <p className="text-xs text-indigo-600 mt-1">View result</p>
                ) : null}
              </div>
            </Container>
          );
        })}
      </div>
    );
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-3xl bg-linear-to-br from-cyan-900 via-teal-900 to-slate-900 text-white p-7 md:p-10 shadow-xl">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">
            Interview Results
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">
            Review Interview Results
          </h1>
          <p className="text-cyan-100 mt-3 text-sm">
            Analyze candidate responses, view scores, and manage interview
            invitations
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={() => navigate("/interviews")}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-300 bg-white px-4 py-2.5 text-cyan-700 hover:bg-cyan-50 transition"
          >
            <ArrowLeft size={16} />
            Back to interviews
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-600 py-10">
            <Loader2 className="animate-spin" size={18} />
            Loading interview results...
          </div>
        ) : error ? (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
            {error}
          </div>
        ) : (
          <>
            <section className="rounded-3xl bg-linear-to-br from-slate-900 to-slate-700 text-white p-6 md:p-8 shadow-xl">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-200/80">
                Interview Results
              </p>
              <h1 className="mt-2 text-2xl md:text-3xl font-semibold">
                {results?.job_title || interview?.job_title || "Interview"}
              </h1>
            </section>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50/30 to-teal-50/30 p-5 shadow-sm hover:shadow-md hover:border-cyan-300/50 transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">
                    Invites sent
                  </p>
                  <Mail size={18} className="text-cyan-600" />
                </div>
                <p className="text-3xl font-bold bg-linear-to-r from-cyan-700 to-teal-700 bg-clip-text text-transparent mt-2">
                  {safeInvites.length || results?.totalInvitesSent || 0}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50/30 to-teal-50/30 p-5 shadow-sm hover:shadow-md hover:border-cyan-300/50 transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">
                    Results received
                  </p>
                  <CheckCircle size={18} className="text-emerald-600" />
                </div>
                <p className="text-3xl font-bold bg-linear-to-r from-cyan-700 to-teal-700 bg-clip-text text-transparent mt-2">
                  {safeCandidates.length || results?.totalResults || 0}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50/30 to-teal-50/30 p-5 shadow-sm hover:shadow-md hover:border-cyan-300/50 transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">
                    Shortlisted
                  </p>
                  <TrendingUp size={18} className="text-blue-600" />
                </div>
                <p className="text-3xl font-bold bg-linear-to-r from-cyan-700 to-teal-700 bg-clip-text text-transparent mt-2">
                  {shortlistedCandidates.length || results?.shortlisted || 0}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50/30 to-teal-50/30 p-5 shadow-sm hover:shadow-md hover:border-cyan-300/50 transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">Pending</p>
                  <Clock size={18} className="text-orange-600" />
                </div>
                <p className="text-3xl font-bold bg-linear-to-r from-cyan-700 to-teal-700 bg-clip-text text-transparent mt-2">
                  {pendingInvites.length}
                </p>
              </div>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Submissions
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Browse by email to open candidate details.
                  </p>
                </div>
                {typeof results?.shortlistThreshold === "number" ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    Shortlist threshold: {results.shortlistThreshold}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setTab("invites")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    tab === "invites"
                      ? "bg-linear-to-r from-cyan-700 to-teal-700 text-white shadow-md shadow-cyan-500/20"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Invites sent ({safeInvites.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTab("results")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    tab === "results"
                      ? "bg-linear-to-r from-cyan-700 to-teal-700 text-white shadow-md shadow-cyan-500/20"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Results received ({safeCandidates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTab("shortlisted")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    tab === "shortlisted"
                      ? "bg-linear-to-r from-cyan-700 to-teal-700 text-white shadow-md shadow-cyan-500/20"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Shortlisted ({shortlistedCandidates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTab("pending")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    tab === "pending"
                      ? "bg-linear-to-r from-cyan-700 to-teal-700 text-white shadow-md shadow-cyan-500/20"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Pending ({pendingInvites.length})
                </button>
              </div>

              <div className="mt-4">
                {tab === "invites" ? (
                  <InviteList rows={safeInvites} />
                ) : tab === "results" ? (
                  <CandidateList
                    rows={safeCandidates}
                    emptyLabel="No submissions yet."
                  />
                ) : tab === "shortlisted" ? (
                  <CandidateList
                    rows={shortlistedCandidates}
                    emptyLabel="No shortlisted candidates yet."
                  />
                ) : (
                  <>
                    <InviteList rows={pendingInvites} />
                    {inProgressCandidates.length ? (
                      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        {inProgressCandidates.length} submission(s) are in
                        progress (started but not completed). They appear under
                        “Results received”.
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </section>

            {results?.interviewSummary ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 mb-2">
                  Interview Summary
                </h2>
                <p className="text-sm text-slate-700 leading-6">
                  {results.interviewSummary}
                </p>
              </section>
            ) : null}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                Send more invites
              </h2>
              <InterviewInvitePanel
                interviewId={interviewId}
                onCompleted={() => loadData(interviewId)}
              />
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
