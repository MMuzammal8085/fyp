import {
  Column,
  CreateDateColumn,
  Entity,
  ObjectId,
  ObjectIdColumn,
  Index,
} from 'typeorm';

@Entity('attendance')
export class Attendance {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Index()
  @Column()
  employeeId!: string;

  @Column()
  employeeName!: string;

  @Column()
  date!: string;

  @Column({ default: 'present' })
  status!: 'present' | 'absent' | 'late';

  @Column({ nullable: true })
  checkInAt?: string;

  @Column({ nullable: true })
  checkOutAt?: string;

  @Column({ nullable: true })
  note?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
