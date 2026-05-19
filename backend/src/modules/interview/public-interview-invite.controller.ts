import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  UnauthorizedException,
  ServiceUnavailableException,
  NotFoundException,
  Param,
  Post,
  Body,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Any, DataSource, MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';

import { Interview } from 'src/database/entities/interview.entity';
import { InterviewInvite } from 'src/database/entities/interview-invite.entity';
import { CloudinaryService } from 'src/shared/service/cloudinary.service';
import { InterviewResultService } from './interview-result.service';
import { PdfParserService } from './pdf-parser.service';
import { GroqInterviewAnalysisService } from './groq-interview-analysis.service';
import { GroqResumeAnalysisService } from './groq-resume-analysis.service';

@Controller('public/interview-invites')
export class PublicInterviewInviteController {
  private readonly logger = new Logger(PublicInterviewInviteController.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
    private readonly interviewResultService: InterviewResultService,
    private readonly pdfParserService: PdfParserService,
    private readonly groqInterviewAnalysisService: GroqInterviewAnalysisService,
    private readonly groqResumeAnalysisService: GroqResumeAnalysisService,
  ) {}

  private get inviteRepo() {
    return this.dataSource.getMongoRepository(InterviewInvite);
  }

  private get interviewRepo() {
    return this.dataSource.getMongoRepository(Interview);
  }

  private getMeetingUrl(roomId: string) {
    const base = (
      process.env.INTERVIEW_MEETING_BASE_URL ?? 'https://meet.jit.si'
    ).replace(/\/+$/, '');
    return `${base}/${encodeURIComponent(roomId)}`;
  }

  private safeJsonStringify(value: any, maxLen = 4000): string {
    let text = '';
    try {
      text = JSON.stringify(value ?? null);
    } catch {
      text = String(value ?? '');
    }
    if (text.length <= maxLen) return text;
    return `${text.slice(0, maxLen)}…`;
  }

