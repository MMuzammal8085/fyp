import {
    Entity,
    ObjectIdColumn,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity('otps')
export class Otp {
    @ObjectIdColumn()
    _id: ObjectId;

    @Index()
    @Column()
    email: string;

    @Column()
    code: string;

    @Column({ default: 'email_verification' })
    purpose: 'email_verification' | 'password_reset';

    @Column()
    expiresAt: Date;

    @CreateDateColumn()
    createdAt: Date;
}