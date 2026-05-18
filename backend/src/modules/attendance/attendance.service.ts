import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Attendance } from 'src/database/entities/attendance.entity';
import { GenericEntityService } from 'src/shared/service/generic.entity.service';

@Injectable()
export class AttendanceService extends GenericEntityService<Attendance> {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
  ) {
    super(attendanceRepo);
  }
}
