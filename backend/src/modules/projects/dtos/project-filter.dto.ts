import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@shared/enums';
import { PaginationDto } from '@shared/dtos/pagination.dto';

export class ProjectFilterDto extends PaginationDto {
    @ApiPropertyOptional({ enum: ProjectStatus })
    @IsOptional()
    @IsEnum(ProjectStatus)
    status?: ProjectStatus;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    search?: string;
}
