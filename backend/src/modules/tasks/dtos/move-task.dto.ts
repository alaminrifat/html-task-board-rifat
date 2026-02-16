import { IsUUID, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MoveTaskDto {
    @ApiProperty({ description: 'Target column UUID' })
    @IsUUID()
    columnId: string;

    @ApiProperty({ description: 'New position in target column' })
    @IsInt()
    @Min(0)
    position: number;
}
