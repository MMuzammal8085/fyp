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
} from '@nestjs/common';
import { VapiService } from './vapi.service';
import { InterviewResultService } from './interview-result.service';
import { VapiToolCallDto } from './vapi.dto';

@Controller('vapi')
export class VapiController {
  private readonly logger = new Logger(VapiController.name);

  constructor(
    private readonly vapiService: VapiService,
    private readonly interviewResultService: InterviewResultService,
  ) {}

  /**
   * POST /vapi/tool-calls
   * Webhook endpoint for Vapi tool calls
   * Validates the secret header and processes tool calls
   */
  @Post('tool-calls')
  @HttpCode(HttpStatus.OK)
  async handleToolCall(
    @Body() payload: VapiToolCallDto,
    @Headers('x-vapi-secret') vapiSecret: string,
  ) {
    // Log incoming webhook
    this.logger.log('🔔 Webhook received from VAPI');
    this.logger.debug(`Full payload: ${JSON.stringify(payload, null, 2)}`);

    // Validate webhook secret
    const webhookSecret = String(process.env.VAPI_WEBHOOK_SECRET ?? '').trim();
    if (vapiSecret !== webhookSecret) {
      this.logger.error('❌ Invalid webhook secret');
      throw new UnauthorizedException('Invalid webhook secret');
    }

    try {
      const toolCallList = payload?.message?.toolCallList || [];
      this.logger.log(`📋 Tool call list length: ${toolCallList.length}`);

      if (!Array.isArray(toolCallList) || toolCallList.length === 0) {
        this.logger.warn('⚠️ No tool calls in webhook payload');
        // No tool calls to process
        return {
          results: [],
        };
      }

      const results: Array<{
        toolCallId: string;
        result: { ok: boolean; message: string };
      }> = [];

      for (const toolCall of toolCallList) {
        try {
          const toolCallId = toolCall.toolCallId;
          const functionName = toolCall.function?.name || '';
          const args = toolCall.function?.arguments || {};

          this.logger.log(
            `🔧 Processing tool call: ${functionName} (id: ${toolCallId})`,
          );
          this.logger.debug(`Tool arguments: ${JSON.stringify(args, null, 2)}`);

          const result = await this.vapiService.handleToolCall(
            toolCallId,
            functionName,
            args,
          );
          results.push(result);
          this.logger.log(
            `✅ Tool call ${functionName} processed successfully`,
          );
        } catch (error: any) {
          this.logger.error(
            `❌ Error processing individual tool call: ${error.message}`,
            error.stack,
          );
          // Still return a result so the call doesn't fail
          if (toolCall.toolCallId) {
            results.push({
              toolCallId: toolCall.toolCallId,
              result: { ok: true, message: 'Processed with error' },
            });
          }
        }
      }

      this.logger.log(
        `✨ Webhook processing complete. Results: ${results.length}`,
      );
      return { results };
    } catch (error: any) {
      this.logger.error(
        `❌ Error in tool call webhook handler: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to process tool call');
    }
  }

  /**
   * POST /vapi/save-transcript
   * Saves the transcript captured by the frontend after the call ends
   * Updates the interview result record with the transcript for a specific email
   */
  @Post('save-transcript')
  @HttpCode(HttpStatus.OK)
  async saveTranscript(
    @Body() body: { email: string; transcript: string; interviewId?: string },
  ) {
    this.logger.log(`📝 Saving transcript for email: ${body.email}`);

    if (!body.email || !body.transcript) {
      throw new BadRequestException('Email and transcript are required');
    }

    try {
      const email = String(body.email).trim().toLowerCase();
      const transcript = String(body.transcript).trim();

      if (!email || !transcript) {
        throw new BadRequestException('Email and transcript cannot be empty');
      }

      this.logger.log(
        `🔍 Looking up interview result for email: ${email}`,
      );

      let existing = null;

      // If interviewId is provided, use it for lookup
      if (body.interviewId) {
        const interviewId = String(body.interviewId).trim();
        this.logger.log(
          `🔍 Looking up by interviewId + email: ${interviewId} / ${email}`,
        );
        existing =
          await this.interviewResultService.findByInterviewIdAndApplicantEmail(
            interviewId,
            email,
          );
      }

      // Fallback to email-only lookup
      if (!existing) {
        this.logger.log(`🔍 Looking up by email only: ${email}`);
        existing = await this.interviewResultService.findByApplicantEmail(
          email,
        );
      }

      if (!existing) {
        this.logger.warn(`⚠️ No existing interview result found for ${email}`);
        return {
          success: false,
          message: 'No interview result found for this email',
        };
      }

      this.logger.log(
        `✅ Found existing interview result: ${(existing as any)?._id}`,
      );

      // Update with transcript
      const updatePayload: any = {
        transcript,
      };

      this.logger.log(
        `💾 Updating record with transcript (length: ${transcript.length})`,
      );

      await this.interviewResultService.markCompleted({
        ...existing,
        ...updatePayload,
      });

      this.logger.log(
        `✅ Transcript saved successfully for email: ${email}`,
      );

      return {
        success: true,
        message: 'Transcript saved successfully',
        email,
      };
    } catch (error: any) {
      this.logger.error(
        `❌ Error saving transcript: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to save transcript: ${error.message}`,
      );
    }
  }
}
