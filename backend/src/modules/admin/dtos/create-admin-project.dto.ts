import {
    IsString,
    IsOptional,
    IsEnum,
    IsDateString,
    IsUUID,
    IsBoolean,
    MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BoardTemplate, ProjectStatus } from '@shared/enums';

export class CreateAdminProjectDto {
    @ApiProperty({ example: 'My Project', maxLength: 255 })
    @IsString()
    @MaxLength(255)
    title: string;

    @ApiPropertyOptional({ example: 'Project description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: 'User ID of the project owner',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsUUID()
    ownerId: string;

    @ApiPropertyOptional({
        enum: BoardTemplate,
        default: BoardTemplate.DEFAULT,
    })
    @IsOptional()
    @IsEnum(BoardTemplate)
    template?: BoardTemplate;

    @ApiPropertyOptional({ example: '2026-01-01' })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ example: '2026-12-31' })
    @IsOptional()
    @IsDateString()
    deadline?: string;

    @ApiPropertyOptional({
        enum: [ProjectStatus.ACTIVE, ProjectStatus.COMPLETED],
        default: ProjectStatus.ACTIVE,
    })
    @IsOptional()
    @IsEnum(ProjectStatus)
    status?: ProjectStatus;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    notifyTeam?: boolean;
}
