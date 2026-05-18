import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { extractId, formatDate } from "../utils/interview";

type InterviewItem = {
  _id?: any;
  job_title?: string;
  createdAt?: string;
};

type InterviewListProps = {
  interviews: InterviewItem[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
};

export default function InterviewList({
  interviews,
  loading,
  error,
  onRefresh,
}: InterviewListProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">All interviews</h3>
        <button
          onClick={onRefresh}
          className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-600 py-8">
          <Loader2 className="animate-spin" size={18} />
          Loading interviews...
        </div>
      ) : error ? (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
          {error}
        </div>
      ) : interviews.length === 0 ? (
        <p className="text-sm text-slate-500 py-8">
          No interviews yet. Create your first one.
        </p>
      ) : (
        <div className="space-y-2 max-h-[64vh] overflow-auto pr-1">
          {interviews.map((item) => {
            const interviewId = extractId(item._id);

            return (
              <button
                key={interviewId}
                onClick={() => navigate(`/interviews/${interviewId}/results`)}
                className="w-full text-left rounded-xl border border-slate-200 bg-white text-slate-900 p-3 transition hover:border-slate-300 hover:shadow-sm"
              >
                <p className="font-medium truncate">
                  {item.job_title || "Untitled role"}
                </p>
                <p className="text-xs mt-1 text-slate-500">
                  Created: {formatDate(item.createdAt)}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
