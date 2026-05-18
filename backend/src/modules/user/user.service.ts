import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/database/entities/user.entity';
import { GenericEntityService } from 'src/shared/service/generic.entity.service';

@Injectable()
export class UserService extends GenericEntityService<User> {
    constructor(
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) {
        super(userRepo);
    }
}