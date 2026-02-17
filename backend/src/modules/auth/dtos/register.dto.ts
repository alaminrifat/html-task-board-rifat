import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({
        description: 'Full name',
        example: 'John Doe',
    })
    @IsString()
    name: string;

    @ApiProperty({
        description: 'Email address',
        example: 'user@example.com',
        format: 'email',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'Password (minimum 8 characters)',
        example: 'SecurePassword123!',
        minLength: 8,
    })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiProperty({
        description: 'Confirm password',
        example: 'SecurePassword123!',
    })
    @IsString()
    confirmPassword: string;

    @ApiPropertyOptional({
        description: 'Job title',
        example: 'Software Engineer',
    })
    @IsOptional()
    @IsString()
    jobTitle?: string;

    @ApiPropertyOptional({
        description: 'Invitation token to auto-accept after registration',
    })
    @IsOptional()
    @IsString()
    invitationToken?: string;
}
