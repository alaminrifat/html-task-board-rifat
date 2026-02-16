import {
    IsString,
    IsOptional,
    IsEnum,
    IsDateString,
    MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BoardTemplate } from '@shared/enums';

export class CreateProjectDto {
    @ApiProperty({ example: 'My Project', maxLength: 255 })
    @IsString()
    @MaxLength(255)
    title: string;

    @ApiPropertyOptional({ example: 'Project description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        enum: BoardTemplate,
        default: BoardTemplate.DEFAULT,
    })
    @IsOptional()
    @IsEnum(BoardTemplate)
    template?: BoardTemplate;

    @ApiPropertyOptional({ example: '2026-12-31' })
    @IsOptional()
    @IsDateString()
    deadline?: string;
}
