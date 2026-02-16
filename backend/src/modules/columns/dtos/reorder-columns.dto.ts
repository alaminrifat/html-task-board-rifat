import { IsArray, ValidateNested, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class ColumnPositionDto {
    @ApiProperty()
    @IsUUID()
    id: string;

    @ApiProperty()
    @IsInt()
    @Min(0)
    position: number;
}

export class ReorderColumnsDto {
    @ApiProperty({ type: [ColumnPositionDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ColumnPositionDto)
    columns: ColumnPositionDto[];
}
