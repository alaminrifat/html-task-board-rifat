import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty({ example: 'abc123-reset-token' })
    @IsNotEmpty()
    @IsString()
    token: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    @MaxLength(17)
    password: string;
}
