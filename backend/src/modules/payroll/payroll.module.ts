import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SharedModule } from 'src/shared/shared.module';
import { Payroll } from 'src/database/entities/payroll.entity';
import { UserModule } from '../user/user.module';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payroll]), SharedModule, UserModule],
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}
