// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Auth } from 'src/database/entities/auth.entity';
import { UserModule } from '../user/user.module';
import { JwtStrategy } from 'src/shared/strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auth]),
    PassportModule,
    UserModule,

  
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'FYP_SECRET_KEY',
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [AuthController],

  providers: [
    AuthService,
    JwtStrategy, 
  ],
  exports: [
    AuthService,
    JwtModule, 
  ],
})
export class AuthModule {}
