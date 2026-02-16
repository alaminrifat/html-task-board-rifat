import { IsUUID } from 'class-validator';

export class DeleteTaskWsDto {
    @IsUUID()
    taskId: string;
}
