import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSwagger } from '@core/decorators';
import { CurrentUser } from '@core/decorators';
import type { IJwtPayload } from '@shared/interfaces';
import {
    SuccessResponseDto,
    CreatedResponseDto,
    UpdatedResponseDto,
    DeletedResponseDto,
} from '@shared/dtos';
import { ColumnsService } from './columns.service';
import { BoardColumn } from './column.entity';
import { CreateColumnDto, UpdateColumnDto, ReorderColumnsDto } from './dtos';

@ApiTags('Columns')
@Controller('projects/:projectId/columns')
export class ColumnsController {
    constructor(private readonly columnsService: ColumnsService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Column',
        operation: 'getAll',
        isArray: true,
    })
    async getColumns(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
    ): Promise<SuccessResponseDto<BoardColumn[]>> {
        const columns = await this.columnsService.getColumns(
            user.id,
            projectId,
        );
        return new SuccessResponseDto(
            columns,
            'Columns retrieved successfully',
        );
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiSwagger({
        resourceName: 'Column',
        operation: 'create',
        successStatus: 201,
    })
    async createColumn(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Body() dto: CreateColumnDto,
    ): Promise<CreatedResponseDto<BoardColumn>> {
        const column = await this.columnsService.createColumn(
            user.id,
            projectId,
            dto,
        );
        return new CreatedResponseDto(column, 'Column created successfully');
    }

    @Patch('reorder')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Column',
        operation: 'custom',
        summary: 'Reorder columns in a project',
    })
    async reorderColumns(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Body() dto: ReorderColumnsDto,
    ): Promise<SuccessResponseDto<BoardColumn[]>> {
        const columns = await this.columnsService.reorderColumns(
            user.id,
            projectId,
            dto,
        );
        return new SuccessResponseDto(
            columns,
            'Columns reordered successfully',
        );
    }

    @Patch(':columnId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Column',
        operation: 'update',
        paramName: 'columnId',
    })
    async updateColumn(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('columnId', ParseUUIDPipe) columnId: string,
        @Body() dto: UpdateColumnDto,
    ): Promise<UpdatedResponseDto<BoardColumn>> {
        const column = await this.columnsService.updateColumn(
            user.id,
            projectId,
            columnId,
            dto,
        );
        return new UpdatedResponseDto(column, 'Column updated successfully');
    }

    @Delete(':columnId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Column',
        operation: 'delete',
        paramName: 'columnId',
    })
    async deleteColumn(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('columnId', ParseUUIDPipe) columnId: string,
    ): Promise<DeletedResponseDto> {
        await this.columnsService.deleteColumn(user.id, projectId, columnId);
        return new DeletedResponseDto('Column deleted successfully');
    }
}
