import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

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
  parserResult: any;
  parserWarning?: string;
  parserResumeScore?: number;
};

@Injectable()
export class PdfParserService {
  private readonly logger = new Logger(PdfParserService.name);

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
    try {
      const pdfParseModule: any = await import('pdf-parse');
      const pdfParse = pdfParseModule?.default ?? pdfParseModule;
      const result = await pdfParse(buffer);
      return this.normalizeText(result?.text ?? '');
    } catch (error: any) {
      this.logger.warn(
        `Local PDF text extraction failed: ${error?.message ?? error}`,
      );
      return '';
    }
  }

  private getResumeParserMatchUrl(): string {
    return (
      process.env.RESUME_PARSER_MATCH_URL ??
      'https://subexternal-unvisited-jerry.ngrok-free.dev/match'
    ).trim();
  }

  private getResumeParserTimeoutMs(): number {
    const raw = String(process.env.RESUME_PARSER_TIMEOUT_MS ?? '').trim();
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 120_000;
  }

  private extractResumeScore(payload: any): number | undefined {
    const candidates = [
      payload?.resume_score,
      payload?.overall_score,
      payload?.evaluation?.resume_score,
      payload?.evaluation?.overall_score,
      payload?.results?.resume_score,
      payload?.results?.overall_score,
    ];

    for (const value of candidates) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }

      if (typeof value === 'string') {
        const cleaned = value.replace(/[^0-9.\-]+/g, '').trim();
        if (cleaned) {
          const parsed = Number(cleaned);
          if (Number.isFinite(parsed)) return parsed;
        }
      }
    }

    return undefined;
  }

  private async callResumeParserApi(options: {
    jobTitle: string;
    jobDescription: string;
    resumeBuffer: Buffer;
    resumeFileName: string;
  }): Promise<any> {
    const matchUrl = this.getResumeParserMatchUrl();
    if (!matchUrl) {
      throw new ServiceUnavailableException('Resume parser is not configured');
    }

    const form = new FormData();
    form.append('job_title', options.jobTitle);
    form.append('job_description', options.jobDescription);
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

  async parseUpload(
    options: ResumeUploadParseInput,
  ): Promise<ResumeUploadParseResult> {
    const extractedResumeText = await this.extractResumeTextFromPdf(
      options.resumeBuffer,
    );
    const fallbackInsights = this.summarizeResumeText(extractedResumeText);
    const localResumeScore = this.deriveResumeScoreFromText(
      extractedResumeText,
      options.jobTitle,
      options.jobDescription,
      options.compulsoryQuestions,
    );

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

    let parserResult: any = {};
    let parserWarning: string | undefined;
    try {
      parserResult = await this.callResumeParserApi({
        jobTitle: options.jobTitle,
        jobDescription: options.jobDescription,
        resumeBuffer: options.resumeBuffer,
        resumeFileName: options.resumeFileName,
      });
    } catch (error: any) {
      parserWarning = String(error?.message ?? 'Resume parser failed');
      parserResult = {
        parser_error: parserWarning,
        fallback_source: 'external_resume_parser_unavailable',
      };
    }

    return {
      vapiResumeData,
      vapiResumeSummary,
      localResumeScore,
      parserResult,
      parserWarning,
      parserResumeScore: this.extractResumeScore(parserResult),
    };
  }
}
