import { IsString, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLabelDto {
    @ApiProperty({ example: 'Bug', maxLength: 100 })
    @IsString()
    @MaxLength(100)
    name: string;

    @ApiProperty({ example: '#E53E3E', description: 'Hex color code' })
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/, {
        message: 'Color must be a valid hex color code',
    })
    color: string;
}
