import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubTaskDto {
    @ApiProperty({ example: 'Write unit tests', maxLength: 500 })
    @IsString()
    @MaxLength(500)
    title: string;
}
