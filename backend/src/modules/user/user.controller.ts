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
import { randomBytes } from 'crypto';

import { Otp } from 'src/database/entities/otp.entity';
import { UserService } from './user.service';
import {
  CreateUserDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './user.dto';
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
      purpose: 'email_verification',
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
      where: { code, purpose: 'email_verification' },
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

  // 🔹 FORGOT PASSWORD
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const genericMessage =
      'If an account exists for this email, a reset link has been sent.';

    const user = await this.userService.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return { message: genericMessage };
    }

    const token = randomBytes(32).toString('hex');

    await this.otpRepo.delete({
      email: normalizedEmail,
      purpose: 'password_reset',
    } as any);

    const resetOtp = this.otpRepo.create({
      email: normalizedEmail,
      code: token,
      purpose: 'password_reset',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await this.otpRepo.save(resetOtp);

    const frontendBase = (
      process.env.FRONTEND_URL ?? 'http://localhost:5173'
    ).replace(/\/+$/, '');
    const resetLink = `${frontendBase}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(normalizedEmail)}`;

    await this.mailService.sendPasswordReset(normalizedEmail, resetLink);

    // eslint-disable-next-line no-console
    console.log(
      `[UserController] Password reset token generated for ${normalizedEmail}`,
    );

    return {
      message: genericMessage,
      ...(process.env.NODE_ENV !== 'production'
        ? { resetLink, token }
        : {}),
    };
  }

  // 🔹 RESET PASSWORD
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const token = dto.token?.trim();

    if (!token) {
      throw new BadRequestException('Reset token is required');
    }

    const [resetRecord] = await this.otpRepo.find({
      where: {
        email: normalizedEmail,
        code: token,
        purpose: 'password_reset',
      },
      order: { createdAt: 'DESC' },
      take: 1,
    });

    if (!resetRecord) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (resetRecord.expiresAt < new Date()) {
      await this.otpRepo.delete({ _id: resetRecord._id });
      throw new BadRequestException('Reset token has expired');
    }

    const user = await this.userService.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    await this.userService.update(
      { email: normalizedEmail },
      { password: hashedPassword },
    );

    await this.otpRepo.delete({ _id: resetRecord._id });

    return { message: 'Password updated successfully' };
  }
}
