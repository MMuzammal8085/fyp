import {
  Body,
  Controller,
  Post,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { UserType } from 'src/shared/enums/user.enums';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { JwtAuthGuard, RolesGuard } from 'src/shared/guards/roles.guard';
import { JobDescriptionService } from './job-description.service';
import { GenerateJobDescriptionDto } from './job-description.dto';

@Controller('job-description')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobDescriptionController {
  constructor(private readonly jobDescriptionService: JobDescriptionService) {}

  @Post('generate')
  @Roles(UserType.HR)
  async generate(@Body() dto: GenerateJobDescriptionDto) {
    if (!dto.jobTitle || !dto.skillsRequired) {
      throw new BadRequestException(
        'Job title and skills required are mandatory fields',
      );
    }

    const description =
      await this.jobDescriptionService.generateJobDescription(dto);

    return {
      success: true,
      description,
    };
  }
}
