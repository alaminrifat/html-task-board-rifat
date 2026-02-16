import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@shared/enums';

export class AdminProjectExportFilterDto {
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
        enum: ProjectStatus,
        description: 'Filter by project status',
    })
    @IsOptional()
    @IsEnum(ProjectStatus)
    status?: ProjectStatus;
}
