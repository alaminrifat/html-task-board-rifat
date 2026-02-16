import { ApiProperty } from '@nestjs/swagger';
import {
    IsBoolean,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';
import { SocialLoginType } from '../enums/social-login-type.enum';

export class SocialLoginDto {
    @ApiProperty({
        example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkazcifQ...',
        description: 'Social login token (Google, Kakao, Naver, etc.)',
    })
    @IsNotEmpty()
    @IsString()
    token: string;

    @ApiProperty({ example: 'John Doe' })
    @IsNotEmpty()
    @IsString()
    fullName: string;

    @ApiProperty({ example: 'john.doe@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        enum: SocialLoginType,
        example: SocialLoginType.GOOGLE,
    })
    @IsEnum(SocialLoginType)
    @IsNotEmpty()
    socialLoginType: SocialLoginType;

    @ApiProperty({
        example: false,
        description: 'Keep user logged in for 30 days instead of 1 day',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    rememberMe?: boolean;

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    @IsBoolean()
    termsAndConditionsAccepted?: boolean;
}
