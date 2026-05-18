import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GenerateJobDescriptionDto } from './job-description.dto';

@Injectable()
export class JobDescriptionService {
  private readonly groq: OpenAI;
  private readonly preferredModel: string;

  constructor(private configService: ConfigService) {
    const apiKey =
      this.configService.get<string>('GROQ_API_KEY') ??
      this.configService.get<string>('OPENAI_API_KEY') ??
      this.configService.get<string>('OPEN_AI_API_KEY');
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set in environment variables');
    }
    this.groq = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });
    this.preferredModel =
      this.configService.get<string>('GROQ_MODEL') ?? 'llama-3.3-70b-versatile';
  }

  async generateJobDescription(
    dto: GenerateJobDescriptionDto,
  ): Promise<string> {
    const prompt = this.buildPrompt(dto);
    try {
      const response = await this.groq.chat.completions.create({
        model: this.preferredModel,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      });

      const description = response.choices?.[0]?.message?.content?.trim();
      if (description) {
        return description;
      }

      throw new Error('Groq returned an empty job description');
    } catch (error: any) {
      if (error?.status === 401 || error?.status === 403) {
        throw new HttpException(
          'Groq API key is invalid or not authorized for this project.',
          HttpStatus.BAD_GATEWAY,
        );
      }

      if (error?.status === 429) {
        throw new HttpException(
          'Groq API quota exceeded. Please check your usage limits and retry after quota resets.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      console.error('Error generating job description with Groq:', error);
      throw new InternalServerErrorException(
        'Failed to generate job description',
      );
    }
  }

  private buildPrompt(dto: GenerateJobDescriptionDto): string {
    return `You are a professional HR recruiter. Create a comprehensive and engaging job description based on the following details:

Job Title: ${dto.jobTitle}
${dto.department ? `Department: ${dto.department}` : ''}
${dto.experienceLevel ? `Experience Level: ${dto.experienceLevel}` : ''}
${dto.yearsOfExperience ? `Years of Experience Required: ${dto.yearsOfExperience}` : ''}
${dto.location ? `Location: ${dto.location}` : ''}
${dto.workType ? `Work Type: ${dto.workType}` : ''}

Skills Required:
${dto.skillsRequired}

${dto.languagesRequired ? `Languages Required:\n${dto.languagesRequired}\n` : ''}
${dto.toolsRequired ? `Tools & Technologies Required:\n${dto.toolsRequired}\n` : ''}
${dto.educationRequired ? `Education Required:\n${dto.educationRequired}\n` : ''}
${dto.responsibilities ? `Key Responsibilities:\n${dto.responsibilities}\n` : ''}
${dto.salary ? `Salary Range: ${dto.salary}` : ''}
${dto.benefits ? `Benefits: ${dto.benefits}` : ''}

Requirements:
1. Write a professional job description that is engaging and clear
2. Include an executive summary/role overview
3. Organize responsibilities as bullet points
4. Organize required qualifications as bullet points
5. Keep the tone professional but approachable
6. Make it attractive to potential candidates
7. Ensure it's comprehensive and well-structured
8. Do NOT add any company-specific claims
9. Use industry best practices for job descriptions

Generate the job description now:`;
  }
}
6;
