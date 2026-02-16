import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@core/base/base.repository';
import { User } from './user.entity';
import { UserStatus } from '@shared/enums';

@Injectable()
export class UserRepository extends BaseRepository<User> {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {
        super(userRepository);
    }

    /**
     * Find user by email
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    /**
     * Find active users
     */
    async findActiveUsers(): Promise<User[]> {
        return this.userRepository.find({
            where: { status: UserStatus.ACTIVE },
        });
    }

    /**
     * Find user by ID including the password field (which has select: false)
     */
    async findByIdWithPassword(id: string): Promise<User | null> {
        return this.userRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.id = :id', { id })
            .getOne();
    }
}
