import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminLabelDto {
    @ApiProperty({
        example: 'Bug',
        description: 'Label name (1-100 characters)',
        minLength: 1,
        maxLength: 100,
    })
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    name: string;

    @ApiProperty({
        example: '#E53E3E',
        description: 'Hex color code (e.g., #FF0000)',
    })
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/, {
        message: 'Color must be a valid hex color code (e.g., #FF0000)',
    })
    color: string;
}
