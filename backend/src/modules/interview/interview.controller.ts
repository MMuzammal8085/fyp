import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Body,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import * as XLSX from 'xlsx';
import { DataSource } from 'typeorm';
import { ObjectId } from 'mongodb';
import { randomBytes, randomUUID } from 'crypto';

import { Interview } from 'src/database/entities/interview.entity';
import { InterviewInvite } from 'src/database/entities/interview-invite.entity';
import { InterviewResultService } from './interview-result.service';
import { UserType } from 'src/shared/enums/user.enums';
import { MailService } from 'src/shared/service/mail.service';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { JwtAuthGuard, RolesGuard } from 'src/shared/guards/roles.guard';

@Controller('interviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InterviewController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly mailService: MailService,
    private readonly interviewResultService: InterviewResultService,
  ) {}

  private toObjectId(id: string): ObjectId {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid interview id');
    }
    return new ObjectId(id);
  }

  private get repo() {
    return this.dataSource.getMongoRepository(Interview);
  }

  private get inviteRepo() {
    return this.dataSource.getMongoRepository(InterviewInvite);
  }

  private get frontendBaseUrl(): string {
    return (process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(
      /\/+$/,
      '',
    );
  }

  private createInviteLink(token: string): string {
    return `${this.frontendBaseUrl}/interview/join?token=${encodeURIComponent(
      token,
    )}`;
  }

  private extractUserId(rawUserId: any): string {
    if (!rawUserId) {
      throw new BadRequestException('Invalid user id in token');
    }

    if (typeof rawUserId === 'string') return rawUserId;
    if (typeof rawUserId?.toString === 'function') {
      const value = rawUserId.toString();
      if (typeof value === 'string' && value !== '[object Object]') {
        return value;
      }
    }

    if (typeof rawUserId?.$oid === 'string') return rawUserId.$oid;
    throw new BadRequestException('Invalid user id in token');
  }

  private ensureOwner(interview: Interview, userId: string) {
    if (!interview || interview.createdBy !== userId) {
      throw new NotFoundException('Interview not found');
    }
  }

  @Post()
  @Roles(UserType.HR)
  async create(@Body() body: any, @Req() req: any) {
    const job_title = body?.job_title;
    const description = body?.description;
    const durationMinutes = body?.durationMinutes;
    const questions = body?.questions;
    const ownerId = this.extractUserId(req?.user?.userId);

    if (!job_title || typeof job_title !== 'string') {
      throw new BadRequestException('job_title is required');
    }
    if (!description || typeof description !== 'string') {
      throw new BadRequestException('description is required');
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new BadRequestException('questions must be a non-empty array');
    }

    const interview = this.repo.create({
      createdBy: ownerId,
      job_title,
      description,
      durationMinutes,
      questions,
      totalInvitesSent: 0,
      invitationHistory: [],
    });

    return await this.repo.save(interview);
  }

  @Get()
  @Roles(UserType.HR)
  async listMine(@Req() req: any) {
    const ownerId = this.extractUserId(req?.user?.userId);

    const docs = await this.repo.find({ where: { createdBy: ownerId } as any });
    return docs.sort((a, b) => {
      const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  @Get(':id')
  @Roles(UserType.HR)
  async findOne(@Param('id') id: string, @Req() req: any) {
    const _id = this.toObjectId(id);
    const ownerId = this.extractUserId(req?.user?.userId);

    const interview = await this.repo.findOne({ where: { _id } as any });
    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    this.ensureOwner(interview, ownerId);
    return interview;
  }

  @Post(':id/update')
  @Roles(UserType.HR)
  updateRejected() {
    throw new BadRequestException(
      'Interview is immutable after creation and cannot be updated',
    );
  }

  @Delete(':id')
  @Roles(UserType.HR)
  async remove(@Param('id') id: string, @Req() req: any) {
    const _id = this.toObjectId(id);
    const ownerId = this.extractUserId(req?.user?.userId);

    const existing = await this.repo.findOne({ where: { _id } as any });
    if (!existing) {
      throw new NotFoundException('Interview not found');
    }

    this.ensureOwner(existing, ownerId);

    await this.repo.delete({ _id } as any);
    return { message: 'Interview deleted successfully' };
  }

  @Get(':id/results')
  @Roles(UserType.HR)
  async results(@Param('id') id: string, @Req() req: any) {
    const _id = this.toObjectId(id);
    const ownerId = this.extractUserId(req?.user?.userId);

    const interview = await this.repo.findOne({ where: { _id } as any });
    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    this.ensureOwner(interview, ownerId);

    const interviewId = _id.toHexString();
    // TypeORM Mongo filtering has been flaky in some environments.
    // Use a manual filter for reliability.
    const allInvites = await this.inviteRepo.find();
    const inviteDocs = (Array.isArray(allInvites) ? allInvites : []).filter(
      (inv: any) =>
        String(inv?.interviewId ?? '') === interviewId &&
        String(inv?.createdBy ?? '') === ownerId,
    );

    const invitesSource =
      Array.isArray(inviteDocs) && inviteDocs.length
        ? inviteDocs
        : Array.isArray((interview as any)?.invitationHistory)
          ? (interview as any).invitationHistory
          : [];

    const storedResults =
      await this.interviewResultService.listByInterviewIdForOwner(
        interviewId,
        ownerId,
      );
    const sortedResults = [...storedResults].sort((a: any, b: any) => {
      const aTime = a?.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b?.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });
    const primaryResult =
      sortedResults.find((r: any) => r?.status === 'completed') ??
      sortedResults[0] ??
      null;

    const totalResults = storedResults.length;
    const pending = storedResults.filter(
      (r: any) => r?.status !== 'completed',
    ).length;

    const thresholdRaw = String(
      process.env.INTERVIEW_SHORTLIST_SCORE_THRESHOLD ?? '',
    ).trim();
    const threshold = thresholdRaw ? Number(thresholdRaw) : null;
    const shortlisted = storedResults.filter(
      (r: any) => r?.isShortlisted === true,
    ).length;

    const questionResults = Array.isArray(primaryResult?.question_results)
      ? primaryResult.question_results
      : (interview.questions || []).map((question, index) => ({
          question,
          answer: 'No candidate answer recorded yet',
          score: 0,
          maxScore: 10,
          status: 'pending',
          order: index + 1,
        }));

    return {
      interviewId: id,
      job_title: interview.job_title,
      description: interview.description,
      createdAt: interview.createdAt,
      totalInvitesSent: interview.totalInvitesSent || 0,
      totalResults,
      shortlisted,
      pending,
      shortlistThreshold:
        typeof threshold === 'number' && Number.isFinite(threshold)
          ? threshold
          : undefined,
      resumeScore: primaryResult?.resume_score ?? primaryResult?.overall_score,
      overallRating: primaryResult?.overall_rating,
      interviewSummary: primaryResult?.interview_summary,
      questionResults,
      invites: (invitesSource ?? [])
        .slice()
        .sort((a: any, b: any) => {
          const aTime =
            a?.createdAt || a?.sentAt
              ? new Date(a.createdAt ?? a.sentAt).getTime()
              : 0;
          const bTime =
            b?.createdAt || b?.sentAt
              ? new Date(b.createdAt ?? b.sentAt).getTime()
              : 0;
          return bTime - aTime;
        })
        .map((inv: any) => ({
          email: inv?.email,
          status: inv?.status ?? 'pending',
          username: inv?.username,
          resumeUrl: inv?.resumeUrl,
          sentAt: inv?.createdAt ?? inv?.sentAt,
          preparedAt: inv?.preparedAt,
        })),
      candidates: storedResults.map((r: any) => ({
        applicant_name: r?.applicant_name,
        applicant_email: r?.applicant_email,
        resumeUrl: r?.resumeUrl,
        resume_score: r?.resume_score ?? r?.overall_score,
        overall_score: r?.overall_score,
        overall_rating: r?.overall_rating,
        interview_summary: r?.interview_summary,
        transcript: r?.transcript,
        analysis: r?.analysis,
        skills: r?.skills,
        projects: r?.projects,
        isShortlisted: r?.isShortlisted === true,
        shortlistedAt: r?.shortlistedAt,
        status: r?.status,
        preparedAt: r?.createdAt,
        completedAt: r?.completedAt,
      })),
    };
  }

  @Get('results/email/:email')
  @Roles(UserType.HR)
  async resultsByEmail(@Param('email') email: string, @Req() req: any) {
    const ownerId = this.extractUserId(req?.user?.userId);
    const cleanEmail = String(email ?? '')
      .trim()
      .toLowerCase();

    if (!cleanEmail) {
      throw new BadRequestException('email is required');
    }

    const result =
      await this.interviewResultService.findByApplicantEmail(cleanEmail);

    if (!result) {
      throw new NotFoundException('Applicant result not found');
    }

    if (result.createdBy !== ownerId) {
      throw new NotFoundException('Applicant result not found');
    }

    return {
      applicant_name: result.applicant_name,
      applicant_email: result.applicant_email,
      interviewId: result.interviewId,
      job_title: result.job_title,
      job_description: result.job_description,
      resume_score: result.resume_score ?? result.overall_score,
      overall_score: result.overall_score,
      overall_rating: result.overall_rating,
      interview_summary: result.interview_summary,
      transcript: (result as any)?.transcript,
      analysis: (result as any)?.analysis,
      question_results: result.question_results,
      status: result.status,
      isShortlisted: (result as any)?.isShortlisted === true,
      shortlistedAt: (result as any)?.shortlistedAt,
      completedAt: result.completedAt,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  @Patch(':id/results/email/:email/shortlist')
  @Roles(UserType.HR)
  async shortlistCandidate(
    @Param('id') id: string,
    @Param('email') email: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const _id = this.toObjectId(id);
    const ownerId = this.extractUserId(req?.user?.userId);

    const interview = await this.repo.findOne({ where: { _id } as any });
    if (!interview) {
      throw new NotFoundException('Interview not found');
    }
    this.ensureOwner(interview, ownerId);

    const cleanEmail = String(email ?? '')
      .trim()
      .toLowerCase();
    if (!cleanEmail) {
      throw new BadRequestException('email is required');
    }

    const shortlistedRaw = body?.shortlisted;
    if (typeof shortlistedRaw !== 'boolean') {
      throw new BadRequestException('shortlisted must be a boolean');
    }

    const updated =
      await this.interviewResultService.setShortlistedByInterviewAndEmail({
        interviewId: _id.toHexString(),
        applicantEmail: cleanEmail,
        createdBy: ownerId,
        shortlisted: shortlistedRaw,
      });

    if (!updated) {
      throw new NotFoundException('Applicant result not found');
    }

    return {
      message: shortlistedRaw
        ? 'Candidate shortlisted'
        : 'Candidate removed from shortlist',
      shortlisted: updated.isShortlisted,
      shortlistedAt: (updated as any)?.shortlistedAt,
    };
  }

  @Patch('results/email/:email/shortlist')
  @Roles(UserType.HR)
  async shortlistByEmailOnly(
    @Param('email') email: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const ownerId = this.extractUserId(req?.user?.userId);

    const cleanEmail = String(email ?? '')
      .trim()
      .toLowerCase();
    if (!cleanEmail) {
      throw new BadRequestException('email is required');
    }

    const shortlistedRaw = body?.shortlisted;
    if (typeof shortlistedRaw !== 'boolean') {
      throw new BadRequestException('shortlisted must be a boolean');
    }

    const result =
      await this.interviewResultService.findByApplicantEmail(cleanEmail);

    if (!result) {
      throw new NotFoundException('Applicant result not found');
    }

    if (result.createdBy !== ownerId) {
      throw new NotFoundException('Applicant result not found');
    }

    const interviewId = result.interviewId;
    const updated =
      await this.interviewResultService.setShortlistedByInterviewAndEmail({
        interviewId,
        applicantEmail: cleanEmail,
        createdBy: ownerId,
        shortlisted: shortlistedRaw,
      });

    if (!updated) {
      throw new NotFoundException('Failed to update shortlist status');
    }

    return {
      message: shortlistedRaw
        ? 'Candidate shortlisted'
        : 'Candidate removed from shortlist',
      shortlisted: updated.isShortlisted,
      shortlistedAt: (updated as any)?.shortlistedAt,
    };
  }

  @Post(':id/invite/email')
  @Roles(UserType.HR)
  async inviteSingle(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const _id = this.toObjectId(id);
    const ownerId = this.extractUserId(req?.user?.userId);

    const interview = await this.repo.findOne({ where: { _id } as any });
    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    this.ensureOwner(interview, ownerId);

    const email = String(body?.email ?? '')
      .trim()
      .toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      throw new BadRequestException('email is required');
    }
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email address');
    }

    const token = randomBytes(24).toString('base64url');
    const roomId = randomUUID();
    const inviteLink = this.createInviteLink(token);

    await this.inviteRepo.save(
      this.inviteRepo.create({
        interviewId: _id.toHexString(),
        createdBy: ownerId,
        email,
        token,
        roomId,
        status: 'pending',
      }),
    );

    await this.mailService.sendInterviewInvite(email, inviteLink);

    await this.repo.update(
      { _id } as any,
      {
        totalInvitesSent: (interview.totalInvitesSent || 0) + 1,
        invitationHistory: [
          ...(interview.invitationHistory || []),
          {
            email,
            method: 'single',
            roomLink: inviteLink,
            roomId,
            token,
            sentAt: new Date(),
          },
        ],
      } as any,
    );

    return { message: 'Invitation sent', sent: 1, inviteLink };
  }

  @Post(':id/invite')
  @Roles(UserType.HR)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async inviteByExcel(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Body() body: any,
    @Req() req: any,
  ) {
    const _id = this.toObjectId(id);
    const ownerId = this.extractUserId(req?.user?.userId);

    const interview = await this.repo.findOne({ where: { _id } as any });
    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    this.ensureOwner(interview, ownerId);

    if (!file?.buffer?.length) {
      throw new BadRequestException('Excel file is required');
    }

    let workbook: any;
    try {
      workbook = XLSX.read(file.buffer, { type: 'buffer' });
    } catch {
      throw new BadRequestException('Invalid Excel file');
    }

    const sheetName = workbook.SheetNames?.[0];
    if (!sheetName) {
      throw new BadRequestException('Excel file has no sheets');
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      blankrows: false,
      defval: '',
    }) as Array<Array<any>>;

    if (!rows.length) {
      throw new BadRequestException('Excel sheet is empty');
    }

    const emails: string[] = [];
    for (const row of rows) {
      const cell = row?.[0];
      if (cell === null || cell === undefined) continue;
      const email = String(cell).trim();
      if (!email) continue;
      if (email.toLowerCase() === 'email' || email.toLowerCase() === 'mail') {
        continue;
      }
      emails.push(email);
    }

    const uniqueEmails = Array.from(
      new Set(emails.map((e) => e.toLowerCase())),
    );
    const invalid: string[] = [];
    const valid: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const email of uniqueEmails) {
      if (emailRegex.test(email)) valid.push(email);
      else invalid.push(email);
    }

    if (valid.length === 0) {
      throw new BadRequestException('No valid email addresses found');
    }

    let sent = 0;
    const excelHistory: Array<any> = [];
    for (const email of valid) {
      const token = randomBytes(24).toString('base64url');
      const roomId = randomUUID();
      const inviteLink = this.createInviteLink(token);

      await this.inviteRepo.save(
        this.inviteRepo.create({
          interviewId: _id.toHexString(),
          createdBy: ownerId,
          email,
          token,
          roomId,
          status: 'pending',
        }),
      );

      await this.mailService.sendInterviewInvite(email, inviteLink);
      sent += 1;

      excelHistory.push({
        email,
        method: 'excel' as const,
        roomLink: inviteLink,
        roomId,
        token,
        sentAt: new Date(),
      });
    }

    await this.repo.update(
      { _id } as any,
      {
        totalInvitesSent: (interview.totalInvitesSent || 0) + sent,
        invitationHistory: [
          ...(interview.invitationHistory || []),
          ...excelHistory,
        ],
      } as any,
    );

    return {
      message: 'Invitations sent',
      sent,
      invalid,
    };
  }
}
