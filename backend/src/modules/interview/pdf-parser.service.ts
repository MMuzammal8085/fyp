import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GroqResumeAnalysisService } from './groq-resume-analysis.service';

export type ResumeMatchResult = {
  score: number;
  match_reasons: string[];
  gaps: string[];
};

export type ResumeUploadParseInput = {
  jobTitle: string;
  jobDescription: string;
  compulsoryQuestions: string[];
  resumeBuffer: Buffer;
  resumeFileName: string;
};

export type ResumeUploadParseResult = {
  vapiResumeData: any;
  vapiResumeSummary?: string;
  localResumeScore?: number;
  parserResult: ResumeMatchResult & Record<string, any>;
  parserWarning?: string;
  parserResumeScore?: number;
};

@Injectable()
export class PdfParserService {
  private readonly logger = new Logger(PdfParserService.name);

  constructor(
    private readonly groqResumeAnalysisService: GroqResumeAnalysisService,
  ) {}

  private normalizeText(value: string): string {
    return String(value ?? '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private tokenizeText(value: string): string[] {
    return this.normalizeText(value)
      .toLowerCase()
      .split(/[^a-z0-9+.#/-]+/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 3);
  }

  private deriveResumeScoreFromText(
    resumeText: string,
    jobTitle: string,
    jobDescription: string,
    compulsoryQuestions: string[],
  ): number | undefined {
    const normalizedResume = this.normalizeText(resumeText);
    if (!normalizedResume) return undefined;

    const resumeTokens = new Set(this.tokenizeText(normalizedResume));
    const jobTokens = new Set(
      [...this.tokenizeText(jobTitle), ...this.tokenizeText(jobDescription)]
        .concat(
          compulsoryQuestions.flatMap((question) =>
            this.tokenizeText(question),
          ),
        )
        .filter(Boolean),
    );

    let overlapCount = 0;
    for (const token of jobTokens) {
      if (resumeTokens.has(token)) overlapCount += 1;
    }

    const overlapScore = Math.min(45, overlapCount * 6);
    const lengthScore = Math.min(25, Math.round(normalizedResume.length / 60));
    const sectionScore =
      [
        /experience/i.test(normalizedResume),
        /education/i.test(normalizedResume),
        /project/i.test(normalizedResume),
        /skill/i.test(normalizedResume),
        /achievement|award/i.test(normalizedResume),
      ].filter(Boolean).length * 5;

    return Number(
      Math.min(100, overlapScore + lengthScore + sectionScore).toFixed(1),
    );
  }

  private deriveLocalMatchResult(
    resumeText: string,
    jobTitle: string,
    jobDescription: string,
    compulsoryQuestions: string[],
  ): ResumeMatchResult {
    const score =
      this.deriveResumeScoreFromText(
        resumeText,
        jobTitle,
        jobDescription,
        compulsoryQuestions,
      ) ?? 0;

    const resumeTokens = new Set(this.tokenizeText(resumeText));
    const jobTokens = [
      ...this.tokenizeText(jobTitle),
      ...this.tokenizeText(jobDescription),
      ...compulsoryQuestions.flatMap((q) => this.tokenizeText(q)),
    ];
    const uniqueJobTokens = [...new Set(jobTokens)];

    const matched = uniqueJobTokens.filter((token) => resumeTokens.has(token));
    const missing = uniqueJobTokens.filter((token) => !resumeTokens.has(token));

    return {
      score,
      match_reasons:
        matched.length > 0
          ? matched.slice(0, 8).map((t) => `Resume mentions "${t}" relevant to the role`)
          : score > 0
            ? ['Resume contains general professional content']
            : [],
      gaps:
        missing.length > 0
          ? missing.slice(0, 8).map((t) => `No clear mention of "${t}" from job requirements`)
          : [],
    };
  }

  private summarizeResumeText(resumeText: string): {
    skills: string;
    projects: string;
  } {
    const normalizedResume = this.normalizeText(resumeText);
    if (!normalizedResume) {
      return { skills: '', projects: '' };
    }

    const sentences = normalizedResume
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    const skillKeywords = [
      'javascript',
      'typescript',
      'react',
      'node',
      'nestjs',
      'express',
      'mongodb',
      'postgres',
      'sql',
      'python',
      'java',
      'php',
      'laravel',
      'docker',
      'kubernetes',
      'aws',
      'azure',
      'git',
      'rest',
      'graphql',
      'ci/cd',
      'testing',
      'api',
    ];

    const matchedSkills = skillKeywords.filter((skill) =>
      new RegExp(
        `\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
        'i',
      ).test(normalizedResume),
    );

    const projectSentences = sentences.filter((sentence) =>
      /project|built|developed|implemented|designed|delivered/i.test(sentence),
    );

    return {
      skills: matchedSkills.slice(0, 8).join(', '),
      projects: projectSentences.slice(0, 3).join(' '),
    };
  }

  private async extractResumeTextFromPdf(buffer: Buffer): Promise<string> {
    if (!buffer?.length) {
      this.logger.warn('⚠️ PDF buffer is empty — cannot extract resume text');
      return '';
    }

    try {
      const pdfParseModule: any = await import('pdf-parse');
      const pdfParse =
        typeof pdfParseModule === 'function'
          ? pdfParseModule
          : (pdfParseModule?.default ?? pdfParseModule);

      const result = await pdfParse(buffer);
      const text = this.normalizeText(result?.text ?? '');

      if (!text) {
        this.logger.warn(
          `⚠️ PDF parsed but extracted 0 characters (pages: ${result?.numpages ?? 'unknown'}, file size: ${buffer.length} bytes). ` +
            'The PDF may be image-only or encrypted.',
        );
      } else {
        this.logger.log(
          `✅ Extracted ${text.length} chars from PDF (${result?.numpages ?? '?'} pages)`,
        );
      }

      return text;
    } catch (error: any) {
      this.logger.warn(
        `Local PDF text extraction failed: ${error?.message ?? error}`,
      );
      return '';
    }
  }

  private getResumeParserMatchUrl(): string {
    return String(
      process.env.RESUME_PARSER_MATCH_URL ??
        process.env.RESUME_SCORE ??
        '',
    ).trim();
  }

  private getResumeParserTimeoutMs(): number {
    const raw = String(process.env.RESUME_PARSER_TIMEOUT_MS ?? '').trim();
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 120_000;
  }

  private normalizeExternalParserResult(payload: any): ResumeMatchResult | null {
    if (!payload || typeof payload !== 'object') return null;

    const scoreCandidate =
      payload.score ??
      payload.resume_score ??
      payload.overall_score ??
      payload.evaluation?.resume_score;

    const score =
      typeof scoreCandidate === 'number' && Number.isFinite(scoreCandidate)
        ? Math.min(100, Math.max(0, Number(scoreCandidate)))
        : typeof scoreCandidate === 'string'
          ? Number(scoreCandidate.replace(/[^0-9.\-]+/g, ''))
          : NaN;

    if (!Number.isFinite(score)) return null;

    const matchReasons = Array.isArray(payload.match_reasons)
      ? payload.match_reasons.map(String)
      : Array.isArray(payload.strengths)
        ? payload.strengths.map(String)
        : [];

    const gaps = Array.isArray(payload.gaps)
      ? payload.gaps.map(String)
      : Array.isArray(payload.weaknesses)
        ? payload.weaknesses.map(String)
        : [];

    return {
      score: Number(score.toFixed(1)),
      match_reasons: matchReasons.slice(0, 10),
      gaps: gaps.slice(0, 10),
    };
  }

  private async callResumeParserApi(options: {
    jobTitle: string;
    jobDescription: string;
    resumeBuffer: Buffer;
    resumeFileName: string;
  }): Promise<any> {
    const matchUrl = this.getResumeParserMatchUrl();
    if (!matchUrl) {
      throw new ServiceUnavailableException(
        'External resume parser URL not configured',
      );
    }

    const form = new FormData();
    form.append('job_title', options.jobTitle);
    form.append('job_description', options.jobDescription);
    // Some external parsers expect camelCase field names
    form.append('jobTitle', options.jobTitle);
    form.append('jobDescription', options.jobDescription);
    form.append(
      'resume',
      new Blob([new Uint8Array(options.resumeBuffer)], {
        type: 'application/pdf',
      }),
      options.resumeFileName,
    );

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.getResumeParserTimeoutMs(),
    );

    try {
      const response = await fetch(matchUrl, {
        method: 'POST',
        body: form,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new ServiceUnavailableException(
          `Resume parser failed (${response.status} ${response.statusText})${text ? `: ${text}` : ''}`,
        );
      }

      const responseClone = response.clone();
      try {
        return await response.json();
      } catch {
        const text = await responseClone.text().catch(() => '');
        throw new ServiceUnavailableException(
          `Resume parser returned an invalid response${text ? `: ${text.slice(0, 500)}` : ''}`,
        );
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new ServiceUnavailableException(
          `Resume parser timed out after ${this.getResumeParserTimeoutMs()}ms`,
        );
      }

      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      throw new ServiceUnavailableException(
        `Resume parser request failed: ${error?.message ?? error}`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private async analyzeWithGroq(
    resumeText: string,
    jobTitle: string,
    jobDescription: string,
  ): Promise<ResumeMatchResult | null> {
    const groqResult = await this.groqResumeAnalysisService.analyzeResume({
      resumeText,
      jobTitle,
      jobDescription,
    });

    if (groqResult.error || typeof groqResult.score !== 'number') {
      this.logger.warn(
        `Groq resume match unavailable: ${groqResult.error ?? 'missing score'}`,
      );
      return null;
    }

    return {
      score: groqResult.score,
      match_reasons: groqResult.match_reasons ?? groqResult.strengths ?? [],
      gaps: groqResult.gaps ?? groqResult.weaknesses ?? [],
    };
  }

  async parseUpload(
    options: ResumeUploadParseInput,
  ): Promise<ResumeUploadParseResult> {
    const extractedResumeText = await this.extractResumeTextFromPdf(
      options.resumeBuffer,
    );
    const fallbackInsights = this.summarizeResumeText(extractedResumeText);
    const localMatch = extractedResumeText
      ? this.deriveLocalMatchResult(
          extractedResumeText,
          options.jobTitle,
          options.jobDescription,
          options.compulsoryQuestions,
        )
      : { score: 0, match_reasons: [], gaps: ['Could not extract text from PDF'] };

    const vapiResumeData = {
      resume_text: extractedResumeText || undefined,
      skills: fallbackInsights.skills,
      projects: fallbackInsights.projects,
      fallback_source: 'local_pdf_text_extraction',
    };

    const vapiResumeSummary =
      fallbackInsights.skills ||
      fallbackInsights.projects ||
      extractedResumeText ||
      undefined;

    let parserResult: ResumeMatchResult & Record<string, any> = {
      ...localMatch,
      source: 'local_keyword_match',
    };
    let parserWarning: string | undefined;

    // Prefer Groq LLM comparison when we have readable resume text
    if (extractedResumeText.length >= 50) {
      try {
        const groqMatch = await this.analyzeWithGroq(
          extractedResumeText,
          options.jobTitle,
          options.jobDescription,
        );
        if (groqMatch) {
          parserResult = {
            ...groqMatch,
            source: 'groq_llm',
          };
          this.logger.log(
            `✅ Groq resume match: score=${groqMatch.score}, reasons=${groqMatch.match_reasons.length}, gaps=${groqMatch.gaps.length}`,
          );
        }
      } catch (error: any) {
        parserWarning = `Groq resume analysis failed: ${error?.message ?? error}`;
        this.logger.warn(parserWarning);
      }
    } else if (!extractedResumeText) {
      parserWarning =
        'PDF text extraction returned empty content; using fallback score only';
    }

    // Optional external parser — only if RESUME_PARSER_MATCH_URL is configured
    if (this.getResumeParserMatchUrl()) {
      try {
        const external = await this.callResumeParserApi({
          jobTitle: options.jobTitle,
          jobDescription: options.jobDescription,
          resumeBuffer: options.resumeBuffer,
          resumeFileName: options.resumeFileName,
        });
        const normalizedExternal = this.normalizeExternalParserResult(external);
        if (normalizedExternal) {
          parserResult = {
            ...normalizedExternal,
            source: 'external_api',
            raw: external,
          };
        }
      } catch (error: any) {
        const externalWarning = String(error?.message ?? 'External parser failed');
        parserWarning = parserWarning
          ? `${parserWarning}; ${externalWarning}`
          : externalWarning;
        this.logger.warn(externalWarning);
      }
    }

    return {
      vapiResumeData,
      vapiResumeSummary,
      localResumeScore: localMatch.score,
      parserResult,
      parserWarning,
      parserResumeScore: parserResult.score,
    };
  }
}