  private toText(value: any): string {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
      return value
        .map((v) => (typeof v === 'string' ? v : this.safeJsonStringify(v)))
        .filter(Boolean)
        .join(', ');
    }
    return this.safeJsonStringify(value);
  }

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

  private async callResumeParserApi(options: {
    job_title: string;
    job_description: string;
    resumeBuffer: Buffer;
    resumeFileName: string;
  }): Promise<any> {
    const matchUrl = this.getResumeParserMatchUrl();
    if (!matchUrl) {
      throw new ServiceUnavailableException('Resume parser is not configured');
    }

    const form = new FormData();
    form.append('job_title', options.job_title);
    form.append('job_description', options.job_description);
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

      // Accept numeric strings like "85" or "85.0"
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

  private extractInterviewScore(payload: any): number | undefined {
    const candidates = [
      payload?.overall_score,
      payload?.overallScore,
      payload?.score,
      payload?.evaluation?.overall_score,
      payload?.evaluation?.overallScore,
      payload?.results?.overall_score,
      payload?.results?.overallScore,
    ];

    for (const value of candidates) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
    }

    return undefined;
  }

  private extractInterviewRating(payload: any): number | undefined {
    const candidates = [
      payload?.overall_rating,
      payload?.overallRating,
      payload?.evaluation?.overall_rating,
      payload?.evaluation?.overallRating,
      payload?.results?.overall_rating,
      payload?.results?.overallRating,
    ];

    for (const value of candidates) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value <= 10 ? value : value / 10;
      }
    }

    return undefined;
  }

  private extractInterviewSummary(payload: any): string | undefined {
    const candidates = [
      payload?.interview_summary,
      payload?.summary,
      payload?.evaluation?.summary,
      payload?.results?.summary,
    ];

    for (const value of candidates) {
      const text = String(value ?? '').trim();
      if (text) return text;
    }

    return undefined;
  }

  private normalizeQuestionResults(
    payload: any,
    fallbackQuestions: string[] = [],
    existingResults: any[] = [],
  ) {
    const source =
      payload?.question_results ??
      payload?.questionResults ??
      payload?.evaluation?.question_results ??
      payload?.evaluation?.questionResults ??
      payload?.results?.question_results ??
      payload?.results?.questionResults ??
      payload?.qa ??
      payload?.answers;

    const toRow = (item: any, index: number) => {
      if (typeof item === 'string') {
        return {
          question: fallbackQuestions[index] ?? '',
          answer: item,
          score: 0,
          maxScore: 10,
          status: 'completed',
          order: index + 1,
        };
      }

      const question = String(
        item?.question ?? fallbackQuestions[index] ?? '',
      ).trim();
      const answer = String(item?.answer ?? item?.response ?? '').trim();
      return {
        question,
        answer,
        score:
          typeof item?.score === 'number' && Number.isFinite(item.score)
            ? item.score
            : 0,
        maxScore:
          typeof item?.maxScore === 'number' && Number.isFinite(item.maxScore)
            ? item.maxScore
            : 10,
        status: String(item?.status ?? 'completed'),
        order:
          typeof item?.order === 'number' && Number.isFinite(item.order)
            ? item.order
            : index + 1,
      };
    };

    if (Array.isArray(source) && source.length > 0) {
      return source.map((item, index) => toRow(item, index));
    }

    if (Array.isArray(existingResults) && existingResults.length > 0) {
      return existingResults;
    }

    return fallbackQuestions.map((question, index) => ({
      question,
      answer: '',
      score: 0,
      maxScore: 10,
      status: 'pending',
      order: index + 1,
    }));
  }

  private toObjectId(id: string): ObjectId {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid interview id');
    }
    return new ObjectId(id);
  }

  @Get(':token')
  async resolveInvite(@Param('token') token: string) {
    const cleanToken = String(token ?? '').trim();
    if (!cleanToken) {
      throw new BadRequestException('token is required');
    }

    try {
      // TypeORM MongoDB doesn't support query builder, so get all and filter
      this.logger.debug(
        `Looking for invite with token: ${cleanToken.substring(0, 20)}...`,
      );

      const allInvites = await this.inviteRepo.find();
      this.logger.debug(`Found ${allInvites.length} total invites`);

      const invite = allInvites.find((inv: any) => inv.token === cleanToken);

      if (!invite) {
        this.logger.warn(
          `Invite not found for token: ${cleanToken.substring(0, 20)}...`,
        );
        throw new NotFoundException('Invite not found');
      }

      this.logger.debug(
        `Found invite for token: ${cleanToken.substring(0, 20)}...`,
      );
      return this.formatInviteResponse(invite);
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`Error resolving invite: ${err}`);
      throw new BadRequestException('Failed to resolve interview');
    }
  }

  private buildSlimResumeAnalysis(groqResumeAnalysis: any) {
    if (!groqResumeAnalysis || groqResumeAnalysis.error) return undefined;

    const score =
      typeof groqResumeAnalysis.score === 'number'
        ? groqResumeAnalysis.score
        : typeof groqResumeAnalysis.resume_score === 'number'
          ? groqResumeAnalysis.resume_score
          : undefined;

    return {
      resume_score: score,
      skills_match: groqResumeAnalysis.skills_match,
      experience_fit: groqResumeAnalysis.experience_fit,
      summary: groqResumeAnalysis.summary,
      match_reasons: groqResumeAnalysis.match_reasons ?? groqResumeAnalysis.strengths,
      gaps: groqResumeAnalysis.gaps ?? groqResumeAnalysis.weaknesses,
      generatedAt: groqResumeAnalysis.generatedAt,
      resume_text: groqResumeAnalysis.resume_text,
    };
  }

  private buildPrepareSessionResponse(input: {
    invite: InterviewInvite;
    interview: Interview;
    existingResult?: any;
    resumeDataForPrompt?: any;
    resumeSummaryForPrompt?: string;
    compulsory_questions: string[];
    interviewTimeMinutes?: number;
    parserWarning?: string;
    message?: string;
  }) {
    const assistantId = String(process.env.VAPI_ASSISTANT_ID ?? '').trim();
    if (!assistantId) {
      throw new ServiceUnavailableException(
        'Interview agent is not configured. Set VAPI_ASSISTANT_ID in backend/.env',
      );
    }

    const job_title = String((input.interview as any).job_title ?? '').trim();
    const job_description = String(
      (input.interview as any).description ?? '',
    ).trim();

    const storedResumeText = String(
      input.existingResult?.analysis?.resume_text ?? '',
    ).trim();

    const resumeData = input.resumeDataForPrompt ?? {
      resume_text: storedResumeText || undefined,
      skills: input.existingResult?.skills,
      projects: input.existingResult?.projects,
    };

    const vapiPublicKey = String(
      process.env.VAPI_PUBLIC_KEY ?? process.env.VITE_VAPI_PUBLIC_KEY ?? '',
    ).trim();

    if (!vapiPublicKey || vapiPublicKey.includes('your_public_key')) {
      throw new ServiceUnavailableException(
        'Vapi public key is not configured. Set VAPI_PUBLIC_KEY in backend/.env (from Vapi dashboard → API Keys → Public Key).',
      );
    }

    return {
      message: input.message ?? 'Prepared',
      email: input.invite.email,
      inviteToken: input.invite.token,
      interviewId: input.invite.interviewId,
      jobTitle: job_title,
      jobDescription: job_description,
      compulsoryQuestions: input.compulsory_questions,
      interviewTimeMinutes: input.interviewTimeMinutes,
      resumeData,
      resumeSummary:
        input.resumeSummaryForPrompt ??
        input.existingResult?.projects ??
        input.existingResult?.skills,
      meetingUrl: this.getMeetingUrl(input.invite.roomId),
      assistantId,
      vapiPublicKey,
      overall_score: input.existingResult?.overall_score,
      overall_rating: input.existingResult?.overall_rating,
      resume_score: input.existingResult?.resume_score,
      parserWarning: input.parserWarning,
    };
  }

  private async formatInviteResponse(invite: InterviewInvite) {
    let interview: Interview | null = null;
    try {
      const interviewObjectId = this.toObjectId(invite.interviewId);
      interview = await this.interviewRepo.findOne({
        where: { _id: interviewObjectId } as any,
      });
    } catch {
      interview = null;
    }

    return {
      email: invite.email,
      interviewId: invite.interviewId,
      job_title: (interview as any)?.job_title,
      description: (interview as any)?.description,
      status: invite.status,
    };
  }

  @Post(':token/prepare')
  @UseInterceptors(
    FileInterceptor('resume', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async prepare(
    @Param('token') token: string,
    @Body() body: any,
    @UploadedFile() resume: any,
  ) {
    const cleanToken = String(token ?? '').trim();
    if (!cleanToken) {
      throw new BadRequestException('token is required');
    }

    const invite = await this.inviteRepo.findOne({
      where: { token: cleanToken } as any,
    });
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    let interview: Interview | null = null;
    try {
      const interviewObjectId = this.toObjectId(invite.interviewId);
      interview = await this.interviewRepo.findOne({
        where: { _id: interviewObjectId } as any,
      });
    } catch {
      interview = null;
    }

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    if (invite.status === 'prepared') {
      // For idempotency, re-hydrate the Vapi interview from stored data.
      let existingResults = await this.interviewResultService.findByInviteToken(
        invite.token,
      );

      if (!existingResults) {
        existingResults = await this.interviewResultService.upsertPrepared({
          interviewId: invite.interviewId,
          inviteToken: invite.token,
          createdBy: invite.createdBy,
          job_title: (interview as any).job_title,
          job_description: (interview as any).description,
          applicant_name: invite.username ?? 'Candidate',
          applicant_email: invite.email,
          resumeUrl: invite.resumeUrl,
          compulsory_questions: (interview as any).questions ?? [],
        });
      }

      const compulsory_questions = Array.isArray((interview as any).questions)
        ? (interview as any).questions
        : [];
      const interviewTimeMinutes =
        typeof (interview as any).durationMinutes === 'number'
          ? (interview as any).durationMinutes
          : undefined;

      return this.buildPrepareSessionResponse({
        invite,
        interview,
        existingResult: existingResults,
        compulsory_questions,
        interviewTimeMinutes,
        message: 'Already prepared',
      });
    }

    const username = String(body?.username ?? '').trim();
    if (!username) {
      throw new BadRequestException('username is required');
    }

    if (!resume?.buffer?.length) {
      throw new BadRequestException('resume (PDF) is required');
    }

    const mimetype = String(resume?.mimetype ?? '').toLowerCase();
    const originalName = String(resume?.originalname ?? 'resume.pdf');
    const isPdf =
      mimetype === 'application/pdf' ||
      originalName.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      throw new BadRequestException('Resume must be a PDF');
    }

    const job_title = String((interview as any).job_title ?? '').trim();
    const job_description = String((interview as any).description ?? '').trim();
    const compulsory_questions = Array.isArray((interview as any).questions)
      ? (interview as any).questions
      : [];
    const interviewTimeMinutes =
      typeof (interview as any).durationMinutes === 'number'
        ? (interview as any).durationMinutes
        : undefined;

    const parsedResume = await this.pdfParserService.parseUpload({
      jobTitle: job_title,
      jobDescription: job_description,
      compulsoryQuestions: compulsory_questions,
      resumeBuffer: resume.buffer,
      resumeFileName: originalName,
    });

    const parserResult = parsedResume.parserResult;
    const parserError = parsedResume.parserWarning;
    const resumeDataForPrompt = parsedResume.vapiResumeData;
    const resumeSummaryForPrompt = parsedResume.vapiResumeSummary;
    const extractedResumeText = resumeDataForPrompt?.resume_text ?? '';

    // Analyze resume with Groq for better scoring and analysis
    let groqResumeAnalysis: any = undefined;
    if (extractedResumeText && extractedResumeText.length > 50) {
      this.logger.log(`🔄 Starting Groq resume analysis for: ${job_title}`);
      try {
        groqResumeAnalysis = await this.groqResumeAnalysisService.analyzeResume(
          {
            resumeText: extractedResumeText,
            jobTitle: job_title,
            jobDescription: job_description,
          },
        );
        this.logger.log(
          `✅ Groq resume analysis completed: ${JSON.stringify(groqResumeAnalysis, null, 2)}`,
        );
      } catch (groqError: any) {
        this.logger.warn(
          `⚠️ Groq resume analysis failed: ${groqError?.message || groqError}`,
        );
      }
    }

    // ONLY use Groq score if analysis succeeded (has valid resume_score)
    // Don't fall back to parser or local scores - these are not real AI analysis
    const groqScore =
      typeof groqResumeAnalysis?.score === 'number'
        ? groqResumeAnalysis.score
        : typeof groqResumeAnalysis?.resume_score === 'number'
          ? groqResumeAnalysis.resume_score
          : undefined;

    const hasValidGroqAnalysis =
      groqResumeAnalysis && typeof groqScore === 'number' && !groqResumeAnalysis?.error;

    this.logger.log(
      `📊 Resume scoring validation:\n  Groq analysis exists: ${!!groqResumeAnalysis}\n  Has resume_score: ${typeof groqResumeAnalysis?.resume_score === 'number'}\n  Has error: ${!!groqResumeAnalysis?.error}\n  Valid for use: ${hasValidGroqAnalysis}`,
    );

    // Only use Groq score - never use fallback keyword matching scores
    const parserScore =
      typeof parserResult?.score === 'number'
        ? parserResult.score
        : parsedResume.parserResumeScore;

    const dbResumeScore = hasValidGroqAnalysis
      ? groqScore
      : typeof parserScore === 'number'
        ? parserScore
        : undefined;

    const overall_score = dbResumeScore;
    const overall_rating = dbResumeScore
      ? Number((dbResumeScore / 10).toFixed(1))
      : undefined;

    this.logger.log(
      `📊 Final scores being saved: resume_score=${dbResumeScore}, overall_rating=${overall_rating}, analysis=${hasValidGroqAnalysis ? 'real' : 'none'}`,
    );

    const uploaded = await this.cloudinaryService.uploadResumePdf({
      buffer: resume.buffer,
      fileName: originalName,
      publicId: `resume_${invite.token}`,
    });

    await this.inviteRepo.update(
      { _id: invite._id } as any,
      {
        username,
        resumeUrl: uploaded.secureUrl,
        status: 'prepared',
        preparedAt: new Date(),
      } as any,
    );

    let slimAnalysis = hasValidGroqAnalysis
      ? this.buildSlimResumeAnalysis(groqResumeAnalysis)
      : typeof parserScore === 'number'
        ? {
            resume_score: parserScore,
            match_reasons: parserResult?.match_reasons ?? [],
            gaps: parserResult?.gaps ?? [],
            summary: parserResult?.summary,
          }
        : undefined;

    if (slimAnalysis && extractedResumeText) {
      slimAnalysis = { ...slimAnalysis, resume_text: extractedResumeText.slice(0, 8000) };
    }

    const skillsText = hasValidGroqAnalysis
      ? (groqResumeAnalysis?.match_reasons ?? groqResumeAnalysis?.strengths ?? [])
          .slice(0, 8)
          .join(', ')
      : parserResult?.match_reasons?.slice(0, 8).join(', ');

    const projectsText = hasValidGroqAnalysis
      ? String(groqResumeAnalysis?.summary ?? '').slice(0, 1000)
      : extractedResumeText
        ? extractedResumeText.slice(0, 500)
        : undefined;

    await this.interviewResultService.upsertPrepared({
      interviewId: invite.interviewId,
      inviteToken: invite.token,
      createdBy: invite.createdBy,
      job_title,
      job_description,
      applicant_name: username,
      applicant_email: invite.email,
      resumeUrl: uploaded.secureUrl,
      compulsory_questions,
      resume_score: dbResumeScore,
      overall_score,
      overall_rating,
      skills: skillsText || undefined,
      projects: projectsText || undefined,
      analysis: slimAnalysis,
    });

    this.logger.log(
      `Returning prepare response (resume_score=${dbResumeScore ?? 'n/a'})`,
    );

    return this.buildPrepareSessionResponse({
      invite,
      interview,
      resumeDataForPrompt,
      resumeSummaryForPrompt,
      compulsory_questions,
      interviewTimeMinutes,
      parserWarning: parserError,
      existingResult: {
        overall_score,
        overall_rating,
        resume_score: dbResumeScore,
        skills: skillsText,
        projects: projectsText,
      },
    });
  }

  @Post(':token/complete')
  async complete(
    @Param('token') token: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const cleanToken = String(token ?? '').trim();
    if (!cleanToken) {
      throw new BadRequestException('token is required');
    }

    const secret = String(process.env.INTERVIEW_RESULTS_WEBHOOK_SECRET ?? '');
    const headerSecret = String(
      req?.headers?.['x-interview-webhook-secret'] ??
        req?.headers?.['x-interview-results-secret'] ??
        body?.webhook_secret ??
        body?.secret ??
        '',
    );
    if (!secret) {
      throw new ServiceUnavailableException(
        'INTERVIEW_RESULTS_WEBHOOK_SECRET is not configured',
      );
    }
    if (!headerSecret || headerSecret !== secret) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    const invite = await this.inviteRepo.findOne({
      where: { token: cleanToken } as any,
    });
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    const conversationId =
      typeof body?.vapi_call_id === 'string'
        ? body.vapi_call_id
        : typeof body?.conversation_id === 'string'
          ? body.conversation_id
          : typeof body?.call?.id === 'string'
            ? body.call.id
            : typeof body?.callId === 'string'
              ? body.callId
              : undefined;

    const transcript =
      typeof body?.transcript === 'string' ? body.transcript : undefined;
    const evaluation = body?.evaluation ?? body?.results ?? body;
    const interview_summary = this.extractInterviewSummary(body);
    const interview = await this.interviewRepo.findOne({
      where: { _id: this.toObjectId(invite.interviewId) } as any,
    });
    const fallbackQuestions = Array.isArray((interview as any)?.questions)
      ? (interview as any).questions
      : [];
    const existingResult = await this.interviewResultService.findByInviteToken(
      invite.token,
    );

    const analysis = transcript
      ? await this.groqInterviewAnalysisService.analyzeTranscript({
          transcript,
          jobTitle: (interview as any)?.job_title,
          jobDescription: (interview as any)?.description,
          compulsoryQuestions: fallbackQuestions,
          resumeData: existingResult?.resume_data,
          evaluation,
        })
      : undefined;
    const question_results = this.normalizeQuestionResults(
      body,
      fallbackQuestions,
      existingResult?.question_results ?? [],
    );
    const resume_score =
      this.extractResumeScore(body) ??
      existingResult?.resume_score ??
      existingResult?.overall_score;

    const interview_score =
      this.extractInterviewScore(body) ??
      this.extractInterviewScore(body?.evaluation) ??
      existingResult?.overall_score;

    const interview_rating =
      this.extractInterviewRating(body) ??
      this.extractInterviewRating(body?.evaluation) ??
      (typeof interview_score === 'number' && Number.isFinite(interview_score)
        ? interview_score <= 10
          ? Number(interview_score.toFixed(1))
          : Number((interview_score / 10).toFixed(1))
        : undefined);

    const updated = await this.interviewResultService.markCompleted({
      inviteToken: invite.token,
      interviewId: invite.interviewId,
      createdBy: invite.createdBy,
      applicant_name:
        existingResult?.applicant_name ?? invite.username ?? 'Candidate',
      applicant_email: existingResult?.applicant_email ?? invite.email,
      job_title: (interview as any)?.job_title,
      job_description: (interview as any)?.description,
      resumeUrl: existingResult?.resumeUrl,
      compulsory_questions: fallbackQuestions,
      vapi_call_id: conversationId,
      transcript,
      analysis,
      evaluation,
      interview_summary,
      question_results,
      resume_score,
      overall_score: interview_score,
      overall_rating: interview_rating,
    });

    if (!updated) {
      throw new NotFoundException('Result record not found');
    }

    // Mark invite as completed so HR views reflect attendance.
    try {
      await this.inviteRepo.update(
        { _id: invite._id } as any,
        { status: 'completed' } as any,
      );
    } catch {
      // non-fatal
    }

    return { message: 'Recorded', status: updated.status };
  }
}
