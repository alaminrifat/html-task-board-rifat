import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CalendarFilterDto {
    @ApiPropertyOptional({
        description: 'Month (1-12), defaults to current month',
        example: 2,
        minimum: 1,
        maximum: 12,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(12)
    month?: number;

    @ApiPropertyOptional({
        description: 'Year (4-digit), defaults to current year',
        example: 2026,
        minimum: 2000,
        maximum: 2100,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(2000)
    @Max(2100)
    year?: number;
}
