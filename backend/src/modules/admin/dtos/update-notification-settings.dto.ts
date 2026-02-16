import {
    IsOptional,
    IsBoolean,
    IsEnum,
    IsNumber,
    Min,
    Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DigestFrequency } from '@shared/enums';

export class UpdateNotificationSettingsDto {
    @ApiPropertyOptional({
        example: true,
        description: 'Whether global email notifications are enabled',
    })
    @IsOptional()
    @IsBoolean()
    globalEmailEnabled?: boolean;

    @ApiPropertyOptional({
        example: 'DAILY',
        description: 'Default digest frequency for new users',
        enum: DigestFrequency,
    })
    @IsOptional()
    @IsEnum(DigestFrequency)
    defaultDigestFrequency?: DigestFrequency;

    @ApiPropertyOptional({
        example: 24,
        description: 'Hours before deadline to send reminder (1-168)',
        minimum: 1,
        maximum: 168,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(168)
    deadlineReminderHours?: number;
}
