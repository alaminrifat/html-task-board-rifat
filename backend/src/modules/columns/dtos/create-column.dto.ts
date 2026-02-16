import { IsString, IsOptional, IsInt, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateColumnDto {
    @ApiProperty({ example: 'In Progress', maxLength: 100 })
    @IsString()
    @MaxLength(100)
    title: string;

    @ApiPropertyOptional({ example: 5 })
    @IsOptional()
    @IsInt()
    @Min(0)
    wipLimit?: number;
}
