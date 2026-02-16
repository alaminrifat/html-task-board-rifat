// Mock env config and S3 before any imports
jest.mock('@config/env-config.service', () => ({
    __esModule: true,
    default: {
        getValue: jest.fn().mockReturnValue('mock'),
        getAwsConfig: jest.fn().mockReturnValue({}),
    },
    envConfigService: {
        getValue: jest.fn().mockReturnValue('mock'),
        getAwsConfig: jest.fn().mockReturnValue({
            AWS_REGION: 'us-east-1',
            AWS_ACCESS_KEY_ID: 'key',
            AWS_SECRET_ACCESS_KEY: 'secret',
        }),
    },
}));
jest.mock('@config/s3.config', () => ({ s3Client: {} }));
jest.mock('@infrastructure/s3/s3.service', () => ({
    S3Service: jest.fn().mockImplementation(() => ({
        uploadFile: jest
            .fn()
            .mockResolvedValue('https://s3.example.com/file.pdf'),
        deleteFile: jest.fn().mockResolvedValue(undefined),
        getSignedUrl: jest
            .fn()
            .mockResolvedValue('https://s3.example.com/signed'),
    })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
    ForbiddenException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { AttachmentRepository } from './attachment.repository';
import { Attachment } from './attachment.entity';
import { S3Service } from '@infrastructure/s3/s3.service';
import { Task } from '@modules/tasks/task.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { ProjectRole } from '@shared/enums';

// ─── Mock Factories ─────────────────────────────────────────────────────────

const createMockAttachment = (
    overrides: Partial<Attachment> = {},
): Attachment =>
    ({
        id: 'attachment-1',
        taskId: 'task-1',
        uploaderId: 'user-1',
        fileName: 'test-file.pdf',
        fileUrl: 'https://s3.example.com/test-file.pdf',
        fileType: '.pdf',
        fileSize: 1024,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    }) as unknown as Attachment;

const createMockMember = (
    overrides: Partial<ProjectMember> = {},
): ProjectMember =>
    ({
        id: 'member-1',
        projectId: 'project-1',
        userId: 'user-1',
        projectRole: ProjectRole.MEMBER,
        ...overrides,
    }) as unknown as ProjectMember;

const createMockTask = (overrides: Partial<Task> = {}): Task =>
    ({
        id: 'task-1',
        projectId: 'project-1',
        ...overrides,
    }) as unknown as Task;

const createMockFile = (
    overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File =>
    ({
        originalname: 'report.pdf',
        mimetype: 'application/pdf',
        size: 5000,
        buffer: Buffer.from('file content'),
        fieldname: 'file',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
        ...overrides,
    }) as Express.Multer.File;

// ─── Test Suite ─────────────────────────────────────────────────────────────

describe('AttachmentsService', () => {
    let service: AttachmentsService;
    let attachmentRepository: Record<string, jest.Mock>;
    let s3Service: { uploadFile: jest.Mock; deleteFile: jest.Mock };
    let taskRepository: { findOne: jest.Mock };
    let memberRepository: { findOne: jest.Mock };

    beforeEach(async () => {
        attachmentRepository = {
            findByTask: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
        };

        s3Service = {
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
        };

        taskRepository = { findOne: jest.fn() };
        memberRepository = { findOne: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AttachmentsService,
                {
                    provide: AttachmentRepository,
                    useValue: attachmentRepository,
                },
                { provide: S3Service, useValue: s3Service },
                { provide: getRepositoryToken(Task), useValue: taskRepository },
                {
                    provide: getRepositoryToken(ProjectMember),
                    useValue: memberRepository,
                },
            ],
        }).compile();

        service = module.get<AttachmentsService>(AttachmentsService);
    });

    const userId = 'user-1';
    const projectId = 'project-1';
    const taskId = 'task-1';

    // ─── getAttachments ──────────────────────────────────────────────

    describe('getAttachments', () => {
        it('should return attachments for a task when user is a member', async () => {
            memberRepository.findOne.mockResolvedValue(createMockMember());
            const attachments = [createMockAttachment()];
            attachmentRepository.findByTask.mockResolvedValue(attachments);

            const result = await service.getAttachments(
                userId,
                projectId,
                taskId,
            );

            expect(result).toEqual(attachments);
            expect(attachmentRepository.findByTask).toHaveBeenCalledWith(
                taskId,
            );
        });

        it('should throw ForbiddenException when user is not a member', async () => {
            memberRepository.findOne.mockResolvedValue(null);

            await expect(
                service.getAttachments(userId, projectId, taskId),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ─── uploadAttachment ────────────────────────────────────────────

    describe('uploadAttachment', () => {
        it('should upload a file and create an attachment record', async () => {
            memberRepository.findOne.mockResolvedValue(createMockMember());
            taskRepository.findOne.mockResolvedValue(createMockTask());

            const file = createMockFile();
            const s3Url = 'https://s3.example.com/uploaded-file.pdf';
            s3Service.uploadFile.mockResolvedValue(s3Url);

            const created = createMockAttachment({ fileUrl: s3Url });
            attachmentRepository.create.mockResolvedValue(created);

            const result = await service.uploadAttachment(
                userId,
                projectId,
                taskId,
                file,
            );

            expect(result).toEqual(created);
            expect(s3Service.uploadFile).toHaveBeenCalledWith(
                file,
                'attachments',
            );
            expect(attachmentRepository.create).toHaveBeenCalledWith({
                taskId,
                uploaderId: userId,
                fileName: 'report.pdf',
                fileUrl: s3Url,
                fileType: '.pdf',
                fileSize: 5000,
            });
        });

        it('should throw ForbiddenException when user is not a member', async () => {
            memberRepository.findOne.mockResolvedValue(null);

            const file = createMockFile();

            await expect(
                service.uploadAttachment(userId, projectId, taskId, file),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException when task does not exist', async () => {
            memberRepository.findOne.mockResolvedValue(createMockMember());
            taskRepository.findOne.mockResolvedValue(null);

            const file = createMockFile();

            await expect(
                service.uploadAttachment(userId, projectId, taskId, file),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException when task belongs to a different project', async () => {
            memberRepository.findOne.mockResolvedValue(createMockMember());
            taskRepository.findOne.mockResolvedValue(
                createMockTask({ id: taskId, projectId: 'other-project' }),
            );

            const file = createMockFile();

            await expect(
                service.uploadAttachment(userId, projectId, taskId, file),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException when file size exceeds 10MB', async () => {
            memberRepository.findOne.mockResolvedValue(createMockMember());
            taskRepository.findOne.mockResolvedValue(createMockTask());

            const largeFile = createMockFile({ size: 11 * 1024 * 1024 });

            await expect(
                service.uploadAttachment(userId, projectId, taskId, largeFile),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when file type is not allowed', async () => {
            memberRepository.findOne.mockResolvedValue(createMockMember());
            taskRepository.findOne.mockResolvedValue(createMockTask());

            const badFile = createMockFile({
                originalname: 'malware.exe',
                mimetype: 'application/x-msdownload',
                size: 1000,
            });

            await expect(
                service.uploadAttachment(userId, projectId, taskId, badFile),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when no file is provided', async () => {
            memberRepository.findOne.mockResolvedValue(createMockMember());
            taskRepository.findOne.mockResolvedValue(createMockTask());

            await expect(
                service.uploadAttachment(
                    userId,
                    projectId,
                    taskId,
                    null as unknown as Express.Multer.File,
                ),
            ).rejects.toThrow(BadRequestException);
        });

        it('should accept PNG files', async () => {
            memberRepository.findOne.mockResolvedValue(createMockMember());
            taskRepository.findOne.mockResolvedValue(createMockTask());

            const pngFile = createMockFile({
                originalname: 'image.png',
                mimetype: 'image/png',
                size: 2000,
            });
            s3Service.uploadFile.mockResolvedValue(
                'https://s3.example.com/image.png',
            );
            attachmentRepository.create.mockResolvedValue(
                createMockAttachment({
                    fileName: 'image.png',
                    fileType: '.png',
                }),
            );

            const result = await service.uploadAttachment(
                userId,
                projectId,
                taskId,
                pngFile,
            );

            expect(result.fileType).toBe('.png');
        });

        it('should accept DOCX files by extension even if mimetype is generic', async () => {
            memberRepository.findOne.mockResolvedValue(createMockMember());
            taskRepository.findOne.mockResolvedValue(createMockTask());

            const docxFile = createMockFile({
                originalname: 'document.docx',
                mimetype:
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                size: 3000,
            });
            s3Service.uploadFile.mockResolvedValue(
                'https://s3.example.com/document.docx',
            );
            attachmentRepository.create.mockResolvedValue(
                createMockAttachment({
                    fileName: 'document.docx',
                    fileType: '.docx',
                }),
            );

            const result = await service.uploadAttachment(
                userId,
                projectId,
                taskId,
                docxFile,
            );

            expect(result).toBeDefined();
        });
    });

    // ─── downloadAttachment ──────────────────────────────────────────

    describe('downloadAttachment', () => {
        const attachmentId = 'attachment-1';

        it('should return file URL and name when user is a member', async () => {
            memberRepository.findOne.mockResolvedValue(createMockMember());
            const attachment = createMockAttachment();
            attachmentRepository.findById.mockResolvedValue(attachment);

            const result = await service.downloadAttachment(
                userId,
                projectId,
                attachmentId,
            );

            expect(result).toEqual({
                fileUrl: attachment.fileUrl,
                fileName: attachment.fileName,
            });
        });

        it('should throw ForbiddenException when user is not a member', async () => {
            memberRepository.findOne.mockResolvedValue(null);

            await expect(
                service.downloadAttachment(userId, projectId, attachmentId),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException when attachment does not exist', async () => {
            memberRepository.findOne.mockResolvedValue(createMockMember());
            attachmentRepository.findById.mockResolvedValue(null);

            await expect(
                service.downloadAttachment(userId, projectId, attachmentId),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ─── deleteAttachment ────────────────────────────────────────────

    describe('deleteAttachment', () => {
        const attachmentId = 'attachment-1';

        it('should delete attachment when user is the uploader', async () => {
            memberRepository.findOne.mockResolvedValue(createMockMember());
            const attachment = createMockAttachment({ uploaderId: userId });
            attachmentRepository.findById.mockResolvedValue(attachment);
            s3Service.deleteFile.mockResolvedValue(undefined);
            attachmentRepository.delete.mockResolvedValue(true);

            await service.deleteAttachment(userId, projectId, attachmentId);

            expect(s3Service.deleteFile).toHaveBeenCalledWith(
                attachment.fileUrl,
            );
            expect(attachmentRepository.delete).toHaveBeenCalledWith(
                attachmentId,
            );
        });

        it('should delete attachment when user is the project owner', async () => {
            const ownerMember = createMockMember({
                userId: 'owner-1',
                projectRole: ProjectRole.OWNER,
            });
            memberRepository.findOne.mockResolvedValue(ownerMember);
            const attachment = createMockAttachment({
                uploaderId: 'another-user',
            });
            attachmentRepository.findById.mockResolvedValue(attachment);
            s3Service.deleteFile.mockResolvedValue(undefined);
            attachmentRepository.delete.mockResolvedValue(true);

            await service.deleteAttachment('owner-1', projectId, attachmentId);

            expect(s3Service.deleteFile).toHaveBeenCalled();
            expect(attachmentRepository.delete).toHaveBeenCalledWith(
                attachmentId,
            );
        });

        it('should throw ForbiddenException when user is neither uploader nor owner', async () => {
            const otherMember = createMockMember({
                userId: 'other-user',
                projectRole: ProjectRole.MEMBER,
            });
            memberRepository.findOne.mockResolvedValue(otherMember);
            const attachment = createMockAttachment({
                uploaderId: 'original-uploader',
            });
            attachmentRepository.findById.mockResolvedValue(attachment);

            await expect(
                service.deleteAttachment('other-user', projectId, attachmentId),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw ForbiddenException when user is not a project member', async () => {
            memberRepository.findOne.mockResolvedValue(null);

            await expect(
                service.deleteAttachment(userId, projectId, attachmentId),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException when attachment does not exist', async () => {
            memberRepository.findOne.mockResolvedValue(createMockMember());
            attachmentRepository.findById.mockResolvedValue(null);

            await expect(
                service.deleteAttachment(userId, projectId, attachmentId),
            ).rejects.toThrow(NotFoundException);
        });
    });
});
