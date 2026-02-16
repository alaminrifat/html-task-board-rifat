import {
    IsOptional,
    IsEnum,
    IsString,
    IsDateString,
    IsIn,
    IsInt,
    Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProjectStatus } from '@shared/enums';
import { PaginationDto } from '@shared/dtos/pagination.dto';

export class AdminProjectFilterDto extends PaginationDto {
    @ApiPropertyOptional({
        description: 'Search by project title or owner name (case-insensitive)',
        example: 'marketing',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        enum: ProjectStatus,
        description: 'Filter by project status',
    })
    @IsOptional()
    @IsEnum(ProjectStatus)
    status?: ProjectStatus;

    @ApiPropertyOptional({
        description: 'Filter projects created from this date',
        example: '2024-01-01',
    })
    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @ApiPropertyOptional({
        description: 'Filter projects created up to this date',
        example: '2024-12-31',
    })
    @IsOptional()
    @IsDateString()
    dateTo?: string;

    @ApiPropertyOptional({
        description: 'Minimum number of members',
        example: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    membersMin?: number;

    @ApiPropertyOptional({
        description: 'Maximum number of members',
        example: 50,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    membersMax?: number;

    @ApiPropertyOptional({
        description: 'Sort by field',
        enum: [
            'title',
            'owner_name',
            'status',
            'members_count',
            'tasks_count',
            'completion_percent',
            'created_at',
            'deadline',
        ],
        example: 'created_at',
    })
    @IsOptional()
    @IsIn([
        'title',
        'owner_name',
        'status',
        'members_count',
        'tasks_count',
        'completion_percent',
        'created_at',
        'deadline',
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
