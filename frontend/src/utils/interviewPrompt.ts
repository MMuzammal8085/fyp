type BuildInterviewSystemPromptInput = {
  candidateName?: string;
  inviteToken?: string;
  interviewId?: string;
  jobTitle?: string;
  jobDescription?: string;
  interviewTimeMinutes?: number;
  compulsoryQuestions?: string[];
  resumeData?: any;
  resumeSummary?: string;
};

function compactValue(value: any, maxLength = 8000): string {
  if (value == null) return "";

  let text = "";
  try {
    text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  } catch {
    text = String(value ?? "");
  }

  const trimmed = text.trim();
  if (!trimmed) return "";
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength)}...`;
}

export function buildInterviewSystemPrompt(
  input: BuildInterviewSystemPromptInput,
) {
  const questions = Array.isArray(input.compulsoryQuestions)
    ? input.compulsoryQuestions
        .map((question) => String(question ?? "").trim())
        .filter(Boolean)
    : [];

  const resumeDataText = compactValue(input.resumeData);
  const resumeSummary = String(input.resumeSummary ?? "").trim();

  return [
    "You are a professional HR interviewer for a live voice interview.",
    "Speak naturally, one question at a time, and wait for the candidate to answer before continuing.",
    "",
    `Candidate: ${input.candidateName ?? "Candidate"}`,
    `Role: ${input.jobTitle ?? "the position"}`,
    input.interviewTimeMinutes
      ? `Target duration: about ${input.interviewTimeMinutes} minutes`
      : "Use time wisely",
    "",
    "=== JOB DESCRIPTION ===",
    String(input.jobDescription ?? "").trim() || "Not provided.",
    "",
    "=== RESUME / CANDIDATE BACKGROUND ===",
    resumeDataText || resumeSummary || "No resume data provided.",
    "",
    "=== COMPULSORY QUESTIONS (must all be covered) ===",
    questions.length > 0
      ? questions.map((q, i) => `${i + 1}. ${q}`).join("\n")
      : "None provided.",
    "",
    "=== INTERVIEW FLOW (follow this order) ===",
    "PHASE 1 — Role & resume (about 60% of the interview):",
    "- Greet the candidate briefly.",
    "- Ask 3–5 tailored technical and experience questions based on the JOB DESCRIPTION and RESUME.",
    "- Probe their answers with short follow-ups when needed.",
    "",
    "PHASE 2 — Compulsory questions (about 40%, organic conversation):",
    "- Weave each COMPULSORY QUESTION into the dialogue naturally (do not read a numbered list).",
    "- Transition smoothly, e.g. 'Building on that…' or 'I'd also like to understand…'.",
    "- Ensure every compulsory question is answered before ending.",
    "",
    "CLOSING:",
    "- Thank the candidate and end professionally.",
    "- Do not invent facts not supported by the job description or resume.",
  ].join("\n");
}
