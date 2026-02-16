import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@core/base/base.repository';
import { Attachment } from './attachment.entity';

@Injectable()
export class AttachmentRepository extends BaseRepository<Attachment> {
    constructor(
        @InjectRepository(Attachment)
        private readonly attachmentRepository: Repository<Attachment>,
    ) {
        super(attachmentRepository);
    }

    /**
     * Find all attachments for a task, including uploader relation.
     */
    async findByTask(taskId: string): Promise<Attachment[]> {
        return this.attachmentRepository.find({
            where: { taskId },
            relations: { uploader: true },
            order: { createdAt: 'DESC' },
        });
    }
}
