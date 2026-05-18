import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Task } from 'src/database/entities/task.entity';
import { GenericEntityService } from 'src/shared/service/generic.entity.service';

@Injectable()
export class TasksService extends GenericEntityService<Task> {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
  ) {
    super(taskRepo);
  }
}
