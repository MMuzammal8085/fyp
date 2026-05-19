import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { InterviewResult } from 'src/database/entities/interview-result.entity';

type InterviewResultCompletionInput = {
  inviteToken?: string;
  interviewId?: string;
  createdBy?: string;
  job_title?: string;
  job_description?: string;
  applicant_name?: string;
  applicant_email?: string;
  resumeUrl?: string;
  compulsory_questions?: string[];
  question_results?: any[];
  resume_data?: any;
  resume_score?: number;
  overall_score?: number;
  skills?: string;
  projects?: string;
  analysis?: any;
  evaluation?: any;
  transcript?: string;
  interview_summary?: string;
  overall_rating?: number;
  vapi_call_id?: string;
};

@Injectable()
export class InterviewResultService {
  private readonly logger = new Logger(InterviewResultService.name);

  constructor(private readonly dataSource: DataSource) {}

  private get repo() {
    return this.dataSource.getMongoRepository(InterviewResult);
  }

  async findByInviteToken(
    inviteToken: string,
  ): Promise<InterviewResult | null> {
    return await this.repo.findOne({
      where: { inviteToken } as any,
    });
  }

  async findByInterviewAndApplicant(
    interviewId: string,
    applicantName: string,
  ): Promise<InterviewResult | null> {
    return await this.repo.findOne({
      where: {
        interviewId,
        applicant_name: applicantName,
      } as any,
    });
  }

  async findByApplicantEmail(
    applicantEmail: string,
  ): Promise<InterviewResult | null> {
    const cleanEmail = String(applicantEmail ?? '')
      .trim()
      .toLowerCase();
    if (!cleanEmail) return null;

    return await this.repo.findOne({
      where: { applicant_email: cleanEmail } as any,
    });
  }

  async findByInterviewIdAndApplicantEmail(
    interviewId: string,
    applicantEmail: string,
    createdBy?: string,
  ): Promise<InterviewResult | null> {
    const cleanInterviewId = String(interviewId ?? '').trim();
    const cleanEmail = String(applicantEmail ?? '')
      .trim()
      .toLowerCase();
    if (!cleanInterviewId || !cleanEmail) return null;

    const where: any = {
      interviewId: cleanInterviewId,
      applicant_email: cleanEmail,
    };
    if (createdBy) where.createdBy = createdBy;

    return await this.repo.findOne({ where } as any);
  }

  async setShortlistedByInterviewAndEmail(input: {
    interviewId: string;
    applicantEmail: string;
    createdBy: string;
    shortlisted: boolean;
  }): Promise<InterviewResult | null> {
    const cleanInterviewId = String(input.interviewId ?? '').trim();
    const cleanEmail = String(input.applicantEmail ?? '')
      .trim()
      .toLowerCase();
    if (!cleanInterviewId || !cleanEmail) return null;

    const existing = await this.findByInterviewIdAndApplicantEmail(
      cleanInterviewId,
      cleanEmail,
      input.createdBy,
    );
    if (!existing) return null;

    const shortlisted = Boolean(input.shortlisted);

    // Use direct MongoDB update with correct syntax
    const updatePayload: any = {
      isShortlisted: shortlisted,
    };

    if (shortlisted) {
      updatePayload.shortlistedAt = new Date();
    } else {
      updatePayload.shortlistedAt = null;
    }

    await this.repo.update({ _id: existing._id } as any, updatePayload as any);

    return await this.repo.findOne({ where: { _id: existing._id } as any });
  }

