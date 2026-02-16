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
import { LabelsService } from './labels.service';
import { Label } from './label.entity';
import { CreateLabelDto, UpdateLabelDto } from './dtos';

@ApiTags('Labels')
@Controller('projects/:projectId/labels')
export class LabelsController {
    constructor(private readonly labelsService: LabelsService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Label',
        operation: 'getAll',
        isArray: true,
    })
    async getLabels(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
    ): Promise<SuccessResponseDto<Label[]>> {
        const labels = await this.labelsService.getLabels(user.id, projectId);
        return new SuccessResponseDto(labels, 'Labels retrieved successfully');
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiSwagger({
        resourceName: 'Label',
        operation: 'create',
        successStatus: 201,
    })
    async createLabel(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Body() dto: CreateLabelDto,
    ): Promise<CreatedResponseDto<Label>> {
        const label = await this.labelsService.createLabel(
            user.id,
            projectId,
            dto,
        );
        return new CreatedResponseDto(label, 'Label created successfully');
    }

    @Patch(':labelId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Label',
        operation: 'update',
        paramName: 'labelId',
    })
    async updateLabel(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('labelId', ParseUUIDPipe) labelId: string,
        @Body() dto: UpdateLabelDto,
    ): Promise<UpdatedResponseDto<Label>> {
        const label = await this.labelsService.updateLabel(
            user.id,
            projectId,
            labelId,
            dto,
        );
        return new UpdatedResponseDto(label, 'Label updated successfully');
    }

    @Delete(':labelId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Label',
        operation: 'delete',
        paramName: 'labelId',
    })
    async deleteLabel(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('labelId', ParseUUIDPipe) labelId: string,
    ): Promise<DeletedResponseDto> {
        await this.labelsService.deleteLabel(user.id, projectId, labelId);
        return new DeletedResponseDto('Label deleted successfully');
    }
}
