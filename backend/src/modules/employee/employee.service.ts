import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GenericEntityService } from 'src/shared/service/generic.entity.service';
import { User } from 'src/database/entities/user.entity';

@Injectable()
export class EmployeeService extends GenericEntityService<User> {
  constructor(
    @InjectRepository(User)
    private readonly employeeRepo: Repository<User>,
  ) {
    super(employeeRepo);
  }
}
