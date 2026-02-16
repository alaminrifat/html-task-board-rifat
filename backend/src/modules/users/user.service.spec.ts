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
        ensureValues: jest.fn().mockReturnThis(),
    },
}));
jest.mock('@config/s3.config', () => ({ s3Client: {} }));
jest.mock('@infrastructure/s3/s3.service', () => ({
    S3Service: jest.fn().mockImplementation(() => ({
        uploadFile: jest
            .fn()
            .mockResolvedValue('https://s3.example.com/avatar.jpg'),
        deleteFile: jest.fn().mockResolvedValue(undefined),
        getSignedUrl: jest
            .fn()
            .mockResolvedValue('https://s3.example.com/signed'),
    })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';

import { UserService } from './user.service';
import { UserDevice } from './entities/user-device.entity';
import { UserRepository } from './user.repository';
import { I18nHelper, PasswordUtil } from 'src/core/utils';
import { S3Service } from '@infrastructure/s3/s3.service';
import { UserStatus, UserRole } from '@shared/enums';

// Mock PasswordUtil static methods at the module level
jest.mock('src/core/utils/password.util', () => ({
    PasswordUtil: {
        hash: jest.fn().mockResolvedValue('mocked-hashed-password'),
        compare: jest.fn().mockResolvedValue(true),
    },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockUserRepository() {
    return {
        findById: jest.fn(),
        findByEmail: jest.fn(),
        findActiveUsers: jest.fn(),
        findByIdWithPassword: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest
            .fn()
            .mockImplementation((data) =>
                Promise.resolve({ ...data, id: data.id ?? 'new-id' }),
            ),
        update: jest
            .fn()
            .mockImplementation((id, data) => Promise.resolve({ id, ...data })),
        softDelete: jest.fn().mockResolvedValue(true),
        delete: jest.fn().mockResolvedValue(true),
        count: jest.fn().mockResolvedValue(0),
    };
}

function createMockDeviceRepository() {
    return {
        findOne: jest.fn(),
        create: jest
            .fn()
            .mockImplementation((data) => ({ ...data, id: 'device-id' })),
        save: jest
            .fn()
            .mockImplementation((entity) =>
                Promise.resolve({ ...entity, id: entity.id ?? 'device-id' }),
            ),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('UserService', () => {
    let service: UserService;
    let userRepository: ReturnType<typeof createMockUserRepository>;
    let userDeviceRepository: ReturnType<typeof createMockDeviceRepository>;
    let i18nHelper: { t: jest.Mock };
    let s3Service: { uploadFile: jest.Mock };

    beforeEach(async () => {
        userRepository = createMockUserRepository();
        userDeviceRepository = createMockDeviceRepository();

        i18nHelper = {
            t: jest.fn().mockImplementation((key: string) => key),
        };

        s3Service = {
            uploadFile: jest
                .fn()
                .mockResolvedValue('https://s3.example.com/avatars/avatar.png'),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: UserRepository, useValue: userRepository },
                { provide: I18nHelper, useValue: i18nHelper },
                { provide: S3Service, useValue: s3Service },
                {
                    provide: getRepositoryToken(UserDevice),
                    useValue: userDeviceRepository,
                },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // getProfile
    // ═══════════════════════════════════════════════════════════════════════

    describe('getProfile', () => {
        it('should return user profile without sensitive fields', async () => {
            const mockUser = {
                id: 'u1',
                fullName: 'John Doe',
                email: 'john@test.com',
                role: UserRole.TEAM_MEMBER,
                status: UserStatus.ACTIVE,
                password: 'hashed-secret',
                refreshToken: 'secret-token',
            };
            userRepository.findById.mockResolvedValue({ ...mockUser });

            const result = await service.getProfile('u1');

            expect(result.id).toBe('u1');
            expect(result.fullName).toBe('John Doe');
            expect((result as any).password).toBeUndefined();
            expect((result as any).refreshToken).toBeUndefined();
        });

        it('should throw NotFoundException when user does not exist', async () => {
            userRepository.findById.mockResolvedValue(null);

            await expect(service.getProfile('missing')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // updateProfile
    // ═══════════════════════════════════════════════════════════════════════

    describe('updateProfile', () => {
        it('should update firstName, lastName, and compute fullName', async () => {
            const existingUser = {
                id: 'u1',
                firstName: 'John',
                lastName: 'Doe',
                fullName: 'John Doe',
                email: 'john@test.com',
                role: UserRole.TEAM_MEMBER,
            };
            userRepository.findById.mockResolvedValue(existingUser);
            userRepository.update.mockResolvedValue({
                ...existingUser,
                firstName: 'Jane',
                lastName: 'Smith',
                fullName: 'Jane Smith',
            });

            await service.updateProfile('u1', {
                firstName: 'Jane',
                lastName: 'Smith',
            });

            expect(userRepository.update).toHaveBeenCalledWith(
                'u1',
                expect.objectContaining({
                    fullName: 'Jane Smith',
                }),
            );
        });

        it('should only update provided fields, keeping existing values', async () => {
            const existingUser = {
                id: 'u1',
                firstName: 'John',
                lastName: 'Doe',
                fullName: 'John Doe',
                email: 'john@test.com',
                role: UserRole.TEAM_MEMBER,
            };
            userRepository.findById.mockResolvedValue(existingUser);
            userRepository.update.mockResolvedValue({
                ...existingUser,
                firstName: 'Jane',
                fullName: 'Jane Doe',
            });

            await service.updateProfile('u1', { firstName: 'Jane' });

            expect(userRepository.update).toHaveBeenCalledWith(
                'u1',
                expect.objectContaining({
                    fullName: 'Jane Doe',
                }),
            );
        });

        it('should throw NotFoundException if user does not exist', async () => {
            userRepository.findById.mockResolvedValue(null);

            await expect(
                service.updateProfile('missing', { firstName: 'X' }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should remove sensitive fields from the result', async () => {
            const existingUser = {
                id: 'u1',
                firstName: 'John',
                lastName: 'Doe',
                fullName: 'John Doe',
            };
            userRepository.findById.mockResolvedValue(existingUser);
            userRepository.update.mockResolvedValue({
                ...existingUser,
                password: 'hashed',
                refreshToken: 'token',
            });

            const result = await service.updateProfile('u1', {
                firstName: 'J',
            });

            expect((result as any).password).toBeUndefined();
            expect((result as any).refreshToken).toBeUndefined();
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // uploadAvatar
    // ═══════════════════════════════════════════════════════════════════════

    describe('uploadAvatar', () => {
        const validFile: Express.Multer.File = {
            fieldname: 'avatar',
            originalname: 'avatar.png',
            encoding: '7bit',
            mimetype: 'image/png',
            size: 1024 * 1024, // 1MB
            buffer: Buffer.from('image-data'),
            stream: null as any,
            destination: '',
            filename: '',
            path: '',
        };

        it('should upload file to S3 and update user avatarUrl', async () => {
            userRepository.findById.mockResolvedValue({
                id: 'u1',
                fullName: 'User',
            });
            userRepository.update.mockResolvedValue({
                id: 'u1',
                avatarUrl: 'https://s3.example.com/avatars/avatar.png',
            });

            await service.uploadAvatar('u1', validFile);

            expect(s3Service.uploadFile).toHaveBeenCalledWith(
                validFile,
                'avatars',
            );
            expect(userRepository.update).toHaveBeenCalledWith(
                'u1',
                expect.objectContaining({
                    avatarUrl: 'https://s3.example.com/avatars/avatar.png',
                }),
            );
        });

        it('should throw BadRequestException when no file is provided', async () => {
            await expect(
                service.uploadAvatar('u1', null as any),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException for non-image file type', async () => {
            const pdfFile = {
                ...validFile,
                mimetype: 'application/pdf',
            };

            await expect(
                service.uploadAvatar('u1', pdfFile as Express.Multer.File),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException for file exceeding 5MB', async () => {
            const largeFile = {
                ...validFile,
                size: 10 * 1024 * 1024, // 10MB
            };

            await expect(
                service.uploadAvatar('u1', largeFile as Express.Multer.File),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // changeMyPassword
    // ═══════════════════════════════════════════════════════════════════════

    describe('changeMyPassword', () => {
        beforeEach(() => {
            (PasswordUtil.compare as jest.Mock).mockResolvedValue(true);
            (PasswordUtil.hash as jest.Mock).mockResolvedValue(
                'mocked-hashed-password',
            );
        });

        it('should update password when current password is valid', async () => {
            userRepository.findByIdWithPassword.mockResolvedValue({
                id: 'u1',
                password: 'hashed-current',
            });

            await service.changeMyPassword('u1', {
                currentPassword: 'current123',
                newPassword: 'newPass456',
            });

            expect(PasswordUtil.compare).toHaveBeenCalledWith(
                'current123',
                'hashed-current',
            );
            expect(PasswordUtil.hash).toHaveBeenCalledWith('newPass456');
            expect(userRepository.update).toHaveBeenCalledWith(
                'u1',
                expect.objectContaining({
                    password: 'mocked-hashed-password',
                }),
            );
        });

        it('should throw NotFoundException when user is not found', async () => {
            userRepository.findByIdWithPassword.mockResolvedValue(null);

            await expect(
                service.changeMyPassword('missing', {
                    currentPassword: 'old',
                    newPassword: 'new',
                }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException when current password is invalid', async () => {
            userRepository.findByIdWithPassword.mockResolvedValue({
                id: 'u1',
                password: 'hashed-current',
            });
            (PasswordUtil.compare as jest.Mock).mockResolvedValue(false);

            await expect(
                service.changeMyPassword('u1', {
                    currentPassword: 'wrong',
                    newPassword: 'newPass',
                }),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // updateNotificationPrefs
    // ═══════════════════════════════════════════════════════════════════════

    describe('updateNotificationPrefs', () => {
        it('should update notification preferences', async () => {
            userRepository.findById.mockResolvedValue({
                id: 'u1',
                notifyTaskAssigned: true,
                notifyNewComment: true,
            });
            userRepository.update.mockResolvedValue({
                id: 'u1',
                notifyTaskAssigned: false,
                notifyNewComment: false,
            });

            await service.updateNotificationPrefs('u1', {
                notifyTaskAssigned: false,
                notifyNewComment: false,
            });

            expect(userRepository.update).toHaveBeenCalledWith(
                'u1',
                expect.objectContaining({
                    notifyTaskAssigned: false,
                    notifyNewComment: false,
                }),
            );
        });

        it('should throw NotFoundException when user does not exist', async () => {
            userRepository.findById.mockResolvedValue(null);

            await expect(
                service.updateNotificationPrefs('missing', {
                    notifyTaskAssigned: true,
                }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should remove sensitive fields from result', async () => {
            userRepository.findById.mockResolvedValue({ id: 'u1' });
            userRepository.update.mockResolvedValue({
                id: 'u1',
                password: 'hashed',
                refreshToken: 'tok',
                notifyTaskAssigned: true,
            });

            const result = await service.updateNotificationPrefs('u1', {
                notifyTaskAssigned: true,
            });

            expect((result as any).password).toBeUndefined();
            expect((result as any).refreshToken).toBeUndefined();
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // registerDevice
    // ═══════════════════════════════════════════════════════════════════════

    describe('registerDevice', () => {
        it('should create a new device when token does not exist', async () => {
            userRepository.findById.mockResolvedValue({ id: 'u1' });
            userDeviceRepository.findOne.mockResolvedValue(null);

            await service.registerDevice('u1', {
                token: 'new-push-token',
                platform: 'ios',
                deviceName: 'iPhone 15',
            });

            expect(userDeviceRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'u1',
                    token: 'new-push-token',
                    platform: 'ios',
                }),
            );
            expect(userDeviceRepository.save).toHaveBeenCalled();
        });

        it('should update existing device when token already exists', async () => {
            userRepository.findById.mockResolvedValue({ id: 'u1' });
            const existingDevice = {
                id: 'd1',
                userId: 'u2',
                token: 'existing-token',
                platform: 'android',
                deviceName: 'Old Phone',
            };
            userDeviceRepository.findOne.mockResolvedValue(existingDevice);

            await service.registerDevice('u1', {
                token: 'existing-token',
                platform: 'ios',
                deviceName: 'New Phone',
            });

            expect(userDeviceRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'u1',
                    platform: 'ios',
                    deviceName: 'New Phone',
                }),
            );
        });

        it('should throw NotFoundException when user does not exist', async () => {
            userRepository.findById.mockResolvedValue(null);

            await expect(
                service.registerDevice('missing', {
                    token: 'token',
                    platform: 'ios',
                }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // unregisterDevice
    // ═══════════════════════════════════════════════════════════════════════

    describe('unregisterDevice', () => {
        it('should delete the device when owned by the user', async () => {
            userDeviceRepository.findOne.mockResolvedValue({
                id: 'd1',
                userId: 'u1',
                token: 'tok',
            });

            await service.unregisterDevice('u1', 'd1');

            expect(userDeviceRepository.delete).toHaveBeenCalledWith('d1');
        });

        it('should throw NotFoundException when device does not exist', async () => {
            userDeviceRepository.findOne.mockResolvedValue(null);

            await expect(
                service.unregisterDevice('u1', 'missing-device'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException when device is not owned by user', async () => {
            userDeviceRepository.findOne.mockResolvedValue({
                id: 'd1',
                userId: 'u2', // different user
                token: 'tok',
            });

            await expect(service.unregisterDevice('u1', 'd1')).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // deleteAccount
    // ═══════════════════════════════════════════════════════════════════════

    describe('deleteAccount', () => {
        it('should set status to DELETED and soft-delete the user', async () => {
            userRepository.findById.mockResolvedValue({
                id: 'u1',
                role: UserRole.TEAM_MEMBER,
                status: UserStatus.ACTIVE,
            });

            await service.deleteAccount('u1');

            expect(userRepository.update).toHaveBeenCalledWith(
                'u1',
                expect.objectContaining({ status: UserStatus.DELETED }),
            );
            expect(userRepository.softDelete).toHaveBeenCalledWith('u1');
        });

        it('should throw NotFoundException when user does not exist', async () => {
            userRepository.findById.mockResolvedValue(null);

            await expect(service.deleteAccount('missing')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // createUser
    // ═══════════════════════════════════════════════════════════════════════

    describe('createUser', () => {
        it('should create a user with hashed password', async () => {
            userRepository.findByEmail.mockResolvedValue(null);

            const result = await service.createUser({
                email: 'new@test.com',
                password: 'plaintext',
                fullName: 'New User',
            } as any);

            expect(result.success).toBe(true);
            expect(result.statusCode).toBe(201);
        });

        it('should throw ConflictException if email already exists', async () => {
            userRepository.findByEmail.mockResolvedValue({ id: 'existing' });

            await expect(
                service.createUser({
                    email: 'dup@test.com',
                    password: 'pass',
                    fullName: 'Dup',
                } as any),
            ).rejects.toThrow(ConflictException);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // findByEmail
    // ═══════════════════════════════════════════════════════════════════════

    describe('findByEmail', () => {
        it('should return user when found', async () => {
            const user = { id: 'u1', email: 'test@test.com' };
            userRepository.findByEmail.mockResolvedValue(user);

            const result = await service.findByEmail('test@test.com');

            expect(result).toEqual(user);
        });

        it('should return null when not found', async () => {
            userRepository.findByEmail.mockResolvedValue(null);

            const result = await service.findByEmail('nobody@test.com');

            expect(result).toBeNull();
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // getActiveUsers
    // ═══════════════════════════════════════════════════════════════════════

    describe('getActiveUsers', () => {
        it('should return list of active users', async () => {
            const users = [
                { id: 'u1', status: UserStatus.ACTIVE },
                { id: 'u2', status: UserStatus.ACTIVE },
            ];
            userRepository.findActiveUsers.mockResolvedValue(users);

            const result = await service.getActiveUsers();

            expect(result).toHaveLength(2);
        });
    });
});
