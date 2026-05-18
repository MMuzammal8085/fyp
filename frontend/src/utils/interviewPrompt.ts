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

function compactValue(value: any, maxLength = 1800): string {
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

  const prompt = [
    "You are a professional AI interview assistant conducting an HR interview for a job applicant.",
    "Use only the data provided below. Do not invent facts, and do not ask unrelated questions.",
    "",
    `Candidate name: ${input.candidateName ?? "Candidate"}`,
    `Invite token: ${input.inviteToken ?? "unknown"}`,
    `Interview ID: ${input.interviewId ?? "unknown"}`,
    `Job title: ${input.jobTitle ?? "unknown"}`,
    input.interviewTimeMinutes
      ? `Interview duration: ${input.interviewTimeMinutes} minutes`
      : "Interview duration: use the available time carefully",
    "",
    "Job description:",
    String(input.jobDescription ?? "").trim() || "No job description provided.",
    "",
    "Resume data:",
    resumeDataText || "No parsed resume data provided.",
    "",
    "Resume summary:",
    resumeSummary || "No resume summary provided.",
    "",
    "Compulsory questions to ask in order:",
    questions.length > 0
      ? questions
          .map((question, index) => `${index + 1}. ${question}`)
          .join("\n")
      : "No compulsory questions were provided.",
    "",
    "Interview rules:",
    "- Ask the compulsory questions in order before any optional follow-ups.",
    "- Keep each question short, clear, and relevant to the role and resume data.",
    "- Use the candidate answers to ask targeted follow-up questions when time allows.",
    "- Capture every asked question and the candidate answer in structured results.",
    "- At the end of the interview, produce a concise interview summary and an overall rating from 0 to 10.",
    "- Make sure the final payload contains question_results, transcript, evaluation, interview_summary, overall_rating, resume_score if available, and resume_data if available.",
    "- If time is limited, prioritize the compulsory questions and finish with a concise summary and rating.",
  ].join("\n");

  return prompt;
}
