import {
    Controller,
    Get,
    Patch,
    Post,
    Delete,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSwagger, CurrentUser } from '@core/decorators';
import type { IJwtPayload } from '@shared/interfaces';
import {
    PaginatedResponseDto,
    SuccessResponseDto,
    DeletedResponseDto,
} from '@shared/dtos/response.dto';
import { PaginationDto } from '@shared/dtos/pagination.dto';
import { Notification } from './notification.entity';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    /**
     * GET /notifications
     * List the authenticated user's notifications (paginated).
     * Response includes an `unreadCount` field alongside the paginated data.
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Notifications',
        operation: 'getAll',
        isArray: true,
        withPagination: true,
    })
    async findAll(
        @CurrentUser() user: IJwtPayload,
        @Query() pagination: PaginationDto,
    ): Promise<PaginatedResponseDto<Notification> & { unreadCount: number }> {
        const result = await this.notificationsService.getNotifications(
            user.id,
            pagination,
        );

        const response = new PaginatedResponseDto<Notification>(
            result.data,
            result.page,
            result.limit,
            result.total,
            'Notifications retrieved successfully',
        );

        return Object.assign(response, { unreadCount: result.unreadCount });
    }

    /**
     * PATCH /notifications/:id/read
     * Mark a single notification as read.
     */
    @Patch(':id/read')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Notification',
        operation: 'update',
        paramName: 'id',
        summary: 'Mark notification as read',
    })
    async markAsRead(
        @CurrentUser() user: IJwtPayload,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<SuccessResponseDto<Notification>> {
        const notification = await this.notificationsService.markAsRead(
            user.id,
            id,
        );
        return new SuccessResponseDto(
            notification,
            'Notification marked as read',
        );
    }

    /**
     * POST /notifications/read-all
     * Mark all of the authenticated user's notifications as read.
     */
    @Post('read-all')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Notifications',
        operation: 'custom',
        summary: 'Mark all notifications as read',
    })
    async markAllAsRead(
        @CurrentUser() user: IJwtPayload,
    ): Promise<SuccessResponseDto<null>> {
        await this.notificationsService.markAllAsRead(user.id);
        return new SuccessResponseDto(null, 'All notifications marked as read');
    }

    /**
     * DELETE /notifications/:id
     * Delete a notification.
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Notification',
        operation: 'delete',
        paramName: 'id',
    })
    async remove(
        @CurrentUser() user: IJwtPayload,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<DeletedResponseDto> {
        await this.notificationsService.deleteNotification(user.id, id);
        return new DeletedResponseDto('Notification deleted successfully');
    }
}
