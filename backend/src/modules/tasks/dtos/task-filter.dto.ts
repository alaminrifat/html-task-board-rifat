import { IsOptional, IsEnum, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority } from '@shared/enums';
import { PaginationDto } from '@shared/dtos/pagination.dto';

export class TaskFilterDto extends PaginationDto {
    @ApiPropertyOptional({ enum: TaskPriority })
    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    assigneeId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    labelId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    search?: string;
}
