import {
    Controller,
    Get,
    Query,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSwagger } from '@core/decorators/api-swagger.decorator';
import { CurrentUser } from '@core/decorators/current-user.decorator';
import { Roles } from '@core/decorators/roles.decorator';
import { RolesGuard } from '@core/guards/roles.guard';
import type { IJwtPayload } from '@shared/interfaces';
import { UserRole } from '@shared/enums';
import { SuccessResponseDto } from '@shared/dtos/response.dto';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDashboardFilterDto } from './dtos';

@ApiTags('Admin - Dashboard')
@Controller('admin/dashboard')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminDashboardController {
    constructor(private readonly dashboardService: AdminDashboardService) {}

    /**
     * GET /admin/dashboard/stats
     * Overview stats: total users, projects, tasks, active users.
     */
    @Get('stats')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Dashboard Stats',
        operation: 'custom',
        summary: 'Get admin dashboard statistics',
    })
    async getStats(
        @CurrentUser() user: IJwtPayload,
        @Query() filter: AdminDashboardFilterDto,
    ): Promise<SuccessResponseDto> {
        const stats = await this.dashboardService.getStats(filter);
        return new SuccessResponseDto(
            stats,
            'Dashboard stats retrieved successfully',
        );
    }

    /**
     * GET /admin/dashboard/charts
     * Chart data: registration trend, project creation trend, task completion rate, top active projects.
     */
    @Get('charts')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Dashboard Charts',
        operation: 'custom',
        summary: 'Get admin dashboard chart data',
    })
    async getCharts(
        @CurrentUser() user: IJwtPayload,
        @Query() filter: AdminDashboardFilterDto,
    ): Promise<SuccessResponseDto> {
        const charts = await this.dashboardService.getCharts(filter);
        return new SuccessResponseDto(
            charts,
            'Dashboard charts retrieved successfully',
        );
    }

    /**
     * GET /admin/dashboard/recent-activity
     * Latest 10 activity logs across all projects.
     */
    @Get('recent-activity')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Recent Activity',
        operation: 'custom',
        summary: 'Get recent activity across all projects',
        isArray: true,
    })
    async getRecentActivity(
        @CurrentUser() user: IJwtPayload,
    ): Promise<SuccessResponseDto> {
        const activities = await this.dashboardService.getRecentActivity();
        return new SuccessResponseDto(
            activities,
            'Recent activity retrieved successfully',
        );
    }
}
