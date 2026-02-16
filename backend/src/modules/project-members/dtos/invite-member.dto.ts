import { IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectRole } from '@shared/enums';

export class InviteMemberDto {
    @ApiProperty({
        example: 'user@example.com',
        description: 'Email of the user to invite',
    })
    @IsEmail()
    email: string;

    @ApiPropertyOptional({
        enum: ProjectRole,
        default: ProjectRole.MEMBER,
        description: 'Role to assign to the invited member',
    })
    @IsOptional()
    @IsEnum(ProjectRole)
    role?: ProjectRole;
}
