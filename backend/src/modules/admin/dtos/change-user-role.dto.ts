import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@shared/enums';

export class ChangeUserRoleDto {
    @ApiProperty({
        description: 'New user role (cannot promote to admin)',
        enum: [UserRole.PROJECT_OWNER, UserRole.TEAM_MEMBER],
        example: UserRole.PROJECT_OWNER,
    })
    @IsNotEmpty()
    @IsEnum([UserRole.PROJECT_OWNER, UserRole.TEAM_MEMBER], {
        message: 'Role must be PROJECT_OWNER or TEAM_MEMBER',
    })
    role: UserRole.PROJECT_OWNER | UserRole.TEAM_MEMBER;
}
