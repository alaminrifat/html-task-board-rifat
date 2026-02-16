import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
    UseGuards,
    Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ApiSwagger, CurrentUser } from '@core/decorators';
import { Roles } from '@core/decorators/roles.decorator';
import { RolesGuard } from '@core/guards/roles.guard';
import { UserRole } from '@shared/enums';
import type { IJwtPayload } from '@shared/interfaces';
import {
    SuccessResponseDto,
    CreatedResponseDto,
    PaginatedResponseDto,
    DeletedResponseDto,
} from '@shared/dtos/response.dto';

import { AdminUsersService } from './admin-users.service';
import {
    AdminUserFilterDto,
    CreateAdminUserDto,
    UpdateAdminUserDto,
    ChangeUserStatusDto,
    ChangeUserRoleDto,
    BulkUserActionDto,
    AdminExportFilterDto,
} from './dtos';

@ApiTags('Admin - Users')
@Controller('admin/users')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
    constructor(private readonly adminUsersService: AdminUsersService) {}

    // ═══════════════════════════════════════════════════════════════════════
    // 1. GET /admin/users — List all users (paginated, filtered, sorted)
    // ═══════════════════════════════════════════════════════════════════════

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Admin Users',
        operation: 'getAll',
        summary:
            'List all users with search, filtering, sorting and pagination',
        isArray: true,
        withPagination: true,
    })
    async listUsers(
        @Query() filters: AdminUserFilterDto,
    ): Promise<PaginatedResponseDto<any>> {
        const result = await this.adminUsersService.listUsers(filters);
        return new PaginatedResponseDto(
            result.data,
            result.page,
            result.limit,
            result.total,
            'Users retrieved successfully',
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. POST /admin/users — Create user from admin panel
    // ═══════════════════════════════════════════════════════════════════════

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiSwagger({
        resourceName: 'Admin User',
        operation: 'create',
        summary: 'Create a new user from admin panel',
        successStatus: 201,
        errors: [
            { status: 400, description: 'Invalid input data' },
            { status: 409, description: 'User with this email already exists' },
        ],
    })
    async createUser(
        @Body() dto: CreateAdminUserDto,
    ): Promise<CreatedResponseDto<any>> {
        const user = await this.adminUsersService.createUser(dto);
        return new CreatedResponseDto(user, 'User created successfully');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 10. GET /admin/users/export — Export users as CSV
    //     (defined before :id routes to avoid route conflicts)
    // ═══════════════════════════════════════════════════════════════════════

    @Get('export')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Admin Users Export',
        operation: 'custom',
        summary: 'Export users as CSV file',
        errors: [
            {
                status: 422,
                description: 'Export limit exceeded (max 10,000 rows)',
            },
        ],
    })
    async exportUsers(
        @Query() filters: AdminExportFilterDto,
        @Res() res: Response,
    ): Promise<void> {
        const csv = await this.adminUsersService.exportUsersCsv(filters);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`,
        );
        res.send(csv);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 9. POST /admin/users/bulk — Bulk action on multiple users
    //    (defined before :id routes to avoid route conflicts)
    // ═══════════════════════════════════════════════════════════════════════

    @Post('bulk')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Admin Users Bulk',
        operation: 'custom',
        summary:
            'Perform bulk action on multiple users (activate, suspend, delete)',
        errors: [{ status: 400, description: 'Invalid input data' }],
    })
    async bulkAction(
        @CurrentUser() user: IJwtPayload,
        @Body() dto: BulkUserActionDto,
    ): Promise<SuccessResponseDto<any>> {
        const result = await this.adminUsersService.bulkAction(user.id, dto);
        return new SuccessResponseDto(result, 'Bulk action completed');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. GET /admin/users/:id — Get detailed user profile with stats
    // ═══════════════════════════════════════════════════════════════════════

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Admin User',
        operation: 'getOne',
        summary: 'Get detailed user profile with projects and stats',
        errors: [{ status: 404, description: 'User not found' }],
    })
    async getUserDetail(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<SuccessResponseDto<any>> {
        const user = await this.adminUsersService.getUserDetail(id);
        return new SuccessResponseDto(
            user,
            'User details retrieved successfully',
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. PATCH /admin/users/:id — Update user profile
    // ═══════════════════════════════════════════════════════════════════════

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Admin User',
        operation: 'update',
        summary: 'Update user profile (name, job title, avatar only)',
        errors: [
            { status: 400, description: 'Invalid input data' },
            { status: 404, description: 'User not found' },
        ],
    })
    async updateUser(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateAdminUserDto,
    ): Promise<SuccessResponseDto<any>> {
        const user = await this.adminUsersService.updateUser(id, dto);
        return new SuccessResponseDto(user, 'User updated successfully');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 5. PATCH /admin/users/:id/status — Change user status
    // ═══════════════════════════════════════════════════════════════════════

    @Patch(':id/status')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Admin User Status',
        operation: 'custom',
        summary: 'Change user status (activate or suspend)',
        errors: [
            { status: 403, description: 'Cannot suspend yourself' },
            { status: 404, description: 'User not found' },
            {
                status: 422,
                description: 'Cannot change status of a deleted user',
            },
        ],
    })
    async changeStatus(
        @CurrentUser() user: IJwtPayload,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ChangeUserStatusDto,
    ): Promise<SuccessResponseDto<any>> {
        const result = await this.adminUsersService.changeStatus(
            user.id,
            id,
            dto,
        );
        return new SuccessResponseDto(
            result,
            'User status updated successfully',
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 6. PATCH /admin/users/:id/role — Change user role
    // ═══════════════════════════════════════════════════════════════════════

    @Patch(':id/role')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Admin User Role',
        operation: 'custom',
        summary: 'Change user role (project_owner or team_member)',
        errors: [
            { status: 400, description: 'Cannot promote to admin' },
            { status: 403, description: 'Cannot change admin role' },
            { status: 404, description: 'User not found' },
        ],
    })
    async changeRole(
        @CurrentUser() user: IJwtPayload,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ChangeUserRoleDto,
    ): Promise<SuccessResponseDto<any>> {
        const result = await this.adminUsersService.changeRole(
            user.id,
            id,
            dto,
        );
        return new SuccessResponseDto(result, 'User role updated successfully');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 7. POST /admin/users/:id/reset-password — Admin-initiated password reset
    // ═══════════════════════════════════════════════════════════════════════

    @Post(':id/reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Admin Password Reset',
        operation: 'custom',
        summary: 'Initiate password reset for a user',
        errors: [
            { status: 404, description: 'User not found' },
            {
                status: 422,
                description: 'Cannot reset password for deleted user',
            },
        ],
    })
    async resetPassword(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<SuccessResponseDto<any>> {
        const result = await this.adminUsersService.resetPassword(id);
        return new SuccessResponseDto(result, result.message);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 8. DELETE /admin/users/:id — Soft-delete user
    // ═══════════════════════════════════════════════════════════════════════

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Admin User',
        operation: 'delete',
        summary: 'Soft-delete a user account',
        errors: [
            {
                status: 403,
                description: 'Cannot delete yourself or another admin',
            },
            { status: 404, description: 'User not found' },
            {
                status: 422,
                description: 'User owns active projects with other members',
            },
        ],
    })
    async deleteUser(
        @CurrentUser() user: IJwtPayload,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<DeletedResponseDto> {
        await this.adminUsersService.deleteUser(user.id, id);
        return new DeletedResponseDto('User deleted successfully');
    }
}
