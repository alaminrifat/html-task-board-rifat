import { IsArray, ValidateNested, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class SubTaskPositionDto {
    @ApiProperty()
    @IsUUID()
    id: string;

    @ApiProperty()
    @IsInt()
    @Min(0)
    position: number;
}

export class ReorderSubTasksDto {
    @ApiProperty({ type: [SubTaskPositionDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SubTaskPositionDto)
    subTasks: SubTaskPositionDto[];
}
