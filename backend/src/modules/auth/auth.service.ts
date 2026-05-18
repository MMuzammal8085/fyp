import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auth } from 'src/database/entities/auth.entity';
import { GenericEntityService } from 'src/shared/service/generic.entity.service';

@Injectable()
export class AuthService extends GenericEntityService<Auth> {
    constructor(
        @InjectRepository(Auth)
        private authRepo: Repository<Auth>,
    ) {
        super(authRepo);
    }
}