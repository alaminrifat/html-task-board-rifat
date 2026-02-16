import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@shared/enums';

export class AdminExportFilterDto {
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
        description: 'Filter by user status',
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
}