  private toFiniteNumber(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value)
      ? value
      : undefined;
  }

  private normalizeTenPointRating(value: unknown): number | undefined {
    const numeric = this.toFiniteNumber(value);
    if (numeric === undefined) return undefined;

    if (numeric <= 10) {
      return Number(Math.max(0, Math.min(10, numeric)).toFixed(1));
    }

    return Number(Math.max(0, Math.min(10, numeric / 10)).toFixed(1));
  }

  private normalizeQuestionResults(questionResults: any[] = []) {
    if (!Array.isArray(questionResults)) return [];

    return questionResults.map((item: any, index: number) => ({
      question: String(item?.question ?? '').trim(),
      answer: String(item?.answer ?? item?.response ?? '').trim(),
      score: this.toFiniteNumber(item?.score) ?? 0,
      maxScore: this.toFiniteNumber(item?.maxScore) ?? 10,
      status: String(item?.status ?? 'completed'),
      order: this.toFiniteNumber(item?.order) ?? index + 1,
    }));
  }

  private deriveOverallScore(questionResults: any[] = []) {
    const normalized = this.normalizeQuestionResults(questionResults);
    const scored = normalized.filter(
      (item) => typeof item.score === 'number' && Number.isFinite(item.score),
    );

    if (scored.length === 0) {
      return undefined;
    }

    const average = scored.reduce((total, item) => {
      const maxScore =
        typeof item.maxScore === 'number' && Number.isFinite(item.maxScore)
          ? item.maxScore
          : 10;
      const safeMax = maxScore > 0 ? maxScore : 10;
      return total + (item.score / safeMax) * 100;
    }, 0);

    return Number((average / scored.length).toFixed(1));
  }

  /** Persist only the fields used on the interview_results document at prepare time. */
  private buildPreparedDocument(input: {
    interviewId: string;
    inviteToken: string;
    createdBy: string;
    job_title: string;
    job_description: string;
    applicant_name: string;
    applicant_email?: string;
    resumeUrl?: string;
    compulsory_questions: string[];
    resume_score?: number;
    overall_score?: number;
    overall_rating?: number;
    skills?: string;
    projects?: string;
    analysis?: any;
  }) {
    const cleanEmail = String(input.applicant_email ?? '')
      .trim()
      .toLowerCase();

    const doc: any = {
      interviewId: input.interviewId,
      inviteToken: input.inviteToken,
      createdBy: input.createdBy,
      job_title: input.job_title,
      job_description: input.job_description,
      applicant_name: input.applicant_name,
      compulsory_questions: input.compulsory_questions ?? [],
      question_results: [],
      status: 'prepared',
    };

    if (cleanEmail) doc.applicant_email = cleanEmail;
    if (input.resumeUrl) doc.resumeUrl = input.resumeUrl;
    if (input.resume_score !== undefined) doc.resume_score = input.resume_score;
    if (input.overall_score !== undefined) doc.overall_score = input.overall_score;
    if (input.overall_rating !== undefined) {
      doc.overall_rating = this.normalizeTenPointRating(input.overall_rating);
    }
    if (input.skills !== undefined) doc.skills = input.skills;
    if (input.projects !== undefined) doc.projects = input.projects;
    if (input.analysis !== undefined) doc.analysis = input.analysis;

    return doc;
  }

  async markInProgress(input: {
    inviteToken?: string;
    interviewId?: string;
    applicant_email?: string;
    vapi_call_id?: string;
  }): Promise<InterviewResult | null> {
    const cleanEmail = String(input.applicant_email ?? '')
      .trim()
      .toLowerCase();

    let existing: InterviewResult | null = null;

    if (input.inviteToken) {
      existing = await this.findByInviteToken(input.inviteToken);
    }
    if (!existing && input.interviewId && cleanEmail) {
      existing = await this.findByInterviewIdAndApplicantEmail(
        input.interviewId,
        cleanEmail,
      );
    }
    if (!existing && cleanEmail) {
      existing = await this.findByApplicantEmail(cleanEmail);
    }

    if (!existing) return null;

    const update: any = { status: 'in_progress' };
    if (input.vapi_call_id) update.vapi_call_id = input.vapi_call_id;

    await this.repo.update({ _id: existing._id } as any, update);
    return await this.repo.findOne({ where: { _id: existing._id } as any });
  }

  async upsertPrepared(input: {
    interviewId: string;
    inviteToken: string;
    createdBy: string;
    job_title: string;
    job_description: string;
    applicant_name: string;
    applicant_email?: string;
    resumeUrl?: string;
    compulsory_questions: string[];
    resume_score?: number;
    overall_score?: number;
    overall_rating?: number;
    skills?: string;
    projects?: string;
    analysis?: any;
  }): Promise<InterviewResult | null> {
    const existing = await this.findByInviteToken(input.inviteToken);
    const doc = this.buildPreparedDocument(input);

    if (!existing) {
      const created = this.repo.create(doc as any);
      const saved = await this.repo.save(created as any);
      return Array.isArray(saved) ? (saved[0] as any) : (saved as any);
    }

    await this.repo.update({ _id: existing._id } as any, doc);
    return await this.repo.findOne({ where: { _id: existing._id } as any });
  }

  async markCompleted(input: InterviewResultCompletionInput) {
    this.logger.log(`📋 markCompleted called with token: ${input.inviteToken}`);
    this.logger.debug(`Input payload: ${JSON.stringify(input, null, 2)}`);
    const cleanApplicantEmail = String(input.applicant_email ?? '')
      .trim()
      .toLowerCase();

    let existing: any = null;

    // Try to find existing record in order of preference
    if (input.inviteToken) {
      this.logger.log(`🔍 Looking up by inviteToken: ${input.inviteToken}`);
      existing = await this.findByInviteToken(input.inviteToken);
      if (existing) {
        this.logger.log(`✅ Found by inviteToken: ${existing._id}`);
      }
    }

    // Fallback: try by interviewId + email with optional createdBy
    if (!existing && input.interviewId && cleanApplicantEmail) {
      this.logger.log(
        `🔍 Looking up by interviewId + email: ${input.interviewId} / ${cleanApplicantEmail}`,
      );
      try {
        existing = await this.findByInterviewIdAndApplicantEmail(
          input.interviewId,
          cleanApplicantEmail,
          input.createdBy,
        );
        if (existing) {
          this.logger.log(`✅ Found by interviewId + email: ${existing._id}`);
        }
      } catch (e) {
        this.logger.warn(`⚠️ Lookup by interviewId + email failed: ${e}`);
      }
    }

    // If still not found and no createdBy, try without it
    if (
      !existing &&
      input.interviewId &&
      cleanApplicantEmail &&
      !input.createdBy
    ) {
      this.logger.log(
        `🔍 Trying lookup by interviewId + email only (no createdBy): ${input.interviewId} / ${cleanApplicantEmail}`,
      );
      const all = await this.repo.find();
      existing = (Array.isArray(all) ? all : []).find(
        (r: any) =>
          String(r?.interviewId ?? '') === input.interviewId &&
          String(r?.applicant_email ?? '').toLowerCase() ===
            cleanApplicantEmail,
      );
      if (existing) {
        this.logger.log(
          `✅ Found by interviewId + email (no createdBy filter): ${existing._id}`,
        );
      }
    }

    // Last resort: try by interviewId + name
    if (!existing && input.interviewId && input.applicant_name) {
      this.logger.log(
        `🔍 Looking up by interviewId + name: ${input.interviewId} / ${input.applicant_name}`,
      );
      existing = await this.findByInterviewAndApplicant(
        input.interviewId,
        input.applicant_name,
      );
      if (existing) {
        this.logger.log(`✅ Found by interviewId + name: ${existing._id}`);
      }
    }

    if (existing) {
      this.logger.log(`✅ Found existing record: ${existing._id}`);
    } else {
      this.logger.log(`📝 No existing record found, will create new`);
    }

    const normalizedQuestionResults = this.normalizeQuestionResults(
      input.question_results ?? existing?.question_results ?? [],
    );
    this.logger.log(
      `📊 Normalized ${normalizedQuestionResults.length} question results`,
    );
    this.logger.debug(
      `Normalized results: ${JSON.stringify(normalizedQuestionResults, null, 2)}`,
    );

    const computedOverallScore =
      this.toFiniteNumber(input.overall_score) ??
      this.deriveOverallScore(normalizedQuestionResults);

    const computedOverallRating =
      this.normalizeTenPointRating(input.overall_rating) ??
      this.normalizeTenPointRating(computedOverallScore);

    this.logger.log(`🎯 Overall score: ${computedOverallScore}`);

    const payload: any = {
      inviteToken: input.inviteToken ?? existing?.inviteToken ?? '',
      interviewId: input.interviewId ?? existing?.interviewId ?? '',
      createdBy: input.createdBy ?? existing?.createdBy ?? '',
      job_title: input.job_title ?? existing?.job_title ?? '',
      job_description: input.job_description ?? existing?.job_description ?? '',
      applicant_name:
        input.applicant_name ?? existing?.applicant_name ?? 'Candidate',
      applicant_email:
        cleanApplicantEmail ||
        input.applicant_email ||
        existing?.applicant_email,
      resumeUrl: input.resumeUrl ?? existing?.resumeUrl,
      compulsory_questions:
        input.compulsory_questions ?? existing?.compulsory_questions ?? [],
      question_results: normalizedQuestionResults,
      resume_data: input.resume_data ?? existing?.resume_data,
      skills: input.skills ?? existing?.skills,
      projects: input.projects ?? existing?.projects,
      analysis: input.analysis ?? existing?.analysis,
      evaluation: input.evaluation ?? existing?.evaluation,
      transcript:
        typeof input.transcript === 'string' && input.transcript.trim()
          ? input.transcript.trim()
          : existing?.transcript,
      interview_summary: input.interview_summary ?? existing?.interview_summary,
      vapi_call_id: input.vapi_call_id ?? existing?.vapi_call_id,
      status: 'completed',
      completedAt: new Date(),
    };

    const resumeScore =
      this.toFiniteNumber(input.resume_score) ?? existing?.resume_score;
    if (resumeScore !== undefined) {
      payload.resume_score = resumeScore;
    }

    if (computedOverallScore !== undefined) {
      payload.overall_score = computedOverallScore;
    }

    if (computedOverallRating !== undefined) {
      payload.overall_rating = computedOverallRating;
    }

    this.logger.log(
      `💾 Final payload being saved: ${JSON.stringify(payload, null, 2)}`,
    );

    try {
      if (existing) {
        this.logger.log(`📤 Updating existing record: ${existing._id}`);
        await this.repo.update({ _id: existing._id } as any, payload as any);
        const updated = await this.repo.findOne({
          where: { _id: existing._id } as any,
        });
        this.logger.log(`✅ Record updated successfully`);
        return updated;
      }

      this.logger.log(`📝 Creating new record`);
      const created = this.repo.create(payload as any);
      const saved = await this.repo.save(created as any);
      const result = Array.isArray(saved) ? (saved[0] as any) : (saved as any);
      this.logger.log(`✅ Record created successfully: ${result._id}`);
      return result;
    } catch (error: any) {
      this.logger.error(
        `❌ Error saving interview result: ${error.message}`,
        error?.stack,
      );
      throw error;
    }
  }

  async listByInterviewId(interviewId: string) {
    const docs = await this.repo.find({ where: { interviewId } as any });
    return docs ?? [];
  }

  async listByInterviewIdForOwner(interviewId: string, createdBy: string) {
    const cleanInterviewId = String(interviewId ?? '').trim();
    const cleanOwner = String(createdBy ?? '').trim();
    if (!cleanInterviewId || !cleanOwner) return [];

    // Some TypeORM Mongo builds can ignore compound where filters.
    // Use a manual filter for correctness.
    const all = await this.repo.find();
    const docs = (Array.isArray(all) ? all : []).filter(
      (r: any) =>
        String(r?.interviewId ?? '') === cleanInterviewId &&
        String(r?.createdBy ?? '') === cleanOwner,
    );
    return docs;
  }
}
