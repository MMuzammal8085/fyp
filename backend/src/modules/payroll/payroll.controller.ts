import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';

import { Payroll } from 'src/database/entities/payroll.entity';
import { User } from 'src/database/entities/user.entity';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { PayrollStatus } from 'src/shared/enums/payroll.enums';
import { UserType } from 'src/shared/enums/user.enums';
import { JwtAuthGuard, RolesGuard } from 'src/shared/guards/roles.guard';
import { UserService } from '../user/user.service';
import { PayrollService } from './payroll.service';

@Controller('payroll')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollController {
  constructor(
    private readonly payrollService: PayrollService,
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

  private calcNetPay(
    baseSalary: number,
    allowance: number,
    deductions: number,
  ) {
    return (
      Number(baseSalary || 0) + Number(allowance || 0) - Number(deductions || 0)
    );
  }

  private normalizeStatus(status: any): PayrollStatus {
    const value = String(status ?? '')
      .trim()
      .toLowerCase();
    if (Object.values(PayrollStatus).includes(value as PayrollStatus)) {
      return value as PayrollStatus;
    }
    throw new BadRequestException('Invalid payroll status');
  }

  @Get()
  @Roles(UserType.HR)
  async list() {
    return await this.payrollService.find({
      order: { createdAt: 'DESC' } as any,
    });
  }

  @Post()
  @Roles(UserType.HR)
  async create(@Req() req: any, @Body() body: any) {
    await this.getCurrentUser(req);
    const employeeId = String(body?.employeeId ?? '').trim();
    const month = String(body?.month ?? '').trim();
    const baseSalary = Number(body?.baseSalary ?? 0);
    const allowance = Number(body?.allowance ?? 0);
    const deductions = Number(body?.deductions ?? 0);

    if (!employeeId) throw new BadRequestException('employeeId is required');
    if (!month) throw new BadRequestException('month is required');

    const employee = await this.userService.findOne({
      where: {
        _id: this.toObjectId(employeeId),
        role: UserType.EMPLOYEE,
      } as any,
    });
    if (!employee) {
      throw new BadRequestException('Employee not found');
    }

    const payroll = this.payrollService.create({
      employeeId,
      employeeName: employee.username,
      month,
      baseSalary,
      allowance,
      deductions,
      netPay: this.calcNetPay(baseSalary, allowance, deductions),
      status: this.normalizeStatus(body?.status ?? PayrollStatus.DRAFT),
      note: body?.note,
      paidAt: body?.paidAt,
    });

    const saved = await this.payrollService.save(payroll);
    return {
      message: 'Payroll created successfully',
      payroll: saved,
    };
  }

  @Patch(':id')
  @Roles(UserType.HR)
  async update(@Param('id') id: string, @Body() body: any) {
    const payrollId = this.toObjectId(id);
    const existing = await this.payrollService.findOne({
      where: { _id: payrollId } as any,
    });

    if (!existing) {
      throw new BadRequestException('Payroll not found');
    }

    const employeeId = body?.employeeId
      ? String(body.employeeId).trim()
      : existing.employeeId;
    const employee = await this.userService.findOne({
      where: {
        _id: this.toObjectId(employeeId),
        role: UserType.EMPLOYEE,
      } as any,
    });
    if (!employee) {
      throw new BadRequestException('Employee not found');
    }

    const baseSalary =
      body?.baseSalary !== undefined
        ? Number(body.baseSalary)
        : existing.baseSalary;
    const allowance =
      body?.allowance !== undefined
        ? Number(body.allowance)
        : existing.allowance;
    const deductions =
      body?.deductions !== undefined
        ? Number(body.deductions)
        : existing.deductions;

    const patch: Partial<Payroll> = {
      employeeId,
      employeeName: employee.username,
      month: body?.month ?? existing.month,
      baseSalary,
      allowance,
      deductions,
      netPay: this.calcNetPay(baseSalary, allowance, deductions),
    };

    if (body?.status !== undefined) {
      patch.status = this.normalizeStatus(body.status);
    }
    if (body?.note !== undefined) patch.note = body.note;
    if (body?.paidAt !== undefined) patch.paidAt = body.paidAt;

    await this.payrollService.update({ _id: payrollId } as any, patch as any);
    return {
      message: 'Payroll updated successfully',
      payroll: await this.payrollService.findOne({
        where: { _id: payrollId } as any,
      }),
    };
  }

  @Delete(':id')
  @Roles(UserType.HR)
  async remove(@Param('id') id: string) {
    const payrollId = this.toObjectId(id);
    const existing = await this.payrollService.findOne({
      where: { _id: payrollId } as any,
    });

    if (!existing) {
      throw new BadRequestException('Payroll not found');
    }

    await this.payrollService.deleteOne({ _id: payrollId } as any);
    return { message: 'Payroll deleted successfully' };
  }
}
