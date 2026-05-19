export type VapiInterviewContext = {
  candidateName: string;
  email?: string;
  inviteToken?: string;
  interviewId?: string;
  jobTitle?: string;
  jobDescription?: string;
  compulsoryQuestions?: string[];
  interviewTimeMinutes?: number;
  resumeData?: any;
  resumeSummary?: string;
};

function truncate(value: string, max: number): string {
  const text = String(value ?? "").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

/**
 * Turn any thrown value / Vapi payload into human-readable text (never "[object Object]").
 */
export function formatVapiError(err: unknown): string {
  if (err == null) return "Unknown error during call";
  if (typeof err === "string") return err.trim() || "Unknown error during call";

  if (typeof err === "number" || typeof err === "boolean") {
    return String(err);
  }

  if (Array.isArray(err)) {
    return err.map((item) => formatVapiError(item)).filter(Boolean).join("; ");
  }

  if (err instanceof Error) {
    return err.message || err.name || "Unknown error during call";
  }

  if (typeof err === "object") {
    const record = err as Record<string, unknown>;

    const priorityKeys = [
      "error",
      "message",
      "msg",
      "reason",
      "description",
      "statusMessage",
    ];

    for (const key of priorityKeys) {
      const value = record[key];
      if (value == null) continue;
      const formatted = formatVapiError(value);
      if (formatted && formatted !== "[object Object]") {
        return formatted;
      }
    }

    if (typeof record.statusCode === "number") {
      const detail = formatVapiError(record.message ?? record.error);
      return detail
        ? `Request failed (${record.statusCode}): ${detail}`
        : `Request failed with status ${record.statusCode}`;
    }

    try {
      const json = JSON.stringify(err);
      if (json && json !== "{}") return json;
    } catch {
      // ignore
    }
  }

  const fallback = String(err);
  return fallback === "[object Object]"
    ? "Interview call failed. Allow microphone access and verify your Vapi public key."
    : fallback;
}

/**
 * Vapi assistant dashboard placeholders (camelCase).
 */
export function buildVapiVariableValues(context: VapiInterviewContext) {
  const compulsoryQuestions = Array.isArray(context.compulsoryQuestions)
    ? context.compulsoryQuestions.map((q) => String(q ?? "").trim()).filter(Boolean)
    : [];

  const resumeText =
    typeof context.resumeData === "string"
      ? context.resumeData
      : context.resumeData?.resume_text
        ? String(context.resumeData.resume_text)
        : "";

  const resumeDescription = truncate(
    resumeText ||
      String(context.resumeSummary ?? "").trim() ||
      (context.resumeData?.skills ? `Skills: ${context.resumeData.skills}` : ""),
    6000,
  );

  const minutes =
    typeof context.interviewTimeMinutes === "number" &&
    Number.isFinite(context.interviewTimeMinutes)
      ? Math.max(5, Math.round(context.interviewTimeMinutes))
      : 30;

  return {
    username: truncate(context.candidateName ?? "Candidate", 120),
    jobTitle: truncate(context.jobTitle ?? "", 200),
    jobDescription: truncate(context.jobDescription ?? "", 4000),
    resumeDescription,
    compulsoryQuestions: truncate(compulsoryQuestions.join("\n"), 2000),
    totalTimeMinutes: String(minutes),
  };
}

export function buildVapiAssistantOverrides(context: VapiInterviewContext) {
  return {
    variableValues: buildVapiVariableValues(context),
  };
}
