import {
    IsOptional,
    IsEnum,
    IsString,
    IsDateString,
    IsIn,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@shared/enums';
import { PaginationDto } from '@shared/dtos/pagination.dto';

export class AdminUserFilterDto extends PaginationDto {
    @ApiPropertyOptional({
        description: 'Search by full name or email (case-insensitive)',
        example: 'john',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        enum: UserRole,
        description: 'Filter by user role',
    })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @ApiPropertyOptional({
        enum: UserStatus,
        description:
            'Filter by user status (deleted users only shown with status=DELETED)',
    })
    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;

    @ApiPropertyOptional({
        description: 'Filter users created from this date',
        example: '2024-01-01',
    })
    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @ApiPropertyOptional({
        description: 'Filter users created up to this date',
        example: '2024-12-31',
    })
    @IsOptional()
    @IsDateString()
    dateTo?: string;

    @ApiPropertyOptional({
        description: 'Sort by field',
        enum: [
            'full_name',
            'email',
            'role',
            'status',
            'created_at',
            'last_active_at',
        ],
        example: 'created_at',
    })
    @IsOptional()
    @IsIn([
        'full_name',
        'email',
        'role',
        'status',
        'created_at',
        'last_active_at',
    ])
    declare sortBy?: string;

    @ApiPropertyOptional({
        description: 'Sort order',
        enum: ['ASC', 'DESC'],
        example: 'DESC',
    })
    @IsOptional()
    @IsIn(['ASC', 'DESC'])
    declare sortOrder?: 'ASC' | 'DESC';
}
