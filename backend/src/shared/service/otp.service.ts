import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';

import { Otp } from 'src/database/entities/otp.entity';

@Injectable()
export class OtpService {
    constructor(
        @InjectRepository(Otp)
        private readonly otpRepo: MongoRepository<Otp>,
    ) {}

    generateOtp(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async createOtp(email: string) {
        const code = this.generateOtp();

        const otp = this.otpRepo.create({
            email,
            code,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
        });

        await this.otpRepo.save(otp);

        // 👉 later integrate email service here
        console.log(`OTP for ${email}: ${code}`);

        return true;
    }

    async verifyOtp(email: string, code: string) {
        const otp = await this.otpRepo.findOne({
            where: { email, code },
            order: { createdAt: 'DESC' },
        });

        if (!otp) {
            throw new BadRequestException('Invalid OTP');
        }

        if (otp.expiresAt < new Date()) {
            throw new BadRequestException('OTP expired');
        }

        return true;
    }
}