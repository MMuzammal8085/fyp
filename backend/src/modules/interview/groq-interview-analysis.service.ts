import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  cleanInterviewTranscript,
  safeParseLlmJson,
  truncateForPrompt,
} from 'src/shared/utils/json.utils';

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

  private buildAnalysisPayload(
    input: GroqInterviewAnalysisInput,
    transcript: string,
    extra?: Record<string, unknown>,
  ) {
    return {
      jobTitle: truncateForPrompt(input.jobTitle ?? '', 500),
      jobDescription: truncateForPrompt(input.jobDescription ?? '', 4_000),
      compulsoryQuestions: Array.isArray(input.compulsoryQuestions)
        ? input.compulsoryQuestions.slice(0, 20).map(String)
        : [],
      resumeData: input.resumeData ?? undefined,
      evaluation: input.evaluation ?? undefined,
      transcript: truncateForPrompt(transcript, 22_000),
      ...extra,
    };
  }

  async analyzeTranscript(input: GroqInterviewAnalysisInput): Promise<any> {
    const transcript = cleanInterviewTranscript(String(input.transcript ?? ''));
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

    const analyzeOnce = async (payload: any) => {
      const response = await this.groq!.chat.completions.create({
        model: this.preferredModel,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              'You are an interview evaluator. Respond with ONLY valid JSON — no markdown fences, no text outside the JSON object. ' +
              'Do not repeat the transcript. Required fields: ' +
              'overall_rating (0-10 number), recommendation (hire|maybe|no_hire), summary (string), ' +
              'sentiment (positive|neutral|negative), sentiment_score (-1 to 1 number), ' +
              'strengths (string array), weaknesses (string array), risks (string array), ' +
              'dimension_scores {technical,communication,problem_solving,experience_fit} each 0-10, ' +
              'evidence {quotes: string array} with short verbatim snippets (max 120 chars each).',
          },
          {
            role: 'user',
            content:
              'Analyze this interview from the context payload below. Return JSON only.\n\n' +
              JSON.stringify(payload),
          },
        ],
        response_format: { type: 'json_object' } as any,
      });

      const content = response.choices?.[0]?.message?.content ?? '';
      const parsed = safeParseLlmJson(content);
      return { content, parsed };
    };

    try {
      const maxChunkChars = 18_000;
      const overlapChars = 400;
      const prompt = this.buildAnalysisPayload(input, transcript);

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
      for (let start = 0; start < transcript.length; start += maxChunkChars - overlapChars) {
        chunks.push(transcript.slice(start, start + maxChunkChars));
      }

      const chunkAnalyses: any[] = [];
      for (let i = 0; i < chunks.length; i += 1) {
        const chunkPrompt = this.buildAnalysisPayload(input, chunks[i], {
          transcriptChunkIndex: i + 1,
          transcriptChunksTotal: chunks.length,
        });
        const { content, parsed } = await analyzeOnce(chunkPrompt);
        chunkAnalyses.push(
          parsed && typeof parsed === 'object'
            ? { ...parsed, chunk: i + 1 }
            : { chunk: i + 1, raw: String(content).slice(0, 20_000) },
        );
      }

      const combinePayload = {
        jobTitle: prompt.jobTitle,
        jobDescription: prompt.jobDescription,
        compulsoryQuestions: prompt.compulsoryQuestions,
        resumeData: prompt.resumeData,
        evaluation: prompt.evaluation,
        note: 'The transcript was analyzed in multiple chunks. Combine chunk analyses into one final evaluation. Do not include the transcript.',
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
