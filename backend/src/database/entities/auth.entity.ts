import {
    Entity,
    ObjectIdColumn,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity('auth')
export class Auth {
    @ObjectIdColumn()
    _id: ObjectId;

    @Index()
    @Column()
    userId: ObjectId;

    @Column()
    accessToken: string;

    @Column({ nullable: true })
    refreshToken?: string;

    @Column({ default: true })
    isValid: boolean;

    @CreateDateColumn()
    createdAt: Date;
}