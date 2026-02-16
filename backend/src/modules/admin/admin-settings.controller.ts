import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSwagger, CurrentUser } from '@core/decorators';
import { Roles } from '@core/decorators/roles.decorator';
import { RolesGuard } from '@core/guards/roles.guard';
import { UserRole } from '@shared/enums';
import type { IJwtPayload } from '@shared/interfaces';
import {
    SuccessResponseDto,
    CreatedResponseDto,
    UpdatedResponseDto,
    DeletedResponseDto,
} from '@shared/dtos';
import { AdminSettingsService } from './admin-settings.service';
import { SystemSetting } from './entities/system-setting.entity';
import { Label } from '@modules/labels/label.entity';
import {
    UpdateGeneralSettingsDto,
    UpdateNotificationSettingsDto,
    CreateAdminLabelDto,
    UpdateAdminLabelDto,
} from './dtos';

@ApiTags('Admin - Settings')
@Controller('admin/settings')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminSettingsController {
    constructor(private readonly adminSettingsService: AdminSettingsService) {}

    // ─── System Settings ──────────────────────────────────────────────

    /**
     * GET /admin/settings
     * Get all system settings.
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'System Settings',
        operation: 'getAll',
        summary: 'Get all system settings',
        isArray: true,
        errors: [
            { status: 403, description: 'Forbidden - Admin role required' },
        ],
    })
    async getAllSettings(
        @CurrentUser() user: IJwtPayload,
    ): Promise<SuccessResponseDto<SystemSetting[]>> {
        const settings = await this.adminSettingsService.getAllSettings();
        return new SuccessResponseDto(
            settings,
            'System settings retrieved successfully',
        );
    }

    /**
     * PATCH /admin/settings/general
     * Update general settings.
     */
    @Patch('general')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'General Settings',
        operation: 'update',
        summary: 'Update general settings',
        requestDto: UpdateGeneralSettingsDto,
        errors: [
            { status: 400, description: 'At least one field must be provided' },
            { status: 403, description: 'Forbidden - Admin role required' },
        ],
    })
    async updateGeneralSettings(
        @CurrentUser() user: IJwtPayload,
        @Body() dto: UpdateGeneralSettingsDto,
    ): Promise<UpdatedResponseDto<SystemSetting[]>> {
        const settings = await this.adminSettingsService.updateGeneralSettings(
            user.id,
            dto,
        );
        return new UpdatedResponseDto(
            settings,
            'General settings updated successfully',
        );
    }

    /**
     * PATCH /admin/settings/notifications
     * Update notification settings.
     */
    @Patch('notifications')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Notification Settings',
        operation: 'update',
        summary: 'Update notification settings',
        requestDto: UpdateNotificationSettingsDto,
        errors: [
            { status: 400, description: 'At least one field must be provided' },
            { status: 403, description: 'Forbidden - Admin role required' },
        ],
    })
    async updateNotificationSettings(
        @CurrentUser() user: IJwtPayload,
        @Body() dto: UpdateNotificationSettingsDto,
    ): Promise<UpdatedResponseDto<SystemSetting[]>> {
        const settings =
            await this.adminSettingsService.updateNotificationSettings(
                user.id,
                dto,
            );
        return new UpdatedResponseDto(
            settings,
            'Notification settings updated successfully',
        );
    }

    // ─── Global Default Labels ────────────────────────────────────────

    /**
     * GET /admin/settings/labels
     * List all global default labels.
     */
    @Get('labels')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Global Labels',
        operation: 'getAll',
        summary: 'List all global default labels',
        isArray: true,
        errors: [
            { status: 403, description: 'Forbidden - Admin role required' },
        ],
    })
    async getGlobalLabels(
        @CurrentUser() user: IJwtPayload,
    ): Promise<SuccessResponseDto<Label[]>> {
        const labels = await this.adminSettingsService.getGlobalLabels();
        return new SuccessResponseDto(
            labels,
            'Global labels retrieved successfully',
        );
    }

    /**
     * POST /admin/settings/labels
     * Create a new global default label.
     */
    @Post('labels')
    @HttpCode(HttpStatus.CREATED)
    @ApiSwagger({
        resourceName: 'Global Label',
        operation: 'create',
        summary: 'Create a global default label',
        requestDto: CreateAdminLabelDto,
        successStatus: 201,
        errors: [
            { status: 403, description: 'Forbidden - Admin role required' },
            {
                status: 409,
                description: 'Global label with this name already exists',
            },
        ],
    })
    async createGlobalLabel(
        @CurrentUser() user: IJwtPayload,
        @Body() dto: CreateAdminLabelDto,
    ): Promise<CreatedResponseDto<Label>> {
        const label = await this.adminSettingsService.createGlobalLabel(dto);
        return new CreatedResponseDto(
            label,
            'Global label created successfully',
        );
    }

    /**
     * PATCH /admin/settings/labels/:labelId
     * Update a global default label.
     */
    @Patch('labels/:labelId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Global Label',
        operation: 'update',
        summary: 'Update a global default label',
        paramName: 'labelId',
        requestDto: UpdateAdminLabelDto,
        errors: [
            { status: 400, description: 'At least one field must be provided' },
            { status: 403, description: 'Forbidden - Admin role required' },
            {
                status: 404,
                description: 'Label not found or is project-scoped',
            },
            {
                status: 409,
                description: 'Global label with this name already exists',
            },
        ],
    })
    async updateGlobalLabel(
        @CurrentUser() user: IJwtPayload,
        @Param('labelId', ParseUUIDPipe) labelId: string,
        @Body() dto: UpdateAdminLabelDto,
    ): Promise<UpdatedResponseDto<Label>> {
        const label = await this.adminSettingsService.updateGlobalLabel(
            labelId,
            dto,
        );
        return new UpdatedResponseDto(
            label,
            'Global label updated successfully',
        );
    }

    /**
     * DELETE /admin/settings/labels/:labelId
     * Delete a global default label (hard delete).
     */
    @Delete('labels/:labelId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Global Label',
        operation: 'delete',
        summary: 'Delete a global default label',
        paramName: 'labelId',
        errors: [
            { status: 403, description: 'Forbidden - Admin role required' },
            {
                status: 404,
                description: 'Label not found or is project-scoped',
            },
        ],
    })
    async deleteGlobalLabel(
        @CurrentUser() user: IJwtPayload,
        @Param('labelId', ParseUUIDPipe) labelId: string,
    ): Promise<DeletedResponseDto> {
        await this.adminSettingsService.deleteGlobalLabel(labelId);
        return new DeletedResponseDto('Global label deleted successfully');
    }
}
