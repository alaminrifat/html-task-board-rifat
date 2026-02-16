import {
    IsString,
    IsOptional,
    IsEnum,
    IsUUID,
    IsDateString,
    MaxLength,
    IsArray,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TaskPriority } from '@shared/enums';

export class UpdateTaskChangesDto {
    @IsOptional()
    @IsString()
    @MaxLength(500)
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @IsOptional()
    @IsUUID()
    assigneeId?: string;

    @IsOptional()
    @IsDateString()
    dueDate?: string;

    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    labelIds?: string[];
}

export class UpdateTaskWsDto {
    @IsUUID()
    taskId: string;

    @ValidateNested()
    @Type(() => UpdateTaskChangesDto)
    changes: UpdateTaskChangesDto;
}
