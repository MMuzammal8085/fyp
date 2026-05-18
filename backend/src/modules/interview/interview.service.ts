import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { Interview } from 'src/database/entities/interview.entity';
import { GenericEntityService } from 'src/shared/service/generic.entity.service';

@Injectable()
export class InterviewService extends GenericEntityService<Interview> {
  constructor(dataSource: DataSource) {
    super(dataSource.getMongoRepository(Interview));
  }
}
