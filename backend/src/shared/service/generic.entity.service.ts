import { Injectable } from '@nestjs/common';
import {
    DeepPartial,
    FindManyOptions,
    FindOneOptions,
    FindOptionsWhere,
    ObjectId,
    ObjectLiteral,
    Repository,
} from 'typeorm';

@Injectable()
export class GenericEntityService<T extends ObjectLiteral> {
    protected repository: Repository<T>;

    constructor(repository: Repository<T>) {
        this.repository = repository;
    }

    async find(options?: FindManyOptions<T>) {
        return await this.repository.find(options ? options : {});
    }

    async findOne(options?: FindOneOptions<T>): Promise<T> {
        return (await this.repository.findOne(options ? options : {})) as T;
    }

    async findWithCount(options?: FindManyOptions<T>) {
        return await this.repository.findAndCount(options ? options : {});
    }

    async save(options: DeepPartial<T>) {
        return await this.repository.save(options);
    }

    async saveMultiple(options: DeepPartial<T>[]) {
        return await this.repository.save(options);
    }

    async softDelete(options: FindOptionsWhere<T> | FindOptionsWhere<T>[]) {
        return await this.repository.softDelete(options);
    }

    async deleteOne(filter: any) {
        return await this.repository.delete(filter);
    }

    create(options: DeepPartial<T>) {
        return this.repository.create(options);
    }

    async update(
        criteria:
            | string
            | number
            | FindOptionsWhere<T>
            | FindOptionsWhere<T>[]
            | Date
            | ObjectId
            | string[]
            | number[]
            | Date[]
            | ObjectId[],
        partialEntity: DeepPartial<T>,
    ) {
        return await this.repository.update(criteria, partialEntity as any);
    }
}
