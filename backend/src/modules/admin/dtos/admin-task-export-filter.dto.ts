import {
    IsOptional,
    IsString,
    IsEnum,
    IsDateString,
    IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority } from '@shared/enums';

export class AdminTaskExportFilterDto {
    @ApiPropertyOptional({
        description: 'Filter tasks created from this date',
        example: '2024-01-01',
    })
    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @ApiPropertyOptional({
        description: 'Filter tasks created up to this date',
        example: '2024-12-31',
    })
    @IsOptional()
    @IsDateString()
    dateTo?: string;

    @ApiPropertyOptional({
        description: 'Filter by project ID',
        example: 'uuid',
    })
    @IsOptional()
    @IsUUID('4')
    projectId?: string;

    @ApiPropertyOptional({
        description: 'Filter by column name (status)',
        example: 'In Progress',
    })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional({
        enum: TaskPriority,
        description: 'Filter by task priority',
    })
    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;
}
