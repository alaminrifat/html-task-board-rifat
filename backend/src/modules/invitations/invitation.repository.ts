import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@core/base/base.repository';
import { Invitation } from './invitation.entity';
import { InvitationStatus } from '@shared/enums';

@Injectable()
export class InvitationRepository extends BaseRepository<Invitation> {
    constructor(
        @InjectRepository(Invitation)
        private readonly invitationRepository: Repository<Invitation>,
    ) {
        super(invitationRepository);
    }

    /**
     * Find all invitations for a project with relations loaded
     */
    async findByProject(projectId: string): Promise<Invitation[]> {
        return this.invitationRepository.find({
            where: { projectId },
            relations: { project: true, inviter: true },
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Find a pending invitation by its unique token
     */
    async findByToken(token: string): Promise<Invitation | null> {
        return this.invitationRepository.findOne({
            where: { token, status: InvitationStatus.PENDING },
            relations: { project: true, inviter: true },
        });
    }
}
