import { IsUUID, IsInt, Min } from 'class-validator';

export class MoveTaskWsDto {
    @IsUUID()
    taskId: string;

    @IsUUID()
    targetColumnId: string;

    @IsInt()
    @Min(0)
    position: number;
}
