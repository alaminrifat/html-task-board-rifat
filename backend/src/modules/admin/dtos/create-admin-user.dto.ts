import {
    IsString,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@shared/enums';

export class CreateAdminUserDto {
    @ApiProperty({
        description: 'Full name of the user',
        example: 'John Doe',
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    name: string;

    @ApiProperty({
        description: 'Email address',
        example: 'john.doe@example.com',
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'User role (admin role cannot be assigned)',
        enum: [UserRole.PROJECT_OWNER, UserRole.TEAM_MEMBER],
        example: UserRole.TEAM_MEMBER,
    })
    @IsNotEmpty()
    @IsEnum([UserRole.PROJECT_OWNER, UserRole.TEAM_MEMBER], {
        message: 'Role must be PROJECT_OWNER or TEAM_MEMBER',
    })
    role: UserRole.PROJECT_OWNER | UserRole.TEAM_MEMBER;
}
