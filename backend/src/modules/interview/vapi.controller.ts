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
import { VapiToolCallDto } from './vapi.dto';

@Controller('vapi')
export class VapiController {
  private readonly logger = new Logger(VapiController.name);

  constructor(private readonly vapiService: VapiService) {}

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
}
