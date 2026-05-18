import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InterviewController } from './interview.controller';
import { PublicInterviewInviteController } from './public-interview-invite.controller';
import { PdfParserService } from './pdf-parser.service';
import { GroqInterviewAnalysisService } from './groq-interview-analysis.service';
import { GroqResumeAnalysisService } from './groq-resume-analysis.service';
import { VapiController } from './vapi.controller';
import { InterviewService } from './interview.service';
import { VapiService } from './vapi.service';
import { InterviewResultService } from './interview-result.service';
import { SharedModule } from 'src/shared/shared.module';
import { Interview } from 'src/database/entities/interview.entity';
import { InterviewInvite } from 'src/database/entities/interview-invite.entity';
import { InterviewResult } from 'src/database/entities/interview-result.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Interview, InterviewInvite, InterviewResult]),
    SharedModule,
  ],
  controllers: [
    InterviewController,
    PublicInterviewInviteController,
    VapiController,
  ],
  providers: [
    InterviewService,
    VapiService,
    InterviewResultService,
    PdfParserService,
    GroqInterviewAnalysisService,
    GroqResumeAnalysisService,
  ],
  exports: [InterviewService, VapiService],
})
export class InterviewModule {}
