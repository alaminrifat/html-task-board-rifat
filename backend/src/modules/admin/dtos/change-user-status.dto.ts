import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@shared/enums';

export class ChangeUserStatusDto {
    @ApiProperty({
        description: 'New user status',
        enum: [UserStatus.ACTIVE, UserStatus.SUSPENDED],
        example: UserStatus.SUSPENDED,
    })
    @IsNotEmpty()
    @IsEnum([UserStatus.ACTIVE, UserStatus.SUSPENDED], {
        message: 'Status must be ACTIVE or SUSPENDED',
    })
    status: UserStatus.ACTIVE | UserStatus.SUSPENDED;
}
