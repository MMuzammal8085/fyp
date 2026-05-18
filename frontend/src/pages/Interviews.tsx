import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { FilePlus2, LayoutGrid } from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import AppShell from "../components/AppShell";
import CreateInterviewModal from "../components/CreateInterviewModal";
import InterviewList from "../components/InterviewList";
import { extractId } from "../utils/interview";

type InterviewItem = {
  _id?: any;
  job_title?: string;
  description?: string;
  durationMinutes?: number;
  questions?: string[];
  createdAt?: string;
  totalInvitesSent?: number;
};

type InterviewTab = "all" | "create";

export default function Interviews() {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);

  const [interviewTab, setInterviewTab] = useState<InterviewTab>("all");
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [questionsText, setQuestionsText] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (!token) return;
    void loadInterviews();
  }, [token]);

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  const loadInterviews = async () => {
    setListLoading(true);
    setListError("");
    try {
      const res = await axiosInstance.get<InterviewItem[]>("/interviews");
      setInterviews(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setListError(err?.response?.data?.message || "Failed to load interviews");
    } finally {
      setListLoading(false);
    }
  };

  const openCreateModal = () => {
    setCreateError("");
    setCreateModalOpen(true);
    setInterviewTab("create");
  };

  const onCreateInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    const questions = questionsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (questions.length === 0) {
      setCreateError("Please add at least one interview question.");
      return;
    }

    const duration = durationMinutes.trim()
      ? Number(durationMinutes)
      : undefined;
    if (durationMinutes.trim() && Number.isNaN(duration)) {
      setCreateError("Duration must be a valid number.");
      return;
    }

    setCreating(true);
    try {
      const res = await axiosInstance.post<InterviewItem>("/interviews", {
        job_title: jobTitle,
        description,
        durationMinutes: duration,
        questions,
      });

      const createdId = extractId(res.data?._id);
      setCreateModalOpen(false);
      setInterviewTab("all");
      setJobTitle("");
      setDescription("");
      setDurationMinutes("");
      setQuestionsText("");
      await loadInterviews();
      if (createdId) {
        navigate(`/interviews/${createdId}/results`);
      }
    } catch (err: any) {
      setCreateError(
        err?.response?.data?.message || "Failed to create interview",
      );
    } finally {
      setCreating(false);
    }
  };

  const summaryCount = useMemo(() => interviews.length, [interviews]);
  const questionCount = useMemo(
    () =>
      interviews.reduce((acc, item) => acc + (item.questions?.length ?? 0), 0),
    [interviews],
  );

  return (
    <AppShell>
      <section className="space-y-6">
        <div className="rounded-3xl bg-linear-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-7 md:p-10 shadow-xl">
          <p className="text-xs uppercase tracking-[0.25em] text-blue-200">
            Interview Workspace
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">
            Manage Interviews & Invitations
          </h1>
          <p className="text-blue-100 mt-3 text-sm">
            Create structured interviews, track candidate responses, and manage
            recruitment workflows efficiently
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-blue-700 to-indigo-700 text-white shadow-md shadow-blue-500/20 px-4 py-2.5 hover:shadow-lg transition"
        >
          <FilePlus2 size={17} />
          Create New Interview
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => setInterviewTab("all")}
            className={`rounded-lg px-3 py-2 text-sm transition ${
              interviewTab === "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <LayoutGrid size={16} className="inline-block mr-2" />
            All Interviews
          </button>
          <button
            onClick={openCreateModal}
            className={`rounded-lg px-3 py-2 text-sm transition ${
              interviewTab === "create"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Create New Interview
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total interviews</p>
            <p className="text-3xl font-semibold text-slate-900 mt-2">
              {summaryCount}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total questions</p>
            <p className="text-3xl font-semibold text-slate-900 mt-2">
              {questionCount}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Quick action</p>
            <p className="text-lg font-medium text-slate-900 mt-2">
              Click an interview badge to open results
            </p>
          </div>
        </div>

        <InterviewList
          interviews={interviews}
          loading={listLoading}
          error={listError}
          onRefresh={loadInterviews}
        />
      </section>

      <CreateInterviewModal
        isOpen={createModalOpen}
        jobTitle={jobTitle}
        description={description}
        durationMinutes={durationMinutes}
        questionsText={questionsText}
        creating={creating}
        error={createError}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={onCreateInterview}
        setJobTitle={setJobTitle}
        setDescription={setDescription}
        setDurationMinutes={setDurationMinutes}
        setQuestionsText={setQuestionsText}
      />
    </AppShell>
  );
}
