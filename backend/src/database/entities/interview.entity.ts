// src/database/entities/interview.entity.ts

import {
  Entity,
  ObjectIdColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity('interviews')
export class Interview {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Index()
  @Column()
  createdBy!: string;

  @Column()
  job_title!: string;

  @Column({ nullable: false })
  description!: string;

  @Column({ nullable: true })
  durationMinutes?: number;

  @Column()
  questions!: string[];

  @Column({ default: 0 })
  totalInvitesSent!: number;

  @Column({ default: [] })
  invitationHistory!: Array<{
    email: string;
    method: 'single' | 'excel';
    roomLink: string;
    roomId?: string;
    token?: string;
    sentAt: Date;
  }>;

  @CreateDateColumn()
  createdAt!: Date;
}
