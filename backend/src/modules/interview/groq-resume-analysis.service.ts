import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export type GroqResumeAnalysisInput = {
  resumeText: string;
  jobTitle?: string;
  jobDescription?: string;
};

export type GroqResumeAnalysisResult = {
  resume_score?: number; // 0-100
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  skills_match?: number; // 0-100
  experience_fit?: number; // 0-100
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

  private safeParseJson(text: string): any {
    const trimmed = String(text ?? '').trim();
    if (!trimmed) return undefined;

    try {
      return JSON.parse(trimmed);
    } catch {
      // Attempt to salvage JSON from surrounding text
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

  async analyzeResume(
    input: GroqResumeAnalysisInput,
  ): Promise<GroqResumeAnalysisResult> {
    const resumeText = String(input.resumeText ?? '').trim();

    if (!resumeText) {
      this.logger.warn('📝 Empty resume text provided, skipping analysis');
      return {
        error: 'Empty resume text',
        generatedAt: new Date().toISOString(),
      };
    }

    if (!this.groq) {
      this.logger.error(
        '❌ Groq client not initialized. GROQ_API_KEY is missing. ' +
          'Resume will not be analyzed. Scores will show as "-" in frontend.',
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
      `📋 Job title: ${input.jobTitle}, Job description length: ${String(input.jobDescription ?? '').length}`,
    );

    const prompt = {
      jobTitle: input.jobTitle ?? 'Position',
      jobDescription: input.jobDescription ?? '',
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
              'You are a resume evaluator. Analyze the resume against the job description. ' +
              'Produce ONLY valid JSON (no markdown, no explanations). ' +
              'Return an object with: resume_score (0-100), summary (brief evaluation), strengths[] (list of strengths), ' +
              'weaknesses[] (areas of improvement), skills_match (0-100 how well skills match), experience_fit (0-100 how well experience matches).',
          },
          {
            role: 'user',
            content:
              'Analyze this resume and job fit. Output JSON only.\n\n' +
              JSON.stringify(prompt),
          },
        ],
        response_format: { type: 'json_object' } as any,
      });

      const content = response.choices?.[0]?.message?.content ?? '';
      this.logger.log(`📝 Groq response: ${content.slice(0, 500)}`);

      const parsed = this.safeParseJson(content);

      if (!parsed || typeof parsed !== 'object') {
        this.logger.error(
          '❌ Groq returned invalid JSON for resume analysis. ' +
            'Response was not parseable. Scores will show as "-".',
        );
        return {
          error: 'Invalid response format from Groq',
          generatedAt: new Date().toISOString(),
        };
      }

      // Ensure numeric scores are within 0-100
      const resumeScore = parsed.resume_score
        ? Math.min(100, Math.max(0, Number(parsed.resume_score)))
        : undefined;
      const skillsMatch = parsed.skills_match
        ? Math.min(100, Math.max(0, Number(parsed.skills_match)))
        : undefined;
      const experienceFit = parsed.experience_fit
        ? Math.min(100, Math.max(0, Number(parsed.experience_fit)))
        : undefined;

      return {
        resume_score: resumeScore,
        summary: String(parsed.summary ?? '').slice(0, 1000),
        strengths: Array.isArray(parsed.strengths)
          ? parsed.strengths.slice(0, 10).map((s: any) => String(s))
          : undefined,
        weaknesses: Array.isArray(parsed.weaknesses)
          ? parsed.weaknesses.slice(0, 10).map((w: any) => String(w))
          : undefined,
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
