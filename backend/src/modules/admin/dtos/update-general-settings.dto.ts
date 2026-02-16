import {
    IsString,
    IsOptional,
    IsArray,
    IsNumber,
    MinLength,
    MaxLength,
    Min,
    Max,
    ArrayMinSize,
    ArrayMaxSize,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateGeneralSettingsDto {
    @ApiPropertyOptional({
        example: 'TaskBoard',
        description: 'Application name (1-100 characters)',
        minLength: 1,
        maxLength: 100,
    })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    appName?: string;

    @ApiPropertyOptional({
        example: ['To Do', 'In Progress', 'Done'],
        description: 'Default columns for new board templates (1-10 items)',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(1)
    @ArrayMaxSize(10)
    defaultTemplateColumns?: string[];

    @ApiPropertyOptional({
        example: 10485760,
        description: 'Maximum file upload size in bytes (1MB - 50MB)',
        minimum: 1048576,
        maximum: 52428800,
    })
    @IsOptional()
    @IsNumber()
    @Min(1048576)
    @Max(52428800)
    maxFileUploadSize?: number;

    @ApiPropertyOptional({
        example: ['image/png', 'image/jpeg', 'application/pdf'],
        description: 'Allowed file types for upload (1-20 items)',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(1)
    @ArrayMaxSize(20)
    allowedFileTypes?: string[];
}
