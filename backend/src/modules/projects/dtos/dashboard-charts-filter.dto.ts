import { IsOptional, IsDateString, IsUUID, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority } from '@shared/enums';

export class DashboardChartsFilterDto {
    @ApiPropertyOptional({
        description: 'Filter from date (ISO date string)',
        example: '2026-01-01',
    })
    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @ApiPropertyOptional({
        description: 'Filter to date (ISO date string)',
        example: '2026-12-31',
    })
    @IsOptional()
    @IsDateString()
    dateTo?: string;

    @ApiPropertyOptional({
        description: 'Filter by assignee user ID',
        format: 'uuid',
    })
    @IsOptional()
    @IsUUID()
    assigneeId?: string;

    @ApiPropertyOptional({
        description: 'Filter by task priority',
        enum: TaskPriority,
    })
    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;
}
