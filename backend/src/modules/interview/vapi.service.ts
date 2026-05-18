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

  /**
   * Handle tool call webhook from Vapi
   * Saves interview results when the assistant calls save_interview_results tool
   */
  async handleToolCall(
    toolCallId: string,
    functionName: string,
    arguments_: ToolCallArguments,
  ) {
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

        this.logger.log(
          `📝 Extracted metadata: candidateName=${candidateName}, applicantEmail=${applicantEmail}`,
        );
        this.logger.log(
          `📝 Interview IDs: interviewId=${interviewId}, inviteToken=${inviteToken}`,
        );
        this.logger.log(
          `📝 Interview object keys: ${interview ? Object.keys(interview).join(', ') : 'no interview object'}`,
        );

        const rawQuestionResults =
          arguments_.question_results ??
          arguments_.questionResults ??
          interview?.question_results ??
          interview?.questionResults ??
          [];

        this.logger.log(
          `📋 Raw question results count: ${Array.isArray(rawQuestionResults) ? rawQuestionResults.length : 0}`,
        );
        this.logger.debug(
          `Raw question results: ${JSON.stringify(rawQuestionResults, null, 2)}`,
        );

        let questionResults: Array<any> = [];
        if (
          Array.isArray(rawQuestionResults) &&
          rawQuestionResults.length > 0
        ) {
          questionResults = rawQuestionResults;
          this.logger.log(
            `✅ Using question_results array (${questionResults.length} items)`,
          );
        } else if (interview && typeof interview === 'object') {
          if (
            Array.isArray(interview.questions) &&
            Array.isArray(interview.answers)
          ) {
            questionResults = (interview.questions as string[]).map(
              (q, idx) => ({
                question: q,
                answer: interview.answers[idx] || '',
                score: 0,
                maxScore: 10,
                status: 'answered',
                order: idx + 1,
              }),
            );
            this.logger.log(
              `✅ Constructed question_results from interview.questions/answers (${questionResults.length} items)`,
            );
          } else {
            this.logger.warn(
              `⚠️ No questions/answers arrays in interview object`,
            );
          }
        } else {
          this.logger.warn(
            `⚠️ No question_results provided and no interview.questions/answers`,
          );
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

        // Extract transcript safely
        const transcriptText = String(
          arguments_.transcript ?? interview?.transcript ?? '',
        ).trim();

        this.logger.log(`📝 Transcript length: ${transcriptText.length} chars`);

        // Analyze transcript with Groq if available
        let groqAnalysis: any = undefined;
        if (transcriptText && transcriptText.length > 0) {
          this.logger.log(`🔄 Starting Groq transcript analysis...`);
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
                compulsoryQuestions: Array.isArray(questionResults)
                  ? questionResults.map((q: any) => String(q?.question ?? ''))
                  : undefined,
                evaluation: arguments_.evaluation ?? interview?.evaluation,
              });
            this.logger.log(
              `✅ Groq analysis completed: ${JSON.stringify(groqAnalysis, null, 2)}`,
            );
          } catch (groqError: any) {
            this.logger.error(
              `⚠️ Groq analysis failed: ${groqError?.message || groqError}`,
            );
          }
        } else {
          this.logger.warn(`⚠️ No transcript available for Groq analysis`);
        }

        // Extract rating and summary from Groq analysis if available
        const groqRating =
          typeof groqAnalysis?.overall_rating === 'number'
            ? groqAnalysis.overall_rating
            : undefined;
        const groqSummary =
          typeof groqAnalysis?.summary === 'string'
            ? groqAnalysis.summary
            : undefined;

        const finalRating = overallRating ?? groqRating;
        const finalSummary = interviewSummary ?? groqSummary;

        this.logger.log(
          `📊 Scores: overall=${overallScore}, rating=${finalRating}, resume=${resumeScore}`,
        );

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
          overall_rating: finalRating,
          resume_score: resumeScore,
          interview_summary: finalSummary,
          transcript: transcriptText || undefined,
          analysis: groqAnalysis,
          evaluation: arguments_.evaluation ?? interview?.evaluation,
          vapi_call_id: String(
            arguments_.vapi_call_id ?? interview?.callId ?? toolCallId,
          ).trim(),
        };

        // Only add createdBy if we have it from interview object
        if (interview?.createdBy) {
          savePayload.createdBy = interview.createdBy;
          this.logger.log(
            `📌 Added createdBy from interview: ${interview.createdBy}`,
          );
        }

        this.logger.log(
          `💾 Saving with payload: ${JSON.stringify(savePayload, null, 2)}`,
        );

        const saved =
          await this.interviewResultService.markCompleted(savePayload);

        this.logger.log(
          `✅ Interview results saved successfully for: ${saved?.applicant_name ?? candidateName}`,
        );
        this.logger.debug(
          `Saved document ID: ${(saved as any)?._id ?? (saved as any)?.id}`,
        );

        return {
          toolCallId,
          result: { ok: true, message: 'Interview results saved' },
        };
      } catch (error: any) {
        this.logger.error(
          `❌ Error handling save_interview_results tool call: ${error.message}`,
          error.stack,
        );
        // Still return success so the call continues
        return {
          toolCallId,
          result: { ok: true, message: 'Tool call processed' },
        };
      }
    }

    // For any other tool calls, respond with ok
    this.logger.warn(`⚠️ Unknown tool called: ${functionName}`);
    return {
      toolCallId,
      result: { ok: true, message: 'Tool processed' },
    };
  }
}
