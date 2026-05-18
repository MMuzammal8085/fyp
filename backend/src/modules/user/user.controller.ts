import {
  Body,
  Controller,
  Post,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Otp } from 'src/database/entities/otp.entity';
import { UserService } from './user.service';
import { CreateUserDto } from './user.dto';
import { MailService } from 'src/shared/service/mail.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly mailService: MailService,
    @InjectRepository(Otp)
    private readonly otpRepo: Repository<Otp>,
  ) {}

  // 🔹 Helper: Generate OTP
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 🔹 SIGNUP
  @Post('signup')
  async signup(@Body() dto: CreateUserDto) {
    const { username, email, password, role } = dto;

    const normalizedEmail = email.toLowerCase().trim();

    // 🔍 Check existing user
    const existingUser = await this.userService.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 👤 Create user (inactive)
    const user = this.userService.create({
      username,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      isActive: false,
    });

    await this.userService.save(user);

    // 🔢 Generate OTP
    const code = this.generateOtp();

    const otp = this.otpRepo.create({
      email: normalizedEmail,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    });

    await this.otpRepo.save(otp);

    await this.mailService.sendOtp(email, code);

    return {
      message: 'OTP sent to email',
      email: normalizedEmail,
      ...(process.env.NODE_ENV !== 'production' ? { otp: code } : {}),
    };
  }

  // 🔹 VERIFY OTP
  @Post('verify-otp')
  async verifyOtp(@Body() body: { code: string }) {
    const code = body.code?.trim();
    if (!code) {
      throw new BadRequestException('OTP code is required');
    }

    const [otp] = await this.otpRepo.find({
      where: { code },
      order: { createdAt: 'DESC' },
      take: 1,
    });

    if (!otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (otp.expiresAt < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    const email = otp.email.toLowerCase().trim();

    // ✅ Activate user
    await this.userService.update({ email }, { isActive: true });

    // 🧹 Optional: delete OTP after use
    await this.otpRepo.delete({ _id: otp._id });

    return {
      message: 'Account verified successfully',
    };
  }
}
