import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes } from '@nestjs/swagger';
import { ApiSwagger } from '@core/decorators';
import { CurrentUser } from '@core/decorators';
import type { IJwtPayload } from '@shared/interfaces';
import {
    SuccessResponseDto,
    CreatedResponseDto,
    DeletedResponseDto,
} from '@shared/dtos';
import { AttachmentsService } from './attachments.service';
import { Attachment } from './attachment.entity';

@ApiTags('Attachments')
@Controller()
export class AttachmentsController {
    constructor(private readonly attachmentsService: AttachmentsService) {}

    @Get('projects/:projectId/tasks/:taskId/attachments')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Attachment',
        operation: 'getAll',
        isArray: true,
    })
    async getAttachments(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('taskId', ParseUUIDPipe) taskId: string,
    ): Promise<SuccessResponseDto<Attachment[]>> {
        const attachments = await this.attachmentsService.getAttachments(
            user.id,
            projectId,
            taskId,
        );
        return new SuccessResponseDto(
            attachments,
            'Attachments retrieved successfully',
        );
    }

    @Post('projects/:projectId/tasks/:taskId/attachments')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiSwagger({
        resourceName: 'Attachment',
        operation: 'create',
        successStatus: 201,
    })
    async uploadAttachment(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('taskId', ParseUUIDPipe) taskId: string,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<CreatedResponseDto<Attachment>> {
        const attachment = await this.attachmentsService.uploadAttachment(
            user.id,
            projectId,
            taskId,
            file,
        );
        return new CreatedResponseDto(
            attachment,
            'Attachment uploaded successfully',
        );
    }

    @Get('projects/:projectId/attachments/:attachmentId/download')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Attachment',
        operation: 'getOne',
        summary: 'Download / get attachment URL',
    })
    async downloadAttachment(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    ): Promise<SuccessResponseDto<{ fileUrl: string; fileName: string }>> {
        const result = await this.attachmentsService.downloadAttachment(
            user.id,
            projectId,
            attachmentId,
        );
        return new SuccessResponseDto(
            result,
            'Attachment URL retrieved successfully',
        );
    }

    @Delete('projects/:projectId/attachments/:attachmentId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Attachment',
        operation: 'delete',
        paramName: 'attachmentId',
    })
    async deleteAttachment(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    ): Promise<DeletedResponseDto> {
        await this.attachmentsService.deleteAttachment(
            user.id,
            projectId,
            attachmentId,
        );
        return new DeletedResponseDto('Attachment deleted successfully');
    }
}
