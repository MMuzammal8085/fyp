import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ObjectId,
  ObjectIdColumn,
} from 'typeorm';
import { PayrollStatus } from 'src/shared/enums/payroll.enums';

@Entity('payroll')
export class Payroll {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Index()
  @Column()
  employeeId!: string;

  @Column()
  employeeName!: string;

  @Column()
  month!: string;

  @Column({ default: 0 })
  baseSalary!: number;

  @Column({ default: 0 })
  allowance!: number;

  @Column({ default: 0 })
  deductions!: number;

  @Column({ default: 0 })
  netPay!: number;

  @Column({ default: PayrollStatus.DRAFT })
  status!: PayrollStatus;

  @Column({ nullable: true })
  note?: string;

  @Column({ nullable: true })
  paidAt?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
