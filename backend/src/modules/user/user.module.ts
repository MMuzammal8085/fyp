// src/user/user.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from 'src/database/entities/user.entity';
import { SharedModule } from 'src/shared/shared.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        SharedModule,
        // ❌ REMOVE AuthModule
    ],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService], // ✅ used by AuthModule
})
export class UserModule {}