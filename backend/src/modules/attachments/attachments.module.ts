import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { AttachmentRepository } from './attachment.repository';
import { Attachment } from './attachment.entity';
import { Task } from '@modules/tasks/task.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { S3Module } from '@infrastructure/s3/s3.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Attachment, Task, ProjectMember]),
        S3Module,
    ],
    controllers: [AttachmentsController],
    providers: [AttachmentsService, AttachmentRepository],
    exports: [AttachmentsService, AttachmentRepository],
})
export class AttachmentsModule {}
