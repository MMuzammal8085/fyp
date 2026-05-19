import { Injectable, Logger } from '@nestjs/common';
import { InterviewResultService } from './interview-result.service';
import { GroqInterviewAnalysisService } from './groq-interview-analysis.service';

interface ToolCallArguments {
  candidate?: string;
  job?: string;
  interview?: any;
  inviteToken?: string;
  interviewId?: string;
  jobTitle?: string;
  jobDescription?: string;
  applicant_name?: string;
  applicant_email?: string;
  question_results?: any[];
  questionResults?: any[];
  overallScore?: number;
  overall_score?: number;
  overallRating?: number;
  overall_rating?: number;
  resumeScore?: number;
  resume_score?: number;
  transcript?: string;
  evaluation?: any;
  interview_summary?: string;
  summary?: string;
  vapi_call_id?: string;
}

@Injectable()
export class VapiService {
  private readonly logger = new Logger(VapiService.name);

  constructor(
    private readonly interviewResultService: InterviewResultService,
    private readonly groqInterviewAnalysisService: GroqInterviewAnalysisService,
  ) {}

  parseToolArguments(raw: unknown): ToolCallArguments {
    if (!raw) return {};
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return typeof parsed === 'object' && parsed ? parsed : {};
      } catch {
        this.logger.warn('Tool call arguments were a non-JSON string');
        return {};
      }
    }
    if (typeof raw === 'object') return raw as ToolCallArguments;
    return {};
  }

  extractTranscriptFromPayload(body: any): string {
    const candidates = [
      body?.transcript,
      body?.message?.transcript,
      body?.message?.artifact?.transcript,
      body?.artifact?.transcript,
      body?.analysis?.transcript,
      body?.call?.transcript,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }

    const messages =
      body?.message?.artifact?.messages ??
      body?.artifact?.messages ??
      body?.messages;

    if (Array.isArray(messages) && messages.length > 0) {
      const lines = messages
        .map((entry: any) => {
          const role = String(entry?.role ?? entry?.speaker ?? 'speaker').trim();
          const text = String(
            entry?.message ?? entry?.content ?? entry?.text ?? entry?.transcript ?? '',
          ).trim();
          return text ? `${role}: ${text}` : '';
        })
        .filter(Boolean);
      if (lines.length > 0) return lines.join('\n');
    }

    return '';
  }

  extractCallMetadata(body: any): {
    callId?: string;
    email?: string;
    interviewId?: string;
    inviteToken?: string;
  } {
    const call = body?.message?.call ?? body?.call ?? {};
    const customer = call?.customer ?? body?.customer ?? {};
    const variableValues =
      call?.assistantOverrides?.variableValues ??
      body?.message?.assistantOverrides?.variableValues ??
      {};

    return {
      callId: String(call?.id ?? body?.callId ?? body?.vapi_call_id ?? '').trim() || undefined,
      email: String(
        customer?.email ??
          variableValues?.email ??
          body?.email ??
          body?.applicant_email ??
          '',
      )
        .trim()
        .toLowerCase() || undefined,
      interviewId: String(
        variableValues?.interviewId ?? body?.interviewId ?? '',
      ).trim() || undefined,
      inviteToken: String(
        variableValues?.inviteToken ?? body?.inviteToken ?? '',
      ).trim() || undefined,
    };
  }

  async persistTranscriptAndAnalysis(input: {
    email?: string;
    interviewId?: string;
    inviteToken?: string;
    transcript: string;
    vapi_call_id?: string;
    jobTitle?: string;
    jobDescription?: string;
    compulsoryQuestions?: string[];
    existingRecord?: any;
  }) {
    const transcript = String(input.transcript ?? '').trim();
    if (!transcript) {
      this.logger.warn('persistTranscriptAndAnalysis called with empty transcript');
      return null;
    }

    let existing = input.existingRecord ?? null;

    if (!existing && input.inviteToken) {
      existing = await this.interviewResultService.findByInviteToken(
        input.inviteToken,
      );
    }

    if (!existing && input.interviewId && input.email) {
      existing =
        await this.interviewResultService.findByInterviewIdAndApplicantEmail(
          input.interviewId,
          input.email,
        );
    }

    if (!existing && input.email) {
      existing = await this.interviewResultService.findByApplicantEmail(
        input.email,
      );
    }

    let groqAnalysis: any;
    try {
      groqAnalysis = await this.groqInterviewAnalysisService.analyzeTranscript({
        transcript,
        jobTitle: input.jobTitle ?? existing?.job_title,
        jobDescription: input.jobDescription ?? existing?.job_description,
        compulsoryQuestions:
          input.compulsoryQuestions ?? existing?.compulsory_questions,
        resumeData: existing?.resume_data,
      });
    } catch (error: any) {
      this.logger.error(`Groq analysis during transcript persist failed: ${error?.message}`);
    }

    const groqSummary =
      typeof groqAnalysis?.summary === 'string' ? groqAnalysis.summary : undefined;
    const groqRating =
      typeof groqAnalysis?.overall_rating === 'number'
        ? groqAnalysis.overall_rating
        : undefined;

    return this.interviewResultService.markCompleted({
      inviteToken: input.inviteToken ?? existing?.inviteToken,
      interviewId: input.interviewId ?? existing?.interviewId,
      createdBy: existing?.createdBy,
      applicant_name: existing?.applicant_name ?? 'Candidate',
      applicant_email: input.email ?? existing?.applicant_email,
      job_title: input.jobTitle ?? existing?.job_title,
      job_description: input.jobDescription ?? existing?.job_description,
      compulsory_questions: existing?.compulsory_questions,
      question_results: existing?.question_results,
      resume_data: existing?.resume_data,
      resume_score: existing?.resume_score,
      transcript,
      analysis: groqAnalysis,
      interview_summary: groqSummary ?? existing?.interview_summary,
      overall_rating: groqRating ?? existing?.overall_rating,
      vapi_call_id: input.vapi_call_id ?? existing?.vapi_call_id,
    });
  }

  async handleServerMessage(body: any) {
    const messageType = String(body?.message?.type ?? body?.type ?? '').trim();
    this.logger.log(`📨 Vapi server message type: ${messageType || 'unknown'}`);

    if (messageType === 'tool-calls') {
      const toolCallList = body?.message?.toolCallList ?? [];
      const results: Array<{
        toolCallId: string;
        result: { ok: boolean; message: string };
      }> = [];
      for (const toolCall of toolCallList) {
        const result = await this.handleToolCall(
          toolCall.toolCallId,
          toolCall.function?.name || '',
          this.parseToolArguments(toolCall.function?.arguments),
        );
        results.push(result);
      }
      return { results };
    }

    if (
      messageType === 'end-of-call-report' ||
      messageType === 'status-update'
    ) {
      const transcript = this.extractTranscriptFromPayload(body);
      const meta = this.extractCallMetadata(body);

      if (!transcript) {
        this.logger.warn(`No transcript found in ${messageType} payload`);
        return { ok: true, saved: false, reason: 'no_transcript' };
      }

      const saved = await this.persistTranscriptAndAnalysis({
        email: meta.email,
        interviewId: meta.interviewId,
        inviteToken: meta.inviteToken,
        transcript,
        vapi_call_id: meta.callId,
      });

      return {
        ok: true,
        saved: Boolean(saved),
        messageType,
      };
    }

    return { ok: true, ignored: true, messageType };
  }

  async handleToolCall(
    toolCallId: string,
    functionName: string,
    rawArguments: ToolCallArguments | string,
  ) {
    const arguments_ = this.parseToolArguments(rawArguments);

    this.logger.log(
      `🔧 Handling tool call: ${functionName} (ID: ${toolCallId})`,
    );
    this.logger.debug(`Tool arguments: ${JSON.stringify(arguments_, null, 2)}`);

    if (functionName === 'save_interview_results') {
      try {
        const { candidate, job, interview } = arguments_;

        const candidateName =
          String(
            arguments_.applicant_name ??
              candidate ??
              interview?.candidate ??
              interview?.applicant_name ??
              '',
          ).trim() || 'Candidate';

        const applicantEmail = String(
          arguments_.applicant_email ??
            interview?.applicant_email ??
            interview?.email ??
            '',
        )
          .trim()
          .toLowerCase();
        const interviewId = String(
          arguments_.interviewId ?? interview?.interviewId ?? '',
        ).trim();
        const inviteToken = String(
          arguments_.inviteToken ?? interview?.inviteToken ?? '',
        ).trim();

        const rawQuestionResults =
          arguments_.question_results ??
          arguments_.questionResults ??
          interview?.question_results ??
          interview?.questionResults ??
          [];

        let questionResults: Array<any> = [];
        if (Array.isArray(rawQuestionResults) && rawQuestionResults.length > 0) {
          questionResults = rawQuestionResults;
        } else if (
          interview &&
          typeof interview === 'object' &&
          Array.isArray(interview.questions) &&
          Array.isArray(interview.answers)
        ) {
          questionResults = (interview.questions as string[]).map((q, idx) => ({
            question: q,
            answer: interview.answers[idx] || '',
            score: 0,
            maxScore: 10,
            status: 'answered',
            order: idx + 1,
          }));
        }

        const overallScore =
          typeof arguments_.overallScore === 'number'
            ? arguments_.overallScore
            : typeof arguments_.overall_score === 'number'
              ? arguments_.overall_score
              : undefined;

        const overallRating =
          typeof arguments_.overallRating === 'number'
            ? arguments_.overallRating
            : typeof arguments_.overall_rating === 'number'
              ? arguments_.overall_rating
              : undefined;

        const resumeScore =
          typeof arguments_.resumeScore === 'number'
            ? arguments_.resumeScore
            : typeof arguments_.resume_score === 'number'
              ? arguments_.resume_score
              : undefined;

        const interviewSummary =
          String(
            arguments_.interview_summary ??
              arguments_.summary ??
              arguments_.evaluation?.summary ??
              '',
          ).trim() || undefined;

        const transcriptText =
          this.extractTranscriptFromPayload(arguments_) ||
          String(arguments_.transcript ?? interview?.transcript ?? '').trim();

        this.logger.log(`📝 Transcript length: ${transcriptText.length} chars`);

        let groqAnalysis: any = undefined;
        if (transcriptText) {
          try {
            groqAnalysis =
              await this.groqInterviewAnalysisService.analyzeTranscript({
                transcript: transcriptText,
                jobTitle:
                  String(
                    arguments_.jobTitle ?? job ?? interview?.jobTitle ?? '',
                  ).trim() || undefined,
                jobDescription:
                  String(
                    arguments_.jobDescription ??
                      interview?.jobDescription ??
                      '',
                  ).trim() || undefined,
                compulsoryQuestions: questionResults.map((q: any) =>
                  String(q?.question ?? ''),
                ),
                evaluation: arguments_.evaluation ?? interview?.evaluation,
              });
          } catch (groqError: any) {
            this.logger.error(
              `⚠️ Groq analysis failed: ${groqError?.message || groqError}`,
            );
          }
        }

        const groqRating =
          typeof groqAnalysis?.overall_rating === 'number'
            ? groqAnalysis.overall_rating
            : undefined;
        const groqSummary =
          typeof groqAnalysis?.summary === 'string'
            ? groqAnalysis.summary
            : undefined;

        const savePayload: any = {
          inviteToken: inviteToken || undefined,
          interviewId: interviewId || undefined,
          applicant_name: candidateName,
          applicant_email: applicantEmail || undefined,
          job_title:
            String(
              arguments_.jobTitle ?? job ?? interview?.jobTitle ?? '',
            ).trim() || undefined,
          job_description:
            String(
              arguments_.jobDescription ?? interview?.jobDescription ?? '',
            ).trim() || undefined,
          question_results: questionResults,
          overall_score: overallScore,
          overall_rating: overallRating ?? groqRating,
          resume_score: resumeScore,
          interview_summary: interviewSummary ?? groqSummary,
          transcript: transcriptText || undefined,
          analysis: groqAnalysis,
          evaluation: arguments_.evaluation ?? interview?.evaluation,
          vapi_call_id: String(
            arguments_.vapi_call_id ?? interview?.callId ?? toolCallId,
          ).trim(),
        };

        if (interview?.createdBy) {
          savePayload.createdBy = interview.createdBy;
        }

        const saved =
          await this.interviewResultService.markCompleted(savePayload);

        this.logger.log(
          `✅ Interview results saved for: ${saved?.applicant_name ?? candidateName}`,
        );

        return {
          toolCallId,
          result: { ok: true, message: 'Interview results saved' },
        };
      } catch (error: any) {
        this.logger.error(
          `❌ Error handling save_interview_results: ${error.message}`,
          error.stack,
        );
        return {
          toolCallId,
          result: { ok: true, message: 'Tool call processed' },
        };
      }
    }

    this.logger.warn(`⚠️ Unknown tool called: ${functionName}`);
    return {
      toolCallId,
      result: { ok: true, message: 'Tool processed' },
    };
  }
}
