import {
    IsArray,
    IsEnum,
    IsNotEmpty,
    IsUUID,
    ArrayMinSize,
    ArrayMaxSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum BulkAction {
    ACTIVATE = 'activate',
    SUSPEND = 'suspend',
    DELETE = 'delete',
}

export class BulkUserActionDto {
    @ApiProperty({
        description: 'Array of user IDs to perform the action on (1-100)',
        type: [String],
        example: ['uuid-1', 'uuid-2'],
    })
    @IsNotEmpty()
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(100)
    @IsUUID('4', { each: true })
    userIds: string[];

    @ApiProperty({
        description: 'Bulk action to perform',
        enum: BulkAction,
        example: BulkAction.SUSPEND,
    })
    @IsNotEmpty()
    @IsEnum(BulkAction)
    action: BulkAction;
}
