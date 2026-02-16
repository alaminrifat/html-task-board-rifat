import {
    Injectable,
    ConflictException,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from 'src/core/base';
import { I18nHelper, PasswordUtil } from 'src/core/utils';
import { S3Service } from '@infrastructure/s3/s3.service';
import { UserStatus } from '@shared/enums';
import { ResponsePayloadDto } from '@shared/dtos/response.dto';
import { User } from './user.entity';
import { UserDevice } from './entities/user-device.entity';
import { UserRepository } from './user.repository';
import {
    CreateUserDto,
    UpdateUserDto,
    UpdateProfileDto,
    ChangeMyPasswordDto,
    UpdateNotificationPrefsDto,
    RegisterDeviceDto,
} from './dtos';

@Injectable()
export class UserService extends BaseService<User> {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly i18nHelper: I18nHelper,
        private readonly s3Service: S3Service,
        @InjectRepository(UserDevice)
        private readonly userDeviceRepository: Repository<UserDevice>,
    ) {
        super(userRepository, 'User');
    }

    async createUser(
        createUserDto: CreateUserDto,
    ): Promise<ResponsePayloadDto<User>> {
        const existingUser = await this.userRepository.findByEmail(
            createUserDto.email,
        );
        if (existingUser) {
            if (process.env.MODE === 'DEV') {
                console.log(
                    '[UserService] Throwing conflict with email:',
                    createUserDto.email,
                );
            }

            throw new ConflictException(
                this.i18nHelper.t('translation.users.errors.email_exists', {
                    email: createUserDto.email,
                }),
            );
        }

        const hashedPassword = await PasswordUtil.hash(createUserDto.password);

        const user = await this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
        });

        return new ResponsePayloadDto({
            success: true,
            statusCode: 201,
            message: this.i18nHelper.t('translation.users.success.created'),
            data: user,
            timestamp: new Date().toISOString(),
        });
    }

    async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        if (updateUserDto.password) {
            updateUserDto.password = await PasswordUtil.hash(
                updateUserDto.password,
            );
        }

        const updated = await this.update(id, updateUserDto);
        if (!updated) {
            return this.findByIdOrFail(id);
        }
        return updated;
    }

    /**
     * Find user by email
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findByEmail(email);
    }

    /**
     * Get all active users
     */
    async getActiveUsers(): Promise<User[]> {
        return this.userRepository.findActiveUsers();
    }

    // ── Profile Methods ────────────────────────────────────────────────

    /**
     * Get current user profile (excludes password and refreshToken)
     */
    async getProfile(userId: string): Promise<User> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundException(
                this.i18nHelper.t('translation.users.errors.not_found'),
            );
        }

        // Explicitly remove sensitive fields
        delete (user as any).password;
        delete (user as any).refreshToken;

        return user;
    }

    /**
     * Update current user profile (firstName, lastName, jobTitle)
     */
    async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
        const user = await this.findByIdOrFail(userId);

        const firstName =
            dto.firstName !== undefined ? dto.firstName : user.firstName;
        const lastName =
            dto.lastName !== undefined ? dto.lastName : user.lastName;
        const fullName =
            [firstName, lastName].filter(Boolean).join(' ') || null;

        const updateData: Partial<User> = {
            ...dto,
            fullName: fullName as string,
        };

        const updated = await this.userRepository.update(userId, updateData);
        const result = updated || (await this.findByIdOrFail(userId));

        delete (result as any).password;
        delete (result as any).refreshToken;

        return result;
    }

    /**
     * Upload avatar image to S3 and save URL
     */
    async uploadAvatar(
        userId: string,
        file: Express.Multer.File,
    ): Promise<User> {
        if (!file) {
            throw new BadRequestException(
                this.i18nHelper.t('translation.users.errors.avatar_required'),
            );
        }

        // Validate file type
        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException(
                this.i18nHelper.t(
                    'translation.users.errors.invalid_image_type',
                ),
            );
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new BadRequestException(
                this.i18nHelper.t('translation.users.errors.file_too_large'),
            );
        }

        const avatarUrl = await this.s3Service.uploadFile(file, 'avatars');

        const updated = await this.userRepository.update(userId, {
            avatarUrl,
        } as Partial<User>);
        const result = updated || (await this.findByIdOrFail(userId));

        delete (result as any).password;
        delete (result as any).refreshToken;

        return result;
    }

    /**
     * Change current user password (verify current, set new)
     */
    async changeMyPassword(
        userId: string,
        dto: ChangeMyPasswordDto,
    ): Promise<void> {
        // Fetch user WITH password field (select: false in entity)
        const user = await this.userRepository.findByIdWithPassword(userId);

        if (!user) {
            throw new NotFoundException(
                this.i18nHelper.t('translation.users.errors.not_found'),
            );
        }

        const isCurrentValid = await PasswordUtil.compare(
            dto.currentPassword,
            user.password!,
        );
        if (!isCurrentValid) {
            throw new BadRequestException(
                this.i18nHelper.t(
                    'translation.users.errors.invalid_current_password',
                ),
            );
        }

        const hashedPassword = await PasswordUtil.hash(dto.newPassword);
        await this.userRepository.update(userId, {
            password: hashedPassword,
        } as Partial<User>);
    }

    /**
     * Update notification preferences
     */
    async updateNotificationPrefs(
        userId: string,
        dto: UpdateNotificationPrefsDto,
    ): Promise<User> {
        await this.findByIdOrFail(userId);

        const updated = await this.userRepository.update(
            userId,
            dto as Partial<User>,
        );
        const result = updated || (await this.findByIdOrFail(userId));

        delete (result as any).password;
        delete (result as any).refreshToken;

        return result;
    }

    /**
     * Register a push notification device
     */
    async registerDevice(
        userId: string,
        dto: RegisterDeviceDto,
    ): Promise<UserDevice> {
        await this.findByIdOrFail(userId);

        // Upsert: if token already exists, update it
        const existing = await this.userDeviceRepository.findOne({
            where: { token: dto.token },
        });

        if (existing) {
            existing.userId = userId;
            existing.platform = dto.platform;
            existing.deviceName = dto.deviceName;
            return this.userDeviceRepository.save(existing);
        }

        const device = this.userDeviceRepository.create({
            userId,
            token: dto.token,
            platform: dto.platform,
            deviceName: dto.deviceName,
        });

        return this.userDeviceRepository.save(device);
    }

    /**
     * Unregister a push notification device (validate ownership)
     */
    async unregisterDevice(userId: string, deviceId: string): Promise<void> {
        const device = await this.userDeviceRepository.findOne({
            where: { id: deviceId },
        });

        if (!device) {
            throw new NotFoundException(
                this.i18nHelper.t('translation.users.errors.device_not_found'),
            );
        }

        if (device.userId !== userId) {
            throw new ForbiddenException(
                this.i18nHelper.t('translation.users.errors.device_not_owned'),
            );
        }

        await this.userDeviceRepository.delete(deviceId);
    }

    /**
     * Soft-delete user account (set status to DELETED and soft delete)
     */
    async deleteAccount(userId: string): Promise<void> {
        await this.findByIdOrFail(userId);

        // Set status to DELETED
        await this.userRepository.update(userId, {
            status: UserStatus.DELETED,
        } as Partial<User>);

        // Soft delete the record
        await this.userRepository.softDelete(userId);
    }
}
