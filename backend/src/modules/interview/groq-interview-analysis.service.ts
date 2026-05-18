import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export type GroqInterviewAnalysisInput = {
  transcript: string;
  jobTitle?: string;
  jobDescription?: string;
  compulsoryQuestions?: string[];
  resumeData?: any;
  evaluation?: any;
};

@Injectable()
export class GroqInterviewAnalysisService {
  private readonly logger = new Logger(GroqInterviewAnalysisService.name);
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
      this.logger.warn(
        'GROQ_API_KEY is not set; transcript analysis will be skipped.',
      );
      return;
    }

    this.groq = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  private safeParseJson(text: string): any {
    const trimmed = String(text ?? '').trim();
    if (!trimmed) return undefined;

    try {
      return JSON.parse(trimmed);
    } catch {
      // Attempt to salvage a JSON object from surrounding text.
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

  async analyzeTranscript(input: GroqInterviewAnalysisInput): Promise<any> {
    const transcript = String(input.transcript ?? '').trim();
    if (!transcript) {
      this.logger.warn('📝 Empty transcript provided, skipping analysis');
      return undefined;
    }

    if (!this.groq) {
      this.logger.warn('⚠️ Groq client not initialized, GROQ_API_KEY missing');
      return {
        enabled: false,
        reason: 'GROQ_API_KEY missing',
        generatedAt: new Date().toISOString(),
      };
    }

    this.logger.log(`🔄 Starting Groq analysis for ${this.preferredModel}`);
    this.logger.log(`📝 Transcript length: ${transcript.length} chars`);
    this.logger.log(
      `📋 Job title: ${input.jobTitle}, Job description length: ${String(input.jobDescription ?? '').length}`,
    );

    const prompt = {
      jobTitle: input.jobTitle ?? '',
      jobDescription: input.jobDescription ?? '',
      compulsoryQuestions: Array.isArray(input.compulsoryQuestions)
        ? input.compulsoryQuestions
        : [],
      resumeData: input.resumeData ?? undefined,
      evaluation: input.evaluation ?? undefined,
      transcript,
    };

    const analyzeOnce = async (payload: any) => {
      const response = await this.groq!.chat.completions.create({
        model: this.preferredModel,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              'You are an interview evaluator. Produce ONLY valid JSON (no markdown). Do not include the transcript. ' +
              'Return an object with: overall_rating (0-10), recommendation (hire|maybe|no_hire), summary, strengths[], weaknesses[], risks[], ' +
              'dimension_scores {technical,communication,problem_solving,experience_fit} each 0-10, and evidence {quotes[]} with short verbatim snippets (<=120 chars each).',
          },
          {
            role: 'user',
            content:
              'Analyze this interview given the context payload below. Output JSON only.\n\n' +
              JSON.stringify(payload),
          },
        ],
        response_format: { type: 'json_object' } as any,
      });

      const content = response.choices?.[0]?.message?.content ?? '';
      const parsed = this.safeParseJson(content);
      return { content, parsed };
    };

    try {
      // If transcript is very long, analyze in chunks then combine.
      const maxChunkChars = 22_000;
      const overlapChars = 500;

      if (transcript.length <= maxChunkChars) {
        const { content, parsed } = await analyzeOnce(prompt);
        if (parsed && typeof parsed === 'object') {
          return {
            ...parsed,
            model: this.preferredModel,
            generatedAt: new Date().toISOString(),
          };
        }

        this.logger.warn('Groq returned non-JSON analysis; storing raw text');
        return {
          model: this.preferredModel,
          generatedAt: new Date().toISOString(),
          raw: String(content).slice(0, 20_000),
        };
      }

      const chunks: string[] = [];
      for (let start = 0; start < transcript.length; ) {
        const end = Math.min(transcript.length, start + maxChunkChars);
        const chunk = transcript.slice(start, end);
        chunks.push(chunk);
        if (end >= transcript.length) break;
        start = Math.max(0, end - overlapChars);
      }

      const chunkAnalyses: any[] = [];
      for (let i = 0; i < chunks.length; i += 1) {
        const chunkPrompt = {
          ...prompt,
          transcriptChunkIndex: i + 1,
          transcriptChunksTotal: chunks.length,
          transcript: chunks[i],
        };
        const { content, parsed } = await analyzeOnce(chunkPrompt);
        chunkAnalyses.push(
          parsed && typeof parsed === 'object'
            ? { ...parsed, chunk: i + 1 }
            : { chunk: i + 1, raw: String(content).slice(0, 20_000) },
        );
      }

      const combinePayload = {
        jobTitle: input.jobTitle ?? '',
        jobDescription: input.jobDescription ?? '',
        compulsoryQuestions: Array.isArray(input.compulsoryQuestions)
          ? input.compulsoryQuestions
          : [],
        resumeData: input.resumeData ?? undefined,
        evaluation: input.evaluation ?? undefined,
        note: 'The transcript was analyzed in multiple chunks. Combine the chunk analyses into a single final evaluation. Do not include the transcript.',
        chunkAnalyses,
      };

      const { content: finalContent, parsed: finalParsed } =
        await analyzeOnce(combinePayload);

      if (finalParsed && typeof finalParsed === 'object') {
        return {
          ...finalParsed,
          model: this.preferredModel,
          generatedAt: new Date().toISOString(),
          chunksAnalyzed: chunks.length,
        };
      }

      return {
        model: this.preferredModel,
        generatedAt: new Date().toISOString(),
        chunksAnalyzed: chunks.length,
        raw: String(finalContent).slice(0, 20_000),
      };
    } catch (error: any) {
      this.logger.warn(
        `Groq transcript analysis failed: ${error?.message ?? error}`,
      );
      return {
        model: this.preferredModel,
        generatedAt: new Date().toISOString(),
        error: String(error?.message ?? error),
      };
    }
  }
}
