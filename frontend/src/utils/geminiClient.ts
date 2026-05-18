import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function generateInterviewQuestions(
  jobDescription: string,
): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Based on the following job description, generate 5 important and challenging interview questions for candidates.

    Job Description:
    ${jobDescription}

    Return ONLY the questions as a numbered list (1. 2. 3. etc), one question per line. Do not include any other text or explanation.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse the response to extract questions
    const questions = responseText
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => line.replace(/^\d+\.\s*/, "").trim())
      .filter((q) => q.length > 0);

    return questions;
  } catch (error) {
    console.error("Error generating questions with Gemini:", error);
    throw error;
  }
}

export async function analyzeCandidate(
  response: string,
  question: string,
): Promise<{ score: number; feedback: string }> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Analyze the following candidate response to an interview question and provide a score and feedback.

    Question: ${question}
    Candidate Response: ${response}

    Provide the response in this exact format:
    SCORE: [number between 1-10]
    FEEDBACK: [your feedback here]`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse the response
    const scoreMatch = responseText.match(/SCORE:\s*(\d+)/);
    const feedbackMatch = responseText.match(/FEEDBACK:\s*(.+?)(?=\n|$)/s);

    const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;
    const feedback = feedbackMatch
      ? feedbackMatch[1].trim()
      : "Unable to analyze response";

    return { score, feedback };
  } catch (error) {
    console.error("Error analyzing candidate with Gemini:", error);
    throw error;
  }
}

export async function generateJobDescription(input: {
  jobTitle: string;
  skills: string[];
  languages: string[];
  experience: string;
}): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Write a clear job description for the following role.

Job Title: ${input.jobTitle}
Required Skills: ${input.skills.join(", ") || "N/A"}
Languages/Tech: ${input.languages.join(", ") || "N/A"}
Experience: ${input.experience || "N/A"}

Requirements:
- Output ONLY the job description text.
- Keep it professional and concise.
- Include: short intro, responsibilities (bullets), requirements (bullets).
- Do NOT include pricing, salary, or company-specific claims.
`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Error generating job description with Gemini:", error);
    throw error;
  }
}
