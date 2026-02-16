import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDeviceDto {
    @ApiProperty({ description: 'Push notification token' })
    @IsString()
    @MaxLength(500)
    token: string;

    @ApiProperty({ example: 'ios', description: 'ios/android/web' })
    @IsString()
    @MaxLength(10)
    platform: string;

    @ApiPropertyOptional({ example: 'iPhone 15 Pro' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    deviceName?: string;
}
