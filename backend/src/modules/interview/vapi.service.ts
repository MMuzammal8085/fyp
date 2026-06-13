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
    // Try direct transcript field in various locations
    const candidates = [
      body?.transcript,
      body?.message?.transcript,
      body?.message?.artifact?.transcript,
      body?.artifact?.transcript,
      body?.analysis?.transcript,
      body?.call?.transcript,
      body?.data?.transcript,
      body?.result?.transcript,
      body?.call?.messages,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        this.logger.debug(`✅ Found transcript at candidate location`);
        return candidate.trim();
      }
    }

    // Try to build transcript from messages array
    let messages =
      body?.message?.artifact?.messages ??
      body?.artifact?.messages ??
      body?.message?.messages ??
      body?.messages ??
      body?.call?.messages ??
      body?.conversation;

    if (Array.isArray(messages) && messages.length > 0) {
      this.logger.log(
        `📋 Building transcript from ${messages.length} messages`,
      );
      const lines = messages
        .map((entry: any) => {
          const role = String(
            entry?.role ?? entry?.speaker ?? entry?.type ?? 'speaker',
          )
            .trim()
            .toLowerCase();
          const text = String(
            entry?.message ??
              entry?.content ??
              entry?.text ??
              entry?.transcript ??
              entry?.data ??
              '',
          ).trim();
          return text ? `${role}: ${text}` : '';
        })
        .filter(Boolean);

      if (lines.length > 0) {
        this.logger.log(
          `✅ Built transcript from messages: ${lines.length} lines`,
        );
        return lines.join('\n');
      }
    }

    // Last resort: check if there's a fullTranscript or complete record
    if (
      typeof body?.fullTranscript === 'string' &&
      body.fullTranscript.trim()
    ) {
      this.logger.log(`✅ Found fullTranscript`);
      return body.fullTranscript.trim();
    }

    this.logger.warn(
      `⚠️ Could not extract transcript from payload. Available keys: ${Object.keys(body ?? {}).join(', ')}`,
    );
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
      callId:
        String(call?.id ?? body?.callId ?? body?.vapi_call_id ?? '').trim() ||
        undefined,
      email:
        String(
          customer?.email ??
            variableValues?.email ??
            body?.email ??
            body?.applicant_email ??
            '',
        )
          .trim()
          .toLowerCase() || undefined,
      interviewId:
        String(variableValues?.interviewId ?? body?.interviewId ?? '').trim() ||
        undefined,
      inviteToken:
        String(variableValues?.inviteToken ?? body?.inviteToken ?? '').trim() ||
        undefined,
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
      this.logger.warn(
        'persistTranscriptAndAnalysis called with empty transcript',
      );
      return null;
    }

    this.logger.log(
      `🔄 Starting transcript persistence (${transcript.length} chars)`,
    );

    let existing = input.existingRecord ?? null;

    if (!existing && input.inviteToken) {
      this.logger.log(`🔍 Looking up by inviteToken: ${input.inviteToken}`);
      existing = await this.interviewResultService.findByInviteToken(
        input.inviteToken,
      );
      if (existing) this.logger.log(`✅ Found record by inviteToken`);
    }

    if (!existing && input.interviewId && input.email) {
      this.logger.log(`🔍 Looking up by interviewId + email`);
      existing =
        await this.interviewResultService.findByInterviewIdAndApplicantEmail(
          input.interviewId,
          input.email,
        );
      if (existing) this.logger.log(`✅ Found record by interviewId + email`);
    }

    if (!existing && input.email) {
      this.logger.log(`🔍 Looking up by email: ${input.email}`);
      existing = await this.interviewResultService.findByApplicantEmail(
        input.email,
      );
      if (existing) this.logger.log(`✅ Found record by email`);
    }

    if (!existing) {
      this.logger.warn(`⚠️ No existing interview result found`);
    }

    let groqAnalysis: any;
    try {
      this.logger.log(`🤖 Starting Groq analysis...`);
      groqAnalysis = await this.groqInterviewAnalysisService.analyzeTranscript({
        transcript,
        jobTitle: input.jobTitle ?? existing?.job_title,
        jobDescription: input.jobDescription ?? existing?.job_description,
        compulsoryQuestions:
          input.compulsoryQuestions ?? existing?.compulsory_questions,
        resumeData: existing?.resume_data,
      });
      this.logger.log(`✅ Groq analysis completed`);
    } catch (error: any) {
      this.logger.error(
        `❌ Groq analysis during transcript persist failed: ${error?.message}`,
      );
      this.logger.debug(`Error stack: ${error?.stack}`);
    }

    const groqSummary =
      typeof groqAnalysis?.summary === 'string'
        ? groqAnalysis.summary
        : undefined;
    const groqRating =
      typeof groqAnalysis?.overall_rating === 'number'
        ? groqAnalysis.overall_rating
        : undefined;

    this.logger.log(
      `📊 Groq summary: ${groqSummary ? 'Present (' + groqSummary.slice(0, 100) + '...)' : 'Missing'}`,
    );
    this.logger.log(`⭐ Groq rating: ${groqRating ?? 'Missing'}`);
    this.logger.log(
      `📋 Groq analysis keys: ${Object.keys(groqAnalysis ?? {}).join(', ')}`,
    );

    const result = await this.interviewResultService.markCompleted({
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

    this.logger.log(`✅ Interview result marked as completed: ${result?._id}`);
    return result;
  }

  async handleServerMessage(body: any) {
    const messageType = String(body?.message?.type ?? body?.type ?? '').trim();
    this.logger.log(`📨 Vapi server message type: ${messageType || 'unknown'}`);
    this.logger.debug(`📋 Payload keys: ${Object.keys(body ?? {}).join(', ')}`);

    if (messageType === 'tool-calls') {
      this.logger.log('🔧 Processing tool calls from VAPI');
      const toolCallList = body?.message?.toolCallList ?? [];
      this.logger.log(`Found ${toolCallList.length} tool calls to process`);

      const results: Array<{
        toolCallId: string;
        result: { ok: boolean; message: string };
      }> = [];
      for (const toolCall of toolCallList) {
        this.logger.debug(`Processing tool call: ${toolCall.function?.name}`);
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
      messageType === 'status-update' ||
      messageType === ''
    ) {
      this.logger.log(`🏁 Processing ${messageType || 'webhook'} from VAPI`);
      const transcript = this.extractTranscriptFromPayload(body);
      const meta = this.extractCallMetadata(body);

      this.logger.log(
        `📝 Extracted transcript length: ${transcript.length} chars`,
      );
      this.logger.log(`📧 Extracted email: ${meta.email}`);
      this.logger.log(`🎫 Extracted inviteToken: ${meta.inviteToken}`);
      this.logger.log(`🆔 Extracted callId: ${meta.callId}`);

      if (!transcript) {
        this.logger.warn(
          `⚠️ No transcript found in ${messageType || 'webhook'} payload`,
        );
        this.logger.warn(`💡 Ensure VAPI dashboard has transcription ENABLED`);
        this.logger.debug(
          `🔍 Payload structure: ${JSON.stringify({
            bodyKeys: Object.keys(body ?? {}),
            messageKeys: Object.keys(body?.message ?? {}),
            callKeys: Object.keys(body?.call ?? {}),
            messageType,
          })}`,
        );
        return { ok: true, saved: false, reason: 'no_transcript' };
      }

      const saved = await this.persistTranscriptAndAnalysis({
        email: meta.email,
        interviewId: meta.interviewId,
        inviteToken: meta.inviteToken,
        transcript,
        vapi_call_id: meta.callId,
      });

      this.logger.log(`💾 Persist result: ${Boolean(saved)}`);

      return {
        ok: true,
        saved: Boolean(saved),
        messageType,
      };
    }

    this.logger.warn(`⚠️ Unhandled message type: ${messageType}`);
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
    this.logger.debug(
      `Tool arguments keys: ${Object.keys(arguments_).join(', ')}`,
    );

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

        this.logger.log(`👤 Candidate: ${candidateName} <${applicantEmail}>`);
        this.logger.log(`🎫 Interview ID: ${interviewId}`);
        this.logger.log(`🔑 Invite Token: ${inviteToken}`);

        const rawQuestionResults =
          arguments_.question_results ??
          arguments_.questionResults ??
          interview?.question_results ??
          interview?.questionResults ??
          [];

        let questionResults: Array<any> = [];
        if (
          Array.isArray(rawQuestionResults) &&
          rawQuestionResults.length > 0
        ) {
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

        this.logger.log(`📋 Question results count: ${questionResults.length}`);

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
            this.logger.log(`🤖 Starting Groq analysis from tool call...`);
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
            this.logger.log(`✅ Groq analysis completed in tool call`);
          } catch (groqError: any) {
            this.logger.error(
              `⚠️ Groq analysis failed in tool call: ${groqError?.message || groqError}`,
            );
          }
        } else {
          this.logger.warn(`⚠️ No transcript available for Groq analysis`);
        }

        const groqRating =
          typeof groqAnalysis?.overall_rating === 'number'
            ? groqAnalysis.overall_rating
            : undefined;
        const groqSummary =
          typeof groqAnalysis?.summary === 'string'
            ? groqAnalysis.summary
            : undefined;

        this.logger.log(
          `📊 Extracted Groq summary: ${groqSummary ? '✅ Present (' + groqSummary.slice(0, 80) + '...)' : '❌ Missing'}`,
        );
        this.logger.log(
          `⭐ Extracted Groq rating: ${groqRating ?? '❌ Missing'}`,
        );
        if (groqAnalysis) {
          this.logger.log(
            `📋 Groq analysis keys: ${Object.keys(groqAnalysis).join(', ')}`,
          );
        }

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

        this.logger.log(`💾 Saving interview results...`);
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
