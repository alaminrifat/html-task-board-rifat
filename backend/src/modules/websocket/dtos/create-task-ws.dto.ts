import {
    IsString,
    IsOptional,
    IsEnum,
    IsUUID,
    IsDateString,
    MaxLength,
    IsArray,
} from 'class-validator';
import { TaskPriority } from '@shared/enums';

export class CreateTaskWsDto {
    @IsUUID()
    columnId: string;

    @IsString()
    @MaxLength(500)
    title: string;

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
