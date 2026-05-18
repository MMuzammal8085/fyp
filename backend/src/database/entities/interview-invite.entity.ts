import {
  Entity,
  ObjectIdColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ObjectId } from 'mongodb';

export type InterviewInviteStatus = 'pending' | 'prepared' | 'completed';

@Entity('interview_invites')
export class InterviewInvite {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Index()
  @Column()
  interviewId!: string;

  @Index()
  @Column()
  createdBy!: string;

  @Index()
  @Column()
  email!: string;

  @Index()
  @Column()
  token!: string;

  @Column()
  roomId!: string;

  @Column({ default: 'pending' })
  status!: InterviewInviteStatus;

  @Column({ nullable: true })
  username?: string;

  @Column({ nullable: true })
  resumeUrl?: string;

  @Column({ nullable: true })
  preparedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
