import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ObjectId,
  ObjectIdColumn,
} from 'typeorm';
import { TaskStatus } from 'src/shared/enums/task.enums';

@Entity('tasks')
export class Task {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Index()
  @Column()
  assignedTo!: string;

  @Index()
  @Column()
  createdBy!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: TaskStatus.ASSIGNED })
  status!: TaskStatus;

  @Column({ nullable: true })
  dueDate?: string;

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: true })
  completedAt?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
