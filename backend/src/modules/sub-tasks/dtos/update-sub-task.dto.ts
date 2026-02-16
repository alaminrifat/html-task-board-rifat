import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSubTaskDto {
    @ApiPropertyOptional({ maxLength: 500 })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    title?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isCompleted?: boolean;
}
