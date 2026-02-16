import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardFilterDto {
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
}
