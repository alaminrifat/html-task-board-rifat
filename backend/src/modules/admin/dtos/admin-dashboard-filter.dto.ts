import { IsOptional, IsDateString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminDashboardFilterDto {
    @ApiPropertyOptional({
        description: 'Period type for filtering',
        enum: ['today', '7d', '30d', 'custom'],
        example: '7d',
    })
    @IsOptional()
    @IsIn(['today', '7d', '30d', 'custom'])
    period?: string = '30d';

    @ApiPropertyOptional({
        description: 'Custom date range start (required when period=custom)',
        example: '2024-01-01',
    })
    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @ApiPropertyOptional({
        description: 'Custom date range end (required when period=custom)',
        example: '2024-12-31',
    })
    @IsOptional()
    @IsDateString()
    dateTo?: string;
}
