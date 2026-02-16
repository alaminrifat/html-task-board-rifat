import { IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RescheduleTaskDto {
    @ApiProperty({
        description: 'New due date in YYYY-MM-DD format',
        example: '2026-03-15',
    })
    @IsNotEmpty()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'dueDate must be in YYYY-MM-DD format',
    })
    dueDate: string;
}
