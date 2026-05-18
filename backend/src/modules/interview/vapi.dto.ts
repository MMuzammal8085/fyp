export class VapiToolCallDto {
  message?: {
    type: string;
    toolCallList?: Array<{
      toolCallId: string;
      function: {
        name: string;
        arguments?: Record<string, any>;
      };
    }>;
  };
  call?: {
    id: string;
    status: string;
  };
}
