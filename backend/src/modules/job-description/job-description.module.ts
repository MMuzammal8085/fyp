import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JobDescriptionService } from './job-description.service';
import { JobDescriptionController } from './job-description.controller';

@Module({
  imports: [ConfigModule],
  providers: [JobDescriptionService],
  controllers: [JobDescriptionController],
  exports: [JobDescriptionService],
})
export class JobDescriptionModule {}
