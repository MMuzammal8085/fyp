import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GenerateJobDescriptionDto {
  @IsString()
  @IsNotEmpty()
  jobTitle!: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  experienceLevel?: string;

  @IsOptional()
  @IsString()
  yearsOfExperience?: string;

  @IsString()
  @IsNotEmpty()
  skillsRequired!: string;

  @IsOptional()
  @IsString()
  languagesRequired?: string;

  @IsOptional()
  @IsString()
  toolsRequired?: string;

  @IsOptional()
  @IsString()
  educationRequired?: string;

  @IsOptional()
  @IsString()
  responsibilities?: string;

  @IsOptional()
  @IsString()
  salary?: string;

  @IsOptional()
  @IsString()
  benefits?: string;

  @IsOptional()
  @IsString()
  workType?: string;

  @IsOptional()
  @IsString()
  location?: string;
}
