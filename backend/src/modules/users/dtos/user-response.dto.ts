import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@shared/enums';

export class UserResponseDto {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'User unique identifier (UUID)',
    })
    id: string;

    @ApiProperty({
        example: 'user@example.com',
        description: 'User email address',
    })
    email: string;

    @ApiPropertyOptional({
        example: 'John',
        description: 'User first name',
    })
    firstName?: string;

    @ApiPropertyOptional({
        example: 'Doe',
        description: 'User last name',
    })
    lastName?: string;

    @ApiProperty({
        example: 'John Doe',
        description: 'User full name',
    })
    fullName: string;

    @ApiProperty({
        enum: UserRole,
        example: UserRole.TEAM_MEMBER,
        description: 'User role',
    })
    role: UserRole;

    @ApiProperty({
        enum: UserStatus,
        example: UserStatus.ACTIVE,
        description: 'User status',
    })
    status: UserStatus;

    @ApiProperty({
        example: false,
        description: 'Whether user email is verified',
    })
    emailVerified: boolean;

    @ApiPropertyOptional({
        example: 'https://example.com/avatar.jpg',
        description: 'User profile photo URL',
    })
    avatarUrl?: string | null;

    @ApiProperty({
        example: '2024-11-02T10:30:00.000Z',
        description: 'Record creation timestamp',
    })
    createdAt: Date;

    @ApiProperty({
        example: '2024-11-02T10:30:00.000Z',
        description: 'Record last update timestamp',
    })
    updatedAt: Date;

    @ApiPropertyOptional({
        example: null,
        description: 'Record deletion timestamp (soft delete)',
    })
    deletedAt?: Date | null;
}
