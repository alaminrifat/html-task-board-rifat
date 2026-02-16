// Mock env config, S3 and mail before any imports
const mockEnvConfig = {
    getValue: jest.fn().mockReturnValue('mock'),
    getAwsConfig: jest.fn().mockReturnValue({
        AWS_REGION: 'us-east-1',
        AWS_ACCESS_KEY_ID: 'key',
        AWS_SECRET_ACCESS_KEY: 'secret',
    }),
    getMailConfig: jest.fn().mockReturnValue({
        MAIL_HOST: 'smtp.test.com',
        MAIL_PORT: 587,
        MAIL_USER: 'test',
        MAIL_PASSWORD: 'test',
        MAIL_FROM: 'test@test.com',
    }),
    ensureValues: jest.fn().mockReturnThis(),
};
jest.mock('@config/env-config.service', () => ({
    __esModule: true,
    default: mockEnvConfig,
    envConfigService: mockEnvConfig,
}));
jest.mock('@config/s3.config', () => ({ s3Client: {} }));
jest.mock('@config/mail.config', () => ({
    transporter: { sendMail: jest.fn() },
}));
jest.mock('@infrastructure/s3/s3.service', () => ({
    S3Service: jest.fn().mockImplementation(() => ({
        uploadFile: jest.fn(),
        deleteFile: jest.fn(),
        getSignedUrl: jest.fn(),
    })),
}));
jest.mock('@infrastructure/mail', () => ({
    MailService: jest.fn().mockImplementation(() => ({
        sendMail: jest.fn().mockResolvedValue(undefined),
        sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
        sendInvitationEmail: jest.fn().mockResolvedValue(undefined),
    })),
    MailModule: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import {
    BadRequestException,
    InternalServerErrorException,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { User } from '@modules/users';
import { MailService } from '@infrastructure/mail';
import { TokenService } from '@infrastructure/token/token.service';
import { UtilsService } from '@infrastructure/utils/utils.service';
import { I18nHelper } from '@core/utils';
import { UserRole, UserStatus } from '@shared/enums';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockQueryBuilder(overrides: Record<string, any> = {}) {
    const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
        getRawOne: jest.fn().mockResolvedValue(null),
        ...overrides,
    };
    return qb;
}

function mockRepository() {
    return {
        findOne: jest.fn(),
        find: jest.fn(),
        create: jest.fn().mockImplementation((data) => data),
        save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
        createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
    };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('AuthService', () => {
    let service: AuthService;
    let userRepo: ReturnType<typeof mockRepository>;
    let tokenService: {
        getAccessToken: jest.Mock;
        getRefreshToken: jest.Mock;
        verifyToken: jest.Mock;
        decodeToken: jest.Mock;
    };
    let utilsService: {
        isMatchHash: jest.Mock;
        getHash: jest.Mock;
        generateUniqueOTP: jest.Mock;
    };
    let i18nHelper: { t: jest.Mock };
    let mailService: { sendResetPasswordEmail: jest.Mock };
    let logger: { warn: jest.Mock; error: jest.Mock; log: jest.Mock };
    let dataSource: { transaction: jest.Mock };

    beforeEach(async () => {
        userRepo = mockRepository();

        tokenService = {
            getAccessToken: jest.fn().mockReturnValue('fake-access-token'),
            getRefreshToken: jest.fn().mockReturnValue('fake-refresh-token'),
            verifyToken: jest.fn().mockReturnValue(true),
            decodeToken: jest.fn(),
        };

        utilsService = {
            isMatchHash: jest.fn().mockResolvedValue(true),
            getHash: jest.fn().mockResolvedValue('hashed-password'),
            generateUniqueOTP: jest.fn().mockReturnValue(1234),
        };

        i18nHelper = {
            t: jest.fn().mockImplementation((key: string) => key),
        };

        mailService = {
            sendResetPasswordEmail: jest.fn().mockResolvedValue(undefined),
        };

        logger = {
            warn: jest.fn(),
            error: jest.fn(),
            log: jest.fn(),
        };

        dataSource = {
            transaction: jest.fn().mockImplementation(async (cb) => {
                const manager = {
                    create: jest
                        .fn()
                        .mockImplementation((_Entity, data) => data),
                    save: jest.fn().mockImplementation((_Entity, data) =>
                        Promise.resolve({
                            ...data,
                            id: data.id ?? 'new-user-id',
                        }),
                    ),
                    update: jest.fn().mockResolvedValue({ affected: 1 }),
                };
                return cb(manager);
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: getRepositoryToken(User), useValue: userRepo },
                { provide: getDataSourceToken(), useValue: dataSource },
                { provide: Logger, useValue: logger },
                { provide: TokenService, useValue: tokenService },
                { provide: UtilsService, useValue: utilsService },
                { provide: I18nHelper, useValue: i18nHelper },
                {
                    provide: ConfigService,
                    useValue: { get: jest.fn().mockReturnValue('3600') },
                },
                {
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn().mockReturnValue('token'),
                        verify: jest.fn(),
                    },
                },
                { provide: MailService, useValue: mailService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // login
    // ═══════════════════════════════════════════════════════════════════════

    describe('login', () => {
        const mockActiveUser = {
            id: 'u1',
            fullName: 'John Doe',
            email: 'john@test.com',
            role: UserRole.TEAM_MEMBER,
            status: UserStatus.ACTIVE,
            password: 'hashed',
        };

        it('should return tokens and user data on successful login', async () => {
            const qb = createMockQueryBuilder({
                getOne: jest.fn().mockResolvedValue(mockActiveUser),
            });
            userRepo.createQueryBuilder.mockReturnValue(qb);
            utilsService.isMatchHash.mockResolvedValue(true);

            const result = await service.login({
                email: 'john@test.com',
                password: 'password123',
            });

            expect(result.success).toBe(true);
            expect(result.data!.token).toBeDefined();
            expect(result.data!.refreshToken).toBeDefined();
            expect(result.data!.user!.email).toBe('john@test.com');
        });

        it('should throw NotFoundException when user does not exist', async () => {
            const qb = createMockQueryBuilder({
                getOne: jest.fn().mockResolvedValue(null),
            });
            userRepo.createQueryBuilder.mockReturnValue(qb);

            await expect(
                service.login({ email: 'nobody@test.com', password: 'pass' }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw UnauthorizedException when password does not match', async () => {
            const qb = createMockQueryBuilder({
                getOne: jest.fn().mockResolvedValue(mockActiveUser),
            });
            userRepo.createQueryBuilder.mockReturnValue(qb);
            utilsService.isMatchHash.mockResolvedValue(false);

            await expect(
                service.login({ email: 'john@test.com', password: 'wrong' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw BadRequestException when user is SUSPENDED', async () => {
            const suspendedUser = {
                ...mockActiveUser,
                status: UserStatus.SUSPENDED,
            };
            const qb = createMockQueryBuilder({
                getOne: jest.fn().mockResolvedValue(suspendedUser),
            });
            userRepo.createQueryBuilder.mockReturnValue(qb);
            utilsService.isMatchHash.mockResolvedValue(true);

            await expect(
                service.login({
                    email: 'john@test.com',
                    password: 'password123',
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when user is DELETED', async () => {
            const deletedUser = {
                ...mockActiveUser,
                status: UserStatus.DELETED,
            };
            const qb = createMockQueryBuilder({
                getOne: jest.fn().mockResolvedValue(deletedUser),
            });
            userRepo.createQueryBuilder.mockReturnValue(qb);
            utilsService.isMatchHash.mockResolvedValue(true);

            await expect(
                service.login({
                    email: 'john@test.com',
                    password: 'password123',
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should update refreshToken and rememberMe flag on user', async () => {
            const qb = createMockQueryBuilder({
                getOne: jest.fn().mockResolvedValue(mockActiveUser),
            });
            userRepo.createQueryBuilder.mockReturnValue(qb);
            utilsService.isMatchHash.mockResolvedValue(true);

            await service.login({
                email: 'john@test.com',
                password: 'password123',
                rememberMe: true,
            });

            expect(userRepo.update).toHaveBeenCalledWith(
                'u1',
                expect.objectContaining({
                    refreshToken: 'fake-refresh-token',
                    rememberMe: true,
                }),
            );
        });

        it('should throw InternalServerErrorException when refreshToken update fails', async () => {
            const qb = createMockQueryBuilder({
                getOne: jest.fn().mockResolvedValue(mockActiveUser),
            });
            userRepo.createQueryBuilder.mockReturnValue(qb);
            utilsService.isMatchHash.mockResolvedValue(true);
            userRepo.update.mockResolvedValue({ affected: 0 });

            await expect(
                service.login({
                    email: 'john@test.com',
                    password: 'password123',
                }),
            ).rejects.toThrow(InternalServerErrorException);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // adminLogin
    // ═══════════════════════════════════════════════════════════════════════

    describe('adminLogin', () => {
        it('should succeed for admin user with valid credentials', async () => {
            const adminUser = {
                id: 'admin-id',
                fullName: 'Admin',
                email: 'admin@test.com',
                role: UserRole.ADMIN,
                status: UserStatus.ACTIVE,
                password: 'hashed',
            };
            const qb = createMockQueryBuilder({
                getOne: jest.fn().mockResolvedValue(adminUser),
            });
            userRepo.createQueryBuilder.mockReturnValue(qb);
            utilsService.isMatchHash.mockResolvedValue(true);

            const result = await service.adminLogin({
                email: 'admin@test.com',
                password: 'adminpass',
            });

            expect(result.success).toBe(true);
            expect(result.data!.user!.role).toBe(UserRole.ADMIN);
        });

        it('should throw UnauthorizedException for non-admin user', async () => {
            const regularUser = {
                id: 'u1',
                fullName: 'User',
                email: 'user@test.com',
                role: UserRole.TEAM_MEMBER,
                status: UserStatus.ACTIVE,
                password: 'hashed',
            };
            const qb = createMockQueryBuilder({
                getOne: jest.fn().mockResolvedValue(regularUser),
            });
            userRepo.createQueryBuilder.mockReturnValue(qb);
            utilsService.isMatchHash.mockResolvedValue(true);

            await expect(
                service.adminLogin({
                    email: 'user@test.com',
                    password: 'pass',
                }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw NotFoundException for non-existent admin user', async () => {
            const qb = createMockQueryBuilder({
                getOne: jest.fn().mockResolvedValue(null),
            });
            userRepo.createQueryBuilder.mockReturnValue(qb);

            await expect(
                service.adminLogin({
                    email: 'nobody@test.com',
                    password: 'pass',
                }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // forgotPassword
    // ═══════════════════════════════════════════════════════════════════════

    describe('forgotPassword', () => {
        it('should send reset email and return success', async () => {
            userRepo.findOne.mockResolvedValue({
                id: 'u1',
                email: 'user@test.com',
            });

            const result = await service.forgotPassword({
                email: 'user@test.com',
            });

            expect(result.success).toBe(true);
            expect(mailService.sendResetPasswordEmail).toHaveBeenCalledWith(
                'user@test.com',
                expect.any(Number),
            );
        });

        it('should throw NotFoundException when user does not exist', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(
                service.forgotPassword({ email: 'unknown@test.com' }),
            ).rejects.toThrow();
        });

        it('should generate a 4-digit OTP', async () => {
            userRepo.findOne.mockResolvedValue({
                id: 'u1',
                email: 'user@test.com',
            });

            await service.forgotPassword({ email: 'user@test.com' });

            expect(utilsService.generateUniqueOTP).toHaveBeenCalledWith(4);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // resetPassword
    // ═══════════════════════════════════════════════════════════════════════

    describe('resetPassword', () => {
        it('should hash password and update user on valid reset', async () => {
            userRepo.findOne.mockResolvedValue({
                id: 'u1',
                email: 'user@test.com',
            });

            const result = await service.resetPassword({
                email: 'user@test.com',
                password: 'newPassword123',
            });

            expect(result).toBeDefined();
            expect(utilsService.getHash).toHaveBeenCalledWith('newPassword123');
            expect(userRepo.update).toHaveBeenCalledWith(
                'u1',
                expect.objectContaining({ password: 'hashed-password' }),
            );
        });

        it('should throw NotFoundException when user not found by email', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(
                service.resetPassword({
                    email: 'unknown@test.com',
                    password: 'newPass',
                }),
            ).rejects.toThrow();
        });

        it('should throw InternalServerErrorException when password update fails', async () => {
            userRepo.findOne.mockResolvedValue({
                id: 'u1',
                email: 'user@test.com',
            });
            userRepo.update.mockResolvedValue({ affected: 0 });

            await expect(
                service.resetPassword({
                    email: 'user@test.com',
                    password: 'newPass',
                }),
            ).rejects.toThrow();
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // refreshAccessToken
    // ═══════════════════════════════════════════════════════════════════════

    describe('refreshAccessToken', () => {
        it('should return a new access token for valid refresh token', async () => {
            const user = {
                id: 'u1',
                fullName: 'John',
                email: 'john@test.com',
                role: UserRole.TEAM_MEMBER,
                status: UserStatus.ACTIVE,
                refreshToken: 'valid-refresh-token',
            };
            userRepo.findOne.mockResolvedValue(user);

            const result = await service.refreshAccessToken(
                'valid-refresh-token',
            );

            expect(result).toBeDefined();
            expect(result.token).toBeDefined();
            expect(tokenService.verifyToken).toHaveBeenCalledWith(
                'valid-refresh-token',
            );
            expect(tokenService.getAccessToken).toHaveBeenCalled();
        });

        it('should throw UnauthorizedException for invalid refresh token', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(
                service.refreshAccessToken('invalid-token'),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when token verification fails', async () => {
            const user = {
                id: 'u1',
                fullName: 'John',
                email: 'john@test.com',
                role: UserRole.TEAM_MEMBER,
                status: UserStatus.ACTIVE,
            };
            userRepo.findOne.mockResolvedValue(user);
            tokenService.verifyToken.mockImplementation(() => {
                throw new UnauthorizedException('Token has expired');
            });

            await expect(
                service.refreshAccessToken('expired-token'),
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // logout
    // ═══════════════════════════════════════════════════════════════════════

    describe('logout', () => {
        it('should clear the refreshToken on user record', async () => {
            const user = {
                id: 'u1',
                fullName: 'John',
                email: 'john@test.com',
                role: UserRole.TEAM_MEMBER,
            };

            const result = await service.logout(user);

            expect(result.success).toBe(true);
            expect(userRepo.update).toHaveBeenCalledWith('u1', {
                refreshToken: null,
            });
        });

        it('should succeed even when user is null (already logged out)', async () => {
            const result = await service.logout(null);

            expect(result.success).toBe(true);
            expect(userRepo.update).not.toHaveBeenCalled();
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // changePassword
    // ═══════════════════════════════════════════════════════════════════════

    describe('changePassword', () => {
        const jwtPayload = {
            id: 'u1',
            fullName: 'John',
            email: 'john@test.com',
            role: UserRole.TEAM_MEMBER,
        };

        it('should throw when newPassword and confirmNewPassword do not match', async () => {
            await expect(
                service.changePassword(jwtPayload, {
                    newPassword: 'pass1',
                    confirmNewPassword: 'pass2',
                }),
            ).rejects.toThrow();
        });

        it('should throw NotFoundException when user is not found', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(
                service.changePassword(jwtPayload, {
                    newPassword: 'newpass',
                    confirmNewPassword: 'newpass',
                }),
            ).rejects.toThrow();
        });

        it('should throw when new password equals old password', async () => {
            userRepo.findOne.mockResolvedValue({
                id: 'u1',
                password: 'hashed-old',
                emailVerified: true,
            });
            utilsService.isMatchHash.mockResolvedValue(true); // new == old

            await expect(
                service.changePassword(jwtPayload, {
                    newPassword: 'samepass',
                    confirmNewPassword: 'samepass',
                }),
            ).rejects.toThrow();
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // changeUserPassword
    // ═══════════════════════════════════════════════════════════════════════

    describe('changeUserPassword', () => {
        const jwtPayload = {
            id: 'u1',
            fullName: 'John',
            email: 'john@test.com',
            role: UserRole.TEAM_MEMBER,
        };

        it('should update password when current password is correct', async () => {
            userRepo.findOne.mockResolvedValue({
                id: 'u1',
                password: 'hashed-old',
            });
            utilsService.isMatchHash
                .mockResolvedValueOnce(true) // currentPassword matches
                .mockResolvedValueOnce(false); // newPassword != old

            const result = await service.changeUserPassword(jwtPayload, {
                currentPassword: 'oldpass',
                newPassword: 'newpass',
            });

            expect(result).toBeDefined();
            expect(utilsService.getHash).toHaveBeenCalledWith('newpass');
        });

        it('should throw UnauthorizedException when current password is incorrect', async () => {
            userRepo.findOne.mockResolvedValue({
                id: 'u1',
                password: 'hashed-old',
            });
            utilsService.isMatchHash.mockResolvedValue(false);

            await expect(
                service.changeUserPassword(jwtPayload, {
                    currentPassword: 'wrongpass',
                    newPassword: 'newpass',
                }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw NotFoundException when user is not found', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(
                service.changeUserPassword(jwtPayload, {
                    currentPassword: 'old',
                    newPassword: 'new',
                }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException when new password same as current', async () => {
            userRepo.findOne.mockResolvedValue({
                id: 'u1',
                password: 'hashed-old',
            });
            utilsService.isMatchHash
                .mockResolvedValueOnce(true) // currentPassword matches
                .mockResolvedValueOnce(true); // newPassword also matches (same)

            await expect(
                service.changeUserPassword(jwtPayload, {
                    currentPassword: 'samepass',
                    newPassword: 'samepass',
                }),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // getUserInformation
    // ═══════════════════════════════════════════════════════════════════════

    describe('getUserInformation', () => {
        it('should return user information payload', async () => {
            const mockUser = {
                id: 'u1',
                fullName: 'John Doe',
                email: 'john@test.com',
                role: UserRole.TEAM_MEMBER,
                status: UserStatus.ACTIVE,
                avatarUrl: null,
            };
            const qb = createMockQueryBuilder({
                getOne: jest.fn().mockResolvedValue(mockUser),
            });
            userRepo.createQueryBuilder.mockReturnValue(qb);

            const payload = {
                id: 'u1',
                fullName: 'John',
                email: 'john@test.com',
                role: UserRole.TEAM_MEMBER,
            };

            const result = await service.getUserInformation(payload);

            expect(result.success).toBe(true);
            expect(result.data!.id).toBe('u1');
        });

        it('should throw NotFoundException for invalid user', async () => {
            const qb = createMockQueryBuilder({
                getOne: jest.fn().mockResolvedValue(null),
            });
            userRepo.createQueryBuilder.mockReturnValue(qb);

            await expect(
                service.getUserInformation({
                    id: 'nonexistent',
                    fullName: '',
                    email: '',
                    role: UserRole.TEAM_MEMBER,
                }),
            ).rejects.toThrow();
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // registerFcmToken
    // ═══════════════════════════════════════════════════════════════════════

    describe('registerFcmToken', () => {
        const jwtPayload = {
            id: 'u1',
            fullName: 'John',
            email: 'john@test.com',
            role: UserRole.TEAM_MEMBER,
        };

        it('should register a new FCM token', async () => {
            userRepo.findOne.mockResolvedValue({
                id: 'u1',
                deviceFcmTokens: [],
            });

            const result = await service.registerFcmToken(jwtPayload, {
                fcmToken: 'new-token-abc',
            });

            expect(result.success).toBe(true);
            expect(userRepo.update).toHaveBeenCalledWith('u1', {
                deviceFcmTokens: ['new-token-abc'],
            });
        });

        it('should return success without updating when token already registered', async () => {
            userRepo.findOne.mockResolvedValue({
                id: 'u1',
                deviceFcmTokens: ['existing-token'],
            });

            const result = await service.registerFcmToken(jwtPayload, {
                fcmToken: 'existing-token',
            });

            expect(result.success).toBe(true);
            expect(userRepo.update).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException for non-existent user', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(
                service.registerFcmToken(jwtPayload, { fcmToken: 'token' }),
            ).rejects.toThrow(NotFoundException);
        });
    });
});
