import { IsString, IsOptional, IsUUID, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
    @ApiProperty({
        example: 'This looks great!',
        description: 'Comment content text',
    })
    @IsString()
    @MinLength(1)
    content: string;

    @ApiPropertyOptional({
        description:
            'Parent comment ID for replies (null for top-level comments)',
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    })
    @IsOptional()
    @IsUUID()
    parentId?: string;
}
