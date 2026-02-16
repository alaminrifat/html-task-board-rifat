import {
    IsString,
    IsOptional,
    MinLength,
    MaxLength,
    Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAdminLabelDto {
    @ApiPropertyOptional({
        example: 'Bug',
        description: 'Label name (1-100 characters)',
        minLength: 1,
        maxLength: 100,
    })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    name?: string;

    @ApiPropertyOptional({
        example: '#E53E3E',
        description: 'Hex color code (e.g., #FF0000)',
    })
    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/, {
        message: 'Color must be a valid hex color code (e.g., #FF0000)',
    })
    color?: string;
}
