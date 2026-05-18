import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';

import { Attendance } from 'src/database/entities/attendance.entity';
import { User } from 'src/database/entities/user.entity';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { UserType } from 'src/shared/enums/user.enums';
import { JwtAuthGuard, RolesGuard } from 'src/shared/guards/roles.guard';
import { AttendanceService } from './attendance.service';
import { UserService } from '../user/user.service';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly userService: UserService,
  ) {}

  private toObjectId(id: string): ObjectId {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid employee id');
    }
    return new ObjectId(id);
  }

  private async getCurrentUser(req: any): Promise<User> {
    const userId = req?.user?.userId;
    if (!userId) {
      throw new BadRequestException('Invalid token payload');
    }

    const user = await this.userService.findOne({
      where: { _id: this.toObjectId(String(userId)) } as any,
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  @Post('mark')
  @Roles(UserType.EMPLOYEE)
  async mark(@Req() req: any, @Body() body: any) {
    const currentUser = await this.getCurrentUser(req);
    const date = new Date().toISOString().slice(0, 10);

    const existing = await this.attendanceService.findOne({
      where: {
        employeeId: String(currentUser._id),
        date,
      } as any,
    });

    if (existing) {
      throw new BadRequestException('Attendance already marked for today');
    }

    const attendance = this.attendanceService.create({
      employeeId: String(currentUser._id),
      employeeName: currentUser.username,
      date,
      status: body?.status ?? 'present',
      checkInAt: new Date().toISOString(),
      note: body?.note,
    });

    const saved = await this.attendanceService.save(attendance);
    return {
      message: 'Attendance marked successfully',
      attendance: saved,
    };
  }

  @Get()
  @Roles(UserType.HR, UserType.EMPLOYEE)
  async list(@Req() req: any) {
    const currentUser = await this.getCurrentUser(req);
    if (currentUser.role === UserType.HR) {
      return await this.attendanceService.find({
        order: { createdAt: 'DESC' } as any,
      });
    }

    return await this.attendanceService.find({
      where: { employeeId: String(currentUser._id) } as any,
      order: { createdAt: 'DESC' } as any,
    });
  }
}
