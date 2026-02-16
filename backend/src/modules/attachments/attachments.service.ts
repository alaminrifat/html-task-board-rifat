import {
    Injectable,
    ForbiddenException,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '@core/base/base.service';
import { Attachment } from './attachment.entity';
import { AttachmentRepository } from './attachment.repository';
import { S3Service } from '@infrastructure/s3/s3.service';
import { Task } from '@modules/tasks/task.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { ProjectRole } from '@shared/enums';

/** Allowed MIME types for attachment upload */
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
];

/** Allowed file extensions (fallback check) */
const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.xlsx'];

/** Maximum file size: 10 MB */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

@Injectable()
export class AttachmentsService extends BaseService<Attachment> {
    constructor(
        private readonly attachmentRepository: AttachmentRepository,
        private readonly s3Service: S3Service,
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,
        @InjectRepository(ProjectMember)
        private readonly memberRepository: Repository<ProjectMember>,
    ) {
        super(attachmentRepository, 'Attachment');
    }

    /**
     * List all attachments for a task.
     * Requires user to be a project member.
     */
    async getAttachments(
        userId: string,
        projectId: string,
        taskId: string,
    ): Promise<Attachment[]> {
        await this.validateMembership(userId, projectId);
        return this.attachmentRepository.findByTask(taskId);
    }

    /**
     * Upload a file attachment to a task.
     * Validates membership, task ownership by project, file type, and size.
     */
    async uploadAttachment(
        userId: string,
        projectId: string,
        taskId: string,
        file: Express.Multer.File,
    ): Promise<Attachment> {
        await this.validateMembership(userId, projectId);

        // Validate the task belongs to the project
        await this.validateTaskInProject(taskId, projectId);

        // Validate file
        this.validateFile(file);

        // Upload to S3
        const fileUrl = await this.s3Service.uploadFile(file, 'attachments');

        // Extract file extension for fileType
        const fileExtension = this.getFileExtension(file.originalname);

        // Create attachment record
        return this.attachmentRepository.create({
            taskId,
            uploaderId: userId,
            fileName: file.originalname,
            fileUrl,
            fileType: fileExtension,
            fileSize: file.size,
        });
    }

    /**
     * Get the download URL for an attachment.
     * Validates membership.
     */
    async downloadAttachment(
        userId: string,
        projectId: string,
        attachmentId: string,
    ): Promise<{ fileUrl: string; fileName: string }> {
        await this.validateMembership(userId, projectId);

        const attachment =
            await this.attachmentRepository.findById(attachmentId);

        if (!attachment) {
            throw new NotFoundException(
                `Attachment with ID ${attachmentId} not found`,
            );
        }

        return {
            fileUrl: attachment.fileUrl,
            fileName: attachment.fileName,
        };
    }

    /**
     * Delete an attachment.
     * Only the uploader or the project owner may delete.
     */
    async deleteAttachment(
        userId: string,
        projectId: string,
        attachmentId: string,
    ): Promise<void> {
        const member = await this.validateMembership(userId, projectId);

        const attachment =
            await this.attachmentRepository.findById(attachmentId);

        if (!attachment) {
            throw new NotFoundException(
                `Attachment with ID ${attachmentId} not found`,
            );
        }

        // Only the uploader or project owner can delete
        const isUploader = attachment.uploaderId === userId;
        const isOwner = member.projectRole === ProjectRole.OWNER;

        if (!isUploader && !isOwner) {
            throw new ForbiddenException(
                'Only the uploader or project owner can delete this attachment',
            );
        }

        // Delete from S3
        await this.s3Service.deleteFile(attachment.fileUrl);

        // Delete from database
        await this.attachmentRepository.delete(attachmentId);
    }

    // ─── Private Helpers ──────────────────────────────────────────

    /**
     * Verify the user is a member of the project (any role).
     */
    private async validateMembership(
        userId: string,
        projectId: string,
    ): Promise<ProjectMember> {
        const member = await this.memberRepository.findOne({
            where: { userId, projectId },
        });

        if (!member) {
            throw new ForbiddenException(
                'You are not a member of this project',
            );
        }

        return member;
    }

    /**
     * Verify the task belongs to the given project.
     */
    private async validateTaskInProject(
        taskId: string,
        projectId: string,
    ): Promise<Task> {
        const task = await this.taskRepository.findOne({
            where: { id: taskId },
        });

        if (!task) {
            throw new NotFoundException(`Task with ID ${taskId} not found`);
        }

        if (task.projectId !== projectId) {
            throw new NotFoundException(
                `Task with ID ${taskId} not found in this project`,
            );
        }

        return task;
    }

    /**
     * Validate file type and size.
     */
    private validateFile(file: Express.Multer.File): void {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            throw new BadRequestException(
                'File size exceeds maximum allowed size of 10MB',
            );
        }

        // Validate by MIME type
        const isMimeAllowed = ALLOWED_MIME_TYPES.includes(file.mimetype);

        // Fallback: validate by extension
        const extension = this.getFileExtension(
            file.originalname,
        ).toLowerCase();
        const isExtensionAllowed = ALLOWED_EXTENSIONS.includes(extension);

        if (!isMimeAllowed && !isExtensionAllowed) {
            throw new BadRequestException(
                'File type not allowed. Allowed types: PDF, PNG, JPG, JPEG, DOCX, XLSX',
            );
        }
    }

    /**
     * Extract file extension from filename.
     */
    private getFileExtension(filename: string): string {
        const lastDot = filename.lastIndexOf('.');
        if (lastDot === -1) {
            return '';
        }
        return filename.substring(lastDot);
    }
}
