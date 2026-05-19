/**
 * Parse JSON from LLM output, stripping markdown fences and surrounding text.
 */
export function safeParseLlmJson(text: string): any {
  let trimmed = String(text ?? '').trim();
  if (!trimmed) return undefined;

  // Strip ```json ... ``` or ``` ... ``` wrappers
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) {
    trimmed = fenceMatch[1].trim();
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const slice = trimmed.slice(start, end + 1);
      try {
        return JSON.parse(slice);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}

export function truncateForPrompt(text: string, maxChars: number): string {
  const normalized = String(text ?? '').trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars)}\n...[truncated ${normalized.length - maxChars} chars]`;
}

/**
 * Remove common Vapi/timestamp noise from transcripts before LLM analysis.
 */
export function cleanInterviewTranscript(transcript: string): string {
  return String(transcript ?? '')
    .replace(/\[\d{1,2}:\d{2}(?::\d{2})?\]/g, ' ')
    .replace(/^(user|assistant|bot|ai|interviewer|candidate):\s*/gim, '')
    .replace(/\s+/g, ' ')
    .trim();
}
