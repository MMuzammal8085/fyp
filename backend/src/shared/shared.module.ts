import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpService } from './service/otp.service';
import { MailService } from './service/mail.service';
import { CloudinaryService } from './service/cloudinary.service';
import { Otp } from 'src/database/entities/otp.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Otp])],
  providers: [OtpService, MailService, CloudinaryService],
  exports: [OtpService, MailService, CloudinaryService, TypeOrmModule],
})
export class SharedModule {}
