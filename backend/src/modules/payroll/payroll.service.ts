import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Payroll } from 'src/database/entities/payroll.entity';
import { GenericEntityService } from 'src/shared/service/generic.entity.service';

@Injectable()
export class PayrollService extends GenericEntityService<Payroll> {
  constructor(
    @InjectRepository(Payroll)
    private readonly payrollRepo: Repository<Payroll>,
  ) {
    super(payrollRepo);
  }
}
