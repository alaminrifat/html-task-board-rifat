import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAdminUserDto {
    @ApiPropertyOptional({
        description: 'Full name of the user',
        example: 'John Doe',
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string;

    @ApiPropertyOptional({
        description: 'Job title',
        example: 'Senior Developer',
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    jobTitle?: string;

    @ApiPropertyOptional({
        description: 'Avatar URL',
        example: 'https://example.com/avatar.png',
    })
    @IsOptional()
    @IsString()
    @MaxLength(512)
    avatarUrl?: string;
}
