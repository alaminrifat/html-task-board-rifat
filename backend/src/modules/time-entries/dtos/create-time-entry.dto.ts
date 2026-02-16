import { IsOptional, IsString, IsInt, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateManualTimeEntryDto {
    @ApiProperty({ example: 60, description: 'Duration in minutes' })
    @IsInt()
    @Min(1)
    durationMinutes: number;

    @ApiPropertyOptional({ maxLength: 500 })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;
}
