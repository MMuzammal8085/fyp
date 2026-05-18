import { Loader2, Mail, X } from "lucide-react";

type CreateInterviewModalProps = {
  isOpen: boolean;
  jobTitle: string;
  description: string;
  durationMinutes: string;
  questionsText: string;
  creating: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  setJobTitle: (value: string) => void;
  setDescription: (value: string) => void;
  setDurationMinutes: (value: string) => void;
  setQuestionsText: (value: string) => void;
};

export default function CreateInterviewModal({
  isOpen,
  jobTitle,
  description,
  durationMinutes,
  questionsText,
  creating,
  error,
  onClose,
  onSubmit,
  setJobTitle,
  setDescription,
  setDurationMinutes,
  setQuestionsText,
}: CreateInterviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm px-3 py-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Create New Interview
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              This interview will be immutable after creation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          {error ? (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
              {error}
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Job Title
            </label>
            <input
              type="text"
              required
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Senior Frontend Engineer"
              className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Role overview, key requirements, and expectations..."
              className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 min-h-28"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="45"
              className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Questions (one per line)
            </label>
            <textarea
              required
              value={questionsText}
              onChange={(e) => setQuestionsText(e.target.value)}
              placeholder={
                "Describe a complex UI you've built.\nHow do you optimize React performance?\nHow do you handle API failures gracefully?"
              }
              className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 min-h-40"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-slate-900 text-white px-4 py-2.5 hover:bg-slate-800 disabled:opacity-70 inline-flex items-center gap-2"
            >
              {creating ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Mail size={16} />
              )}
              Create Interview
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
