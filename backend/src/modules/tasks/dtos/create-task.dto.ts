import {
    IsString,
    IsOptional,
    IsEnum,
    IsUUID,
    IsDateString,
    MaxLength,
    IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority } from '@shared/enums';

export class CreateTaskDto {
    @ApiProperty({ example: 'Implement login page', maxLength: 500 })
    @IsString()
    @MaxLength(500)
    title: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @ApiProperty({ description: 'Column UUID to place task in' })
    @IsUUID()
    columnId: string;

    @ApiPropertyOptional({ description: 'Assignee user UUID' })
    @IsOptional()
    @IsUUID()
    assigneeId?: string;

    @ApiPropertyOptional({ example: '2026-12-31' })
    @IsOptional()
    @IsDateString()
    dueDate?: string;

    @ApiPropertyOptional({
        description: 'Array of label UUIDs',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    labelIds?: string[];
}
