import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  safeParseLlmJson,
  truncateForPrompt,
} from 'src/shared/utils/json.utils';

export type GroqResumeAnalysisInput = {
  resumeText: string;
  jobTitle?: string;
  jobDescription?: string;
};

export type GroqResumeAnalysisResult = {
  score?: number;
  match_reasons?: string[];
  gaps?: string[];
  resume_score?: number;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  skills_match?: number;
  experience_fit?: number;
  model?: string;
  generatedAt?: string;
  error?: string;
};

@Injectable()
export class GroqResumeAnalysisService {
  private readonly logger = new Logger(GroqResumeAnalysisService.name);
  private readonly groq?: OpenAI;
  private readonly preferredModel: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey =
      this.configService.get<string>('GROQ_API_KEY') ??
      this.configService.get<string>('OPENAI_API_KEY') ??
      this.configService.get<string>('OPEN_AI_API_KEY');

    this.preferredModel =
      this.configService.get<string>('GROQ_MODEL') ?? 'llama-3.3-70b-versatile';

    if (!apiKey) {
      this.logger.error(
        '❌ CRITICAL: GROQ_API_KEY is not set! Resume analysis will be skipped. ' +
          'Resume scores will show as "-". ' +
          'Set GROQ_API_KEY in your backend/.env file.',
      );
      return;
    }

    this.groq = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    this.logger.log(
      `✅ Groq service initialized with model: ${this.preferredModel}`,
    );
  }

  async analyzeResume(
    input: GroqResumeAnalysisInput,
  ): Promise<GroqResumeAnalysisResult> {
    const resumeText = truncateForPrompt(String(input.resumeText ?? '').trim(), 12_000);
    const jobDescription = truncateForPrompt(
      String(input.jobDescription ?? '').trim(),
      4_000,
    );

    if (!resumeText) {
      this.logger.warn('📝 Empty resume text provided, skipping analysis');
      return {
        error: 'Empty resume text',
        generatedAt: new Date().toISOString(),
      };
    }

    if (!this.groq) {
      this.logger.error(
        '❌ Groq client not initialized. GROQ_API_KEY is missing.',
      );
      return {
        error: 'Groq API not configured - GROQ_API_KEY missing',
        generatedAt: new Date().toISOString(),
      };
    }

    this.logger.log(
      `🔄 Starting Groq resume analysis for ${this.preferredModel}`,
    );
    this.logger.log(`📝 Resume text length: ${resumeText.length} chars`);
    this.logger.log(
      `📋 Job title: ${input.jobTitle}, Job description length: ${jobDescription.length}`,
    );

    const prompt = {
      jobTitle: input.jobTitle ?? 'Position',
      jobDescription,
      resumeText,
    };

    try {
      const response = await this.groq.chat.completions.create({
        model: this.preferredModel,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content:
              'You are a resume evaluator. Compare the resume against the job description. ' +
              'Respond with ONLY valid JSON — no markdown fences, no prose outside the JSON object. ' +
              'Required fields: score (0-100 integer), match_reasons (string array of why the candidate fits), ' +
              'gaps (string array of missing skills/experience), summary (brief string), ' +
              'skills_match (0-100), experience_fit (0-100).',
          },
          {
            role: 'user',
            content:
              'Analyze resume vs job fit. Return JSON only.\n\n' +
              JSON.stringify(prompt),
          },
        ],
        response_format: { type: 'json_object' } as any,
      });

      const content = response.choices?.[0]?.message?.content ?? '';
      this.logger.log(`📝 Groq response: ${content.slice(0, 500)}`);

      const parsed = safeParseLlmJson(content);

      if (!parsed || typeof parsed !== 'object') {
        this.logger.error('❌ Groq returned invalid JSON for resume analysis.');
        return {
          error: 'Invalid response format from Groq',
          generatedAt: new Date().toISOString(),
        };
      }

      const rawScore =
        parsed.score ?? parsed.resume_score ?? parsed.overall_score;
      const score =
        typeof rawScore === 'number' && Number.isFinite(rawScore)
          ? Math.min(100, Math.max(0, Number(rawScore)))
          : undefined;

      const matchReasons = Array.isArray(parsed.match_reasons)
        ? parsed.match_reasons.map(String).slice(0, 10)
        : Array.isArray(parsed.strengths)
          ? parsed.strengths.map(String).slice(0, 10)
          : [];

      const gaps = Array.isArray(parsed.gaps)
        ? parsed.gaps.map(String).slice(0, 10)
        : Array.isArray(parsed.weaknesses)
          ? parsed.weaknesses.map(String).slice(0, 10)
          : [];

      const skillsMatch = parsed.skills_match
        ? Math.min(100, Math.max(0, Number(parsed.skills_match)))
        : undefined;
      const experienceFit = parsed.experience_fit
        ? Math.min(100, Math.max(0, Number(parsed.experience_fit)))
        : undefined;

      return {
        score,
        match_reasons: matchReasons,
        gaps,
        resume_score: score,
        summary: String(parsed.summary ?? '').slice(0, 1000),
        strengths: matchReasons,
        weaknesses: gaps,
        skills_match: skillsMatch,
        experience_fit: experienceFit,
        model: this.preferredModel,
        generatedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `❌ Groq resume analysis failed: ${error?.message ?? error}`,
      );
      return {
        error: String(error?.message ?? 'Analysis failed'),
        model: this.preferredModel,
        generatedAt: new Date().toISOString(),
      };
    }
  }
}
