import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ObjectIdColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObjectId } from 'mongodb';

export type InterviewResultStatus =
  | 'prepared'
  | 'in_progress'
  | 'completed'
  | 'failed';

export type InterviewQuestionResult = {
  question?: string;
  answer?: string;
  score?: number;
  maxScore?: number;
  status?: string;
  order?: number;
};

@Entity('interview_results')
export class InterviewResult {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Index()
  @Column()
  interviewId!: string;

  @Index()
  @Column()
  inviteToken!: string;

  @Index()
  @Column()
  createdBy!: string;

  @Column()
  job_title!: string;

  @Column()
  job_description!: string;

  @Column()
  applicant_name!: string;

  @Column({ nullable: true })
  @Index()
  applicant_email?: string;

  @Column({ nullable: true })
  resumeUrl?: string;

  @Column({ type: 'double', nullable: true })
  overall_score?: number;

  @Column({ type: 'double', nullable: true })
  resume_score?: number;

  @Column({ nullable: true })
  skills?: string;

  @Column({ nullable: true })
  projects?: string;

  @Column({ nullable: true })
  resume_data?: any;

  @Column({ default: [] })
  compulsory_questions!: string[];

  @Column({ default: [] })
  question_results!: InterviewQuestionResult[];

  @Column({ default: 'prepared' })
  status!: InterviewResultStatus;

  @Column({ nullable: true })
  vapi_call_id?: string;

  @Column({ nullable: true })
  transcript?: string;

  @Column({ nullable: true })
  analysis?: any;

  @Column({ nullable: true })
  evaluation?: any;

  @Column({ nullable: true })
  interview_summary?: string;

  @Column({ type: 'double', nullable: true })
  overall_rating?: number;

  @Column({ default: false })
  isShortlisted!: boolean;

  @Column({ nullable: true })
  shortlistedAt?: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
