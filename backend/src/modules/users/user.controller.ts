import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Query,
    Delete,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { BaseController } from 'src/core/base';
import { ApiSwagger, Public, CurrentUser } from 'src/core/decorators';
import {
    ResponsePayloadDto,
    SuccessResponseDto,
    UpdatedResponseDto,
    DeletedResponseDto,
    CreatedResponseDto,
} from '@shared/dtos';
import type { IJwtPayload } from '@shared/interfaces';
import { UserService } from './user.service';
import {
    CreateUserDto,
    UpdateUserDto,
    UserResponseDto,
    UpdateProfileDto,
    ChangeMyPasswordDto,
    UpdateNotificationPrefsDto,
    RegisterDeviceDto,
} from './dtos';
import { User } from './user.entity';
import { UserDevice } from './entities/user-device.entity';

@ApiTags('Users')
@Controller('users')
export class UserController extends BaseController<
    User,
    CreateUserDto,
    UpdateUserDto
> {
    constructor(private readonly userService: UserService) {
        super(userService);
    }

    // ── /me Profile Routes (MUST come before /:id routes) ──────────────

    /**
     * Get current user profile
     * GET /users/me
     */
    @Get('me')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'User Profile',
        operation: 'getOne',
        summary: 'Get current user profile',
        responseDto: UserResponseDto,
        errors: [
            { status: 401, description: 'Unauthorized' },
            { status: 404, description: 'User not found' },
        ],
    })
    async getProfile(
        @CurrentUser() user: IJwtPayload,
    ): Promise<SuccessResponseDto<User>> {
        const profile = await this.userService.getProfile(user.id);
        return new SuccessResponseDto(
            profile,
            'Profile retrieved successfully',
        );
    }

    /**
     * Update current user profile (name, jobTitle)
     * PATCH /users/me
     */
    @Patch('me')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'User Profile',
        operation: 'update',
        summary: 'Update current user profile',
        requestDto: UpdateProfileDto,
        responseDto: UserResponseDto,
        errors: [
            { status: 400, description: 'Invalid input data' },
            { status: 401, description: 'Unauthorized' },
            { status: 404, description: 'User not found' },
        ],
    })
    async updateProfile(
        @CurrentUser() user: IJwtPayload,
        @Body() dto: UpdateProfileDto,
    ): Promise<UpdatedResponseDto<User>> {
        const updated = await this.userService.updateProfile(user.id, dto);
        return new UpdatedResponseDto(updated, 'Profile updated successfully');
    }

    /**
     * Upload avatar image
     * POST /users/me/avatar
     */
    @Post('me/avatar')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiSwagger({
        resourceName: 'Avatar',
        operation: 'create',
        summary: 'Upload user avatar (5MB max, image/* only)',
        responseDto: UserResponseDto,
        errors: [
            {
                status: 400,
                description: 'Invalid file type or size exceeds 5MB',
            },
            { status: 401, description: 'Unauthorized' },
        ],
    })
    async uploadAvatar(
        @CurrentUser() user: IJwtPayload,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<SuccessResponseDto<User>> {
        const updated = await this.userService.uploadAvatar(user.id, file);
        return new SuccessResponseDto(updated, 'Avatar uploaded successfully');
    }

    /**
     * Change current user password
     * PATCH /users/me/password
     */
    @Patch('me/password')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Password',
        operation: 'update',
        summary: 'Change current user password',
        requestDto: ChangeMyPasswordDto,
        errors: [
            {
                status: 400,
                description: 'Invalid current password or weak new password',
            },
            { status: 401, description: 'Unauthorized' },
            { status: 404, description: 'User not found' },
        ],
    })
    async changePassword(
        @CurrentUser() user: IJwtPayload,
        @Body() dto: ChangeMyPasswordDto,
    ): Promise<SuccessResponseDto<null>> {
        await this.userService.changeMyPassword(user.id, dto);
        return new SuccessResponseDto(null, 'Password changed successfully');
    }

    /**
     * Update notification preferences
     * PATCH /users/me/notifications
     */
    @Patch('me/notifications')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Notification Preferences',
        operation: 'update',
        summary: 'Update notification preferences',
        requestDto: UpdateNotificationPrefsDto,
        responseDto: UserResponseDto,
        errors: [
            { status: 400, description: 'Invalid input data' },
            { status: 401, description: 'Unauthorized' },
            { status: 404, description: 'User not found' },
        ],
    })
    async updateNotificationPrefs(
        @CurrentUser() user: IJwtPayload,
        @Body() dto: UpdateNotificationPrefsDto,
    ): Promise<UpdatedResponseDto<User>> {
        const updated = await this.userService.updateNotificationPrefs(
            user.id,
            dto,
        );
        return new UpdatedResponseDto(
            updated,
            'Notification preferences updated successfully',
        );
    }

    /**
     * Register a push notification device
     * POST /users/me/devices
     */
    @Post('me/devices')
    @HttpCode(HttpStatus.CREATED)
    @ApiSwagger({
        resourceName: 'Device',
        operation: 'create',
        summary: 'Register push notification device',
        requestDto: RegisterDeviceDto,
        successStatus: 201,
        errors: [
            { status: 400, description: 'Invalid input data' },
            { status: 401, description: 'Unauthorized' },
        ],
    })
    async registerDevice(
        @CurrentUser() user: IJwtPayload,
        @Body() dto: RegisterDeviceDto,
    ): Promise<CreatedResponseDto<UserDevice>> {
        const device = await this.userService.registerDevice(user.id, dto);
        return new CreatedResponseDto(device, 'Device registered successfully');
    }

    /**
     * Unregister a push notification device
     * DELETE /users/me/devices/:deviceId
     */
    @Delete('me/devices/:deviceId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Device',
        operation: 'delete',
        summary: 'Unregister push notification device',
        errors: [
            { status: 401, description: 'Unauthorized' },
            {
                status: 403,
                description: 'Device does not belong to current user',
            },
            { status: 404, description: 'Device not found' },
        ],
    })
    async unregisterDevice(
        @CurrentUser() user: IJwtPayload,
        @Param('deviceId', ParseUUIDPipe) deviceId: string,
    ): Promise<DeletedResponseDto> {
        await this.userService.unregisterDevice(user.id, deviceId);
        return new DeletedResponseDto('Device unregistered successfully');
    }

    /**
     * Soft-delete current user account
     * DELETE /users/me
     */
    @Delete('me')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Account',
        operation: 'delete',
        summary: 'Delete current user account (soft delete)',
        errors: [
            { status: 401, description: 'Unauthorized' },
            { status: 404, description: 'User not found' },
        ],
    })
    async deleteAccount(
        @CurrentUser() user: IJwtPayload,
    ): Promise<DeletedResponseDto> {
        await this.userService.deleteAccount(user.id);
        return new DeletedResponseDto('Account deleted successfully');
    }

    // ── Existing CRUD Routes ───────────────────────────────────────────

    /**
     * Override create to use custom createUser method
     * Rate limited: 3 requests/minute (registration endpoint)
     */
    @Public()
    @Post()
    @Throttle({ default: { ttl: 60000, limit: 5 } })
    @HttpCode(HttpStatus.CREATED)
    @ApiSwagger({
        resourceName: 'User',
        operation: 'create',
        requestDto: CreateUserDto,
        responseDto: UserResponseDto,
        successStatus: 201,
        errors: [
            { status: 400, description: 'Invalid input data' },
            { status: 409, description: 'User with this email already exists' },
        ],
    })
    async create(
        @Body() createUserDto: CreateUserDto,
    ): Promise<ResponsePayloadDto<User>> {
        return await this.userService.createUser(createUserDto);
    }

    /**
     * Override update to use custom updateUser method
     */
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'User',
        operation: 'update',
        requestDto: UpdateUserDto,
        responseDto: UserResponseDto,
        errors: [
            { status: 400, description: 'Invalid input data or UUID format' },
            { status: 404, description: 'User not found' },
        ],
    })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateUserDto: UpdateUserDto,
    ): Promise<ResponsePayloadDto<User>> {
        const user = await this.userService.updateUser(id, updateUserDto);
        return new ResponsePayloadDto({
            success: true,
            statusCode: 200,
            message: 'User updated successfully',
            data: user,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Get all active users
     * GET /users/active
     */
    @Get('active')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Active Users',
        operation: 'getAll',
        responseDto: UserResponseDto,
        isArray: true,
        withPagination: true,
        errors: [{ status: 401, description: 'Unauthorized' }],
    })
    async getActiveUsers() {
        return this.userService.getActiveUsers();
    }

    /**
     * Search users by email
     * GET /users/search?email=test@example.com
     */
    @Get('search')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Users',
        operation: 'search',
        summary: 'Search users by email',
        responseDto: UserResponseDto,
        isArray: true,
        errors: [
            { status: 400, description: 'Invalid email format' },
            { status: 401, description: 'Unauthorized' },
        ],
    })
    async searchByEmail(@Query('email') email: string) {
        if (!email) {
            return [];
        }
        const user = await this.userService.findByEmail(email);
        return user ? [user] : [];
    }

    /**
     * Count total users
     * GET /users/count
     */
    @Get('count')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Users',
        operation: 'count',
        summary: 'Get total count of users',
        errors: [{ status: 401, description: 'Unauthorized' }],
    })
    async count() {
        return super.count();
    }

    /**
     * Get all users with pagination
     * GET /users?page=1&limit=10
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Users',
        operation: 'getAll',
        responseDto: UserResponseDto,
        isArray: true,
        withPagination: true,
        errors: [{ status: 401, description: 'Unauthorized' }],
    })
    async findAll(@Query() paginationDto: any) {
        return super.findAll(paginationDto);
    }

    /**
     * Get user by ID
     * GET /users/:id
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'User',
        operation: 'getOne',
        responseDto: UserResponseDto,
        errors: [
            { status: 400, description: 'Invalid UUID format' },
            { status: 401, description: 'Unauthorized' },
            { status: 404, description: 'User not found' },
        ],
    })
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return super.findOne(id);
    }

    /**
     * Delete user by ID
     * DELETE /users/:id
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'User',
        operation: 'delete',
        errors: [
            { status: 400, description: 'Invalid UUID format' },
            { status: 401, description: 'Unauthorized' },
            { status: 404, description: 'User not found' },
        ],
    })
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        return super.remove(id);
    }
}
