import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JWTMiddleware } from './shared/middleware/jwt.middleware';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { InterviewModule } from './modules/interview/interview.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { JobDescriptionModule } from './modules/job-description/job-description.module';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const nodeEnv =
          configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV;

        if (!secret && nodeEnv === 'production') {
          throw new Error('JWT_SECRET is required in production');
        }

        return {
          secret: secret ?? 'FYP_SECRET_KEY',
          signOptions: { expiresIn: '1d' },
        };
      },
    }),
    DatabaseModule,
    UserModule,
    AuthModule,
    InterviewModule,
    EmployeeModule,
    AttendanceModule,
    TasksModule,
    PayrollModule,
    JobDescriptionModule,
  ],
  providers: [JWTMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JWTMiddleware)
      .exclude('auth/login', 'user/signup', 'user/verify-otp')
      .forRoutes('*');
  }
}
