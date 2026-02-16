import { IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DigestFrequency } from '@shared/enums';

export class UpdateNotificationPrefsDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    pushEnabled?: boolean;

    @ApiPropertyOptional({ enum: DigestFrequency })
    @IsOptional()
    @IsEnum(DigestFrequency)
    digestFrequency?: DigestFrequency;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    notifyTaskAssigned?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    notifyDueDateReminder?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    notifyStatusChange?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    notifyCommentMention?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    notifyNewComment?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    notifyInvitation?: boolean;
}
