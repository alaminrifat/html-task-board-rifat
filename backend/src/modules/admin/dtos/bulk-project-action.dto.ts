import {
    IsArray,
    IsEnum,
    IsNotEmpty,
    IsUUID,
    ArrayMinSize,
    ArrayMaxSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum BulkProjectAction {
    ARCHIVE = 'archive',
    DELETE = 'delete',
}

export class BulkProjectActionDto {
    @ApiProperty({
        description: 'Array of project IDs to perform the action on (1-100)',
        type: [String],
        example: ['uuid-1', 'uuid-2'],
    })
    @IsNotEmpty()
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(100)
    @IsUUID('4', { each: true })
    projectIds: string[];

    @ApiProperty({
        description: 'Bulk action to perform on projects',
        enum: BulkProjectAction,
        example: BulkProjectAction.ARCHIVE,
    })
    @IsNotEmpty()
    @IsEnum(BulkProjectAction)
    action: BulkProjectAction;
}
