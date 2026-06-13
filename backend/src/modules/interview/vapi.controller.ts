import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
  UnauthorizedException,
  Get,
} from '@nestjs/common';
import { VapiService } from './vapi.service';
import { InterviewResultService } from './interview-result.service';
import { VapiToolCallDto } from './vapi.dto';
import { GroqInterviewAnalysisService } from './groq-interview-analysis.service';

@Controller('vapi')
export class VapiController {
  private readonly logger = new Logger(VapiController.name);

  constructor(
    private readonly vapiService: VapiService,
    private readonly interviewResultService: InterviewResultService,
    private readonly groqService: GroqInterviewAnalysisService,
  ) {}

  private validateWebhookSecret(vapiSecret: string | undefined) {
    const webhookSecret = String(process.env.VAPI_WEBHOOK_SECRET ?? '').trim();
    if (!webhookSecret) {
      this.logger.warn('VAPI_WEBHOOK_SECRET is not configured');
      return;
    }
    if (vapiSecret !== webhookSecret) {
      this.logger.error('❌ Invalid webhook secret');
      throw new UnauthorizedException('Invalid webhook secret');
    }
  }

  /**
   * POST /vapi/webhook
   * Unified Vapi server URL handler (tool-calls, end-of-call-report, etc.)
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-vapi-secret') vapiSecret: string,
  ) {
    this.logger.log('🔔 Vapi webhook received');
    this.logger.debug(`Payload keys: ${Object.keys(payload ?? {}).join(', ')}`);
    this.validateWebhookSecret(vapiSecret);

    try {
      return await this.vapiService.handleServerMessage(payload);
    } catch (error: any) {
      this.logger.error(
        `❌ Webhook handler error: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to process Vapi webhook');
    }
  }

  /**
   * POST /vapi/tool-calls
   * Legacy tool-call webhook endpoint
   */
  @Post('tool-calls')
  @HttpCode(HttpStatus.OK)
  async handleToolCall(
    @Body() payload: VapiToolCallDto,
    @Headers('x-vapi-secret') vapiSecret: string,
  ) {
    this.logger.log('🔔 Tool-calls webhook received from VAPI');
    this.validateWebhookSecret(vapiSecret);

    try {
      return await this.vapiService.handleServerMessage(payload);
    } catch (error: any) {
      this.logger.error(
        `❌ Error in tool call webhook handler: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to process tool call');
    }
  }

  /**
   * POST /vapi/call-started
   * Marks interview result as in_progress when the Vapi call connects
   */
  @Post('call-started')
  @HttpCode(HttpStatus.OK)
  async callStarted(@Body() body: any) {
    const email = String(body?.email ?? body?.applicant_email ?? '')
      .trim()
      .toLowerCase();
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const updated = await this.interviewResultService.markInProgress({
      applicant_email: email,
      interviewId: String(body?.interviewId ?? '').trim() || undefined,
      inviteToken: String(body?.inviteToken ?? '').trim() || undefined,
      vapi_call_id:
        String(body?.vapi_call_id ?? body?.callId ?? '').trim() || undefined,
    });

    return {
      success: Boolean(updated),
      status: updated?.status ?? 'prepared',
    };
  }

  /**
   * POST /vapi/save-transcript
   * Saves transcript from frontend after call ends and runs Groq analysis
   */
  @Post('save-transcript')
  @HttpCode(HttpStatus.OK)
  async saveTranscript(@Body() body: any) {
    this.logger.log('📝 save-transcript request received');
    this.logger.debug(
      `📋 Request body keys: ${Object.keys(body ?? {}).join(', ')}`,
    );

    try {
      const email = String(body?.email ?? body?.applicant_email ?? '')
        .trim()
        .toLowerCase();

      const transcript = this.vapiService.extractTranscriptFromPayload(body);

      if (!email) {
        this.logger.warn('❌ Email is required for transcript save');
        throw new BadRequestException('Email is required');
      }
      if (!transcript) {
        this.logger.warn('❌ Transcript is empty or missing');
        this.logger.warn(
          '💡 Ensure VAPI has transcription ENABLED in dashboard settings',
        );
        throw new BadRequestException('Transcript is required');
      }

      const interviewId = String(body?.interviewId ?? '').trim() || undefined;
      const inviteToken = String(body?.inviteToken ?? '').trim() || undefined;

      this.logger.log(
        `💾 Persisting transcript (${transcript.length} chars) for ${email}`,
      );
      this.logger.log(`🎫 Interview ID: ${interviewId ?? 'not provided'}`);
      this.logger.log(`🔑 Invite Token: ${inviteToken ?? 'not provided'}`);

      const saved = await this.vapiService.persistTranscriptAndAnalysis({
        email,
        interviewId,
        inviteToken,
        transcript,
        vapi_call_id:
          String(body?.vapi_call_id ?? body?.callId ?? '').trim() || undefined,
        jobTitle: body?.jobTitle,
        jobDescription: body?.jobDescription,
      });

      if (!saved) {
        this.logger.warn(`⚠️ No interview result found for email: ${email}`);
        return {
          success: false,
          message: 'No interview result found for this email',
          email,
          transcriptLength: transcript.length,
        };
      }

      this.logger.log(`✅ Transcript saved and analyzed successfully`);
      return {
        success: true,
        message: 'Transcript saved and analyzed successfully',
        email,
        id: (saved as any)?._id,
        transcriptLength: transcript.length,
        analysisAvailable: Boolean((saved as any)?.analysis),
        interviewSummary: (saved as any)?.interview_summary,
        overallRating: (saved as any)?.overall_rating,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(
        `❌ Error saving transcript: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to save transcript: ${error.message}`,
      );
    }
  }

  /**
   * GET /vapi/health
   * Health check endpoint to verify configuration
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async healthCheck() {
    const vapiSecret = String(process.env.VAPI_WEBHOOK_SECRET ?? '').trim();
    const vapiPrivateKey = String(process.env.VAPI_PRIVATE_KEY ?? '').trim();
    const vapiAssistantId = String(process.env.VAPI_ASSISTANT_ID ?? '').trim();
    const groqApiKey = String(process.env.GROQ_API_KEY ?? '').trim();
    const groqModel = String(
      process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
    ).trim();

    return {
      status: 'ok',
      vapi: {
        webhookSecretConfigured: Boolean(vapiSecret),
        privateKeyConfigured: Boolean(vapiPrivateKey),
        assistantIdConfigured: Boolean(vapiAssistantId),
        assistantId: vapiAssistantId || 'NOT_CONFIGURED',
      },
      groq: {
        apiKeyConfigured: Boolean(groqApiKey),
        model: groqModel,
        enabled: Boolean(groqApiKey),
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /vapi/assistant-info
   * Get VAPI assistant configuration
   */
  @Get('assistant-info')
  @HttpCode(HttpStatus.OK)
  async getAssistantInfo() {
    const assistantId = String(process.env.VAPI_ASSISTANT_ID ?? '').trim();
    const publicKey = String(process.env.VAPI_PUBLIC_KEY ?? '').trim();

    if (!assistantId) {
      throw new BadRequestException('VAPI_ASSISTANT_ID is not configured');
    }

    return {
      assistantId,
      publicKey: publicKey ? '***configured***' : 'NOT_CONFIGURED',
      webhookBaseUrl: process.env.WEBHOOK_URL ?? 'NOT_CONFIGURED',
      configured: Boolean(assistantId && publicKey),
    };
  }
}
