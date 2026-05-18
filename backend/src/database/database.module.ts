// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';


@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            useFactory: async (): Promise<TypeOrmModuleOptions> => ({
                type: 'mongodb',
                url: process.env.MONGODB_URI,
                autoLoadEntities: true,
                synchronize: true, // Set to false to avoid index collision errors in existing DB
            }),
        }),
    ],
})
export class DatabaseModule { }