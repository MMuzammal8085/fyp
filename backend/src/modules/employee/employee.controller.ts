import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { UserType } from 'src/shared/enums/user.enums';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { JwtAuthGuard, RolesGuard } from 'src/shared/guards/roles.guard';
import { EmployeeService } from './employee.service';
import * as bcrypt from 'bcrypt';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  private toObjectId(id: string): ObjectId {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid employee id');
    }
    return new ObjectId(id);
  }

  @Get()
  @Roles(UserType.HR)
  async list() {
    const employees = await this.employeeService.find({
      where: { role: UserType.EMPLOYEE } as any,
      order: { createdAt: 'DESC' } as any,
    });
    return employees;
  }

  @Post()
  @Roles(UserType.HR)
  async create(@Body() body: any) {
    const username = String(body?.username ?? '').trim();
    const email = String(body?.email ?? '')
      .trim()
      .toLowerCase();
    const password = String(body?.password ?? '').trim();

    if (!username) throw new BadRequestException('username is required');
    if (!email) throw new BadRequestException('email is required');
    if (!password) throw new BadRequestException('password is required');

    const existing = await this.employeeService.findOne({
      where: { email } as any,
    });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const employee = this.employeeService.create({
      username,
      email,
      password: hashedPassword,
      role: UserType.EMPLOYEE,
      isActive: true,
    });

    const saved = await this.employeeService.save(employee);
    return {
      message: 'Employee created successfully',
      employee: saved,
    };
  }

  @Delete(':id')
  @Roles(UserType.HR)
  async remove(@Param('id') id: string) {
    const _id = this.toObjectId(id);
    const existing = await this.employeeService.findOne({
      where: { _id } as any,
    });

    if (!existing || existing.role !== UserType.EMPLOYEE) {
      throw new NotFoundException('Employee not found');
    }

    await this.employeeService.deleteOne({ _id } as any);
    return { message: 'Employee removed successfully' };
  }
}
