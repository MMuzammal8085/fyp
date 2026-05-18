import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';

import { Task } from 'src/database/entities/task.entity';
import { User } from 'src/database/entities/user.entity';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { TaskStatus } from 'src/shared/enums/task.enums';
import { UserType } from 'src/shared/enums/user.enums';
import { JwtAuthGuard, RolesGuard } from 'src/shared/guards/roles.guard';
import { UserService } from '../user/user.service';
import { TasksService } from './tasks.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly userService: UserService,
  ) {}

  private toObjectId(id: string): ObjectId {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id');
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

  private normalizeStatus(status: any): TaskStatus {
    const value = String(status ?? '')
      .trim()
      .toLowerCase();
    if (Object.values(TaskStatus).includes(value as TaskStatus)) {
      return value as TaskStatus;
    }
    throw new BadRequestException('Invalid task status');
  }

  @Get()
  @Roles(UserType.HR, UserType.EMPLOYEE)
  async list(@Req() req: any) {
    const currentUser = await this.getCurrentUser(req);
    if (currentUser.role === UserType.HR) {
      return await this.tasksService.find({
        order: { createdAt: 'DESC' } as any,
      });
    }

    return await this.tasksService.find({
      where: { assignedTo: String(currentUser._id) } as any,
      order: { createdAt: 'DESC' } as any,
    });
  }

  @Post()
  @Roles(UserType.HR)
  async create(@Req() req: any, @Body() body: any) {
    const currentUser = await this.getCurrentUser(req);
    const assignedTo = String(body?.assignedTo ?? '').trim();
    const title = String(body?.title ?? '').trim();

    if (!assignedTo) {
      throw new BadRequestException('assignedTo is required');
    }
    if (!title) {
      throw new BadRequestException('title is required');
    }

    const employee = await this.userService.findOne({
      where: {
        _id: this.toObjectId(assignedTo),
        role: UserType.EMPLOYEE,
      } as any,
    });
    if (!employee) {
      throw new BadRequestException('Assigned employee not found');
    }

    const task = this.tasksService.create({
      createdBy: String(currentUser._id),
      assignedTo,
      title,
      description: body?.description,
      status: this.normalizeStatus(body?.status ?? TaskStatus.ASSIGNED),
      dueDate: body?.dueDate,
      notes: body?.notes,
    });

    const saved = await this.tasksService.save(task);
    return {
      message: 'Task created successfully',
      task: saved,
    };
  }

  @Patch(':id/status')
  @Roles(UserType.EMPLOYEE)
  async updateStatus(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: any,
  ) {
    const taskId = this.toObjectId(id);
    const currentUser = await this.getCurrentUser(req);
    const task = await this.tasksService.findOne({
      where: { _id: taskId } as any,
    });

    if (!task || task.assignedTo !== String(currentUser._id)) {
      throw new BadRequestException('Task not found');
    }

    const status = this.normalizeStatus(body?.status);
    const patch: Partial<Task> = { status };
    if (status === TaskStatus.COMPLETED || status === TaskStatus.SUBMITTED) {
      patch.completedAt = new Date().toISOString();
    }

    await this.tasksService.update({ _id: taskId } as any, patch as any);
    return {
      message: 'Task status updated successfully',
      status,
    };
  }
}
