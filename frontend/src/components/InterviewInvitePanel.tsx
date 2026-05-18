import { Loader2, Send, Upload } from "lucide-react";
import { useState } from "react";
import axiosInstance from "../api/axiosInstance";

export type InviteResult = {
  message?: string;
  sent?: number;
  invalid?: string[];
  inviteLink?: string;
};

type InterviewInvitePanelProps = {
  interviewId: string;
  onCompleted?: () => void;
};

type InviteMode = "single" | "file";

export default function InterviewInvitePanel({
  interviewId,
  onCompleted,
}: InterviewInvitePanelProps) {
  const [inviteMode, setInviteMode] = useState<InviteMode>("single");
  const [singleEmail, setSingleEmail] = useState("");
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null);

  const sendSingleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    setInviteResult(null);

    if (!singleEmail.trim()) {
      setInviteError("Candidate email is required.");
      return;
    }

    setInviting(true);
    try {
      const res = await axiosInstance.post<InviteResult>(
        `/interviews/${encodeURIComponent(interviewId)}/invite/email`,
        {
          email: singleEmail.trim(),
        },
      );
      setInviteResult(res.data);
      setSingleEmail("");
      onCompleted?.();
    } catch (err: any) {
      setInviteError(
        err?.response?.data?.message || "Failed to send invitation",
      );
    } finally {
      setInviting(false);
    }
  };

  const sendExcelInvites = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    setInviteResult(null);
    if (!excelFile) {
      setInviteError("Please upload an Excel file (.xlsx/.xls).");
      return;
    }

    const formData = new FormData();
    formData.append("file", excelFile);

    setInviting(true);
    try {
      const res = await axiosInstance.post<InviteResult>(
        `/interviews/${encodeURIComponent(interviewId)}/invite`,
        formData,
      );
      setInviteResult(res.data);
      setExcelFile(null);
      onCompleted?.();
    } catch (err: any) {
      setInviteError(
        err?.response?.data?.message || "Failed to send invitations",
      );
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setInviteMode("single")}
          className={`rounded-lg px-3 py-2 text-sm transition ${
            inviteMode === "single"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
          type="button"
        >
          Single Mail Invitation
        </button>
        <button
          onClick={() => setInviteMode("file")}
          className={`rounded-lg px-3 py-2 text-sm transition ${
            inviteMode === "file"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
          type="button"
        >
          XLS File Invitation
        </button>
      </div>

      {inviteError ? (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
          {inviteError}
        </div>
      ) : null}
      {inviteResult ? (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded-lg">
          {inviteResult.message || "Invitation sent"}
          {typeof inviteResult.sent === "number"
            ? ` - Sent: ${inviteResult.sent}`
            : ""}
          {inviteResult.invalid?.length
            ? ` - Invalid: ${inviteResult.invalid.join(", ")}`
            : ""}
          {inviteResult.inviteLink ? ` - Link: ${inviteResult.inviteLink}` : ""}
        </div>
      ) : null}

      {inviteMode === "single" ? (
        <form onSubmit={sendSingleInvite} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Candidate Email
            </label>
            <input
              type="email"
              value={singleEmail}
              onChange={(e) => setSingleEmail(e.target.value)}
              placeholder="candidate@domain.com"
              className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
          <button
            type="submit"
            disabled={inviting}
            className="rounded-lg px-4 py-2.5 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-70 inline-flex items-center gap-2"
          >
            {inviting ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Send size={16} />
            )}
            Send Invitation
          </button>
        </form>
      ) : (
        <form onSubmit={sendExcelInvites} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Excel File
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setExcelFile(e.target.files?.[0] ?? null)}
              className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900"
            />
          </div>
          <button
            type="submit"
            disabled={inviting}
            className="rounded-lg px-4 py-2.5 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-70 inline-flex items-center gap-2"
          >
            {inviting ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Upload size={16} />
            )}
            Send File Invitations
          </button>
        </form>
      )}
    </div>
  );
}
