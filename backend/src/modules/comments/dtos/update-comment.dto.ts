import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
    @ApiProperty({
        example: 'Updated comment content',
        description: 'Updated comment content text',
    })
    @IsString()
    @MinLength(1)
    content: string;
}
