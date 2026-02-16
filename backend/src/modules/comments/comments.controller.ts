import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dtos';
import { CurrentUser } from '@core/decorators';
import { ApiSwagger } from '@core/decorators';
import type { IJwtPayload } from '@shared/interfaces';
import { PaginationDto } from '@shared/dtos';
import {
    PaginatedResponseDto,
    CreatedResponseDto,
    UpdatedResponseDto,
    DeletedResponseDto,
} from '@shared/dtos';
import { Comment } from './comment.entity';

@ApiTags('Comments')
@Controller('projects/:projectId/tasks/:taskId/comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {}

    /**
     * GET /projects/:projectId/tasks/:taskId/comments
     * List comments for a task (paginated).
     * Requires project membership.
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Comments',
        operation: 'getAll',
        isArray: true,
        withPagination: true,
    })
    async getComments(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('taskId', ParseUUIDPipe) taskId: string,
        @Query() paginationDto: PaginationDto,
    ): Promise<PaginatedResponseDto<Comment>> {
        const page = paginationDto.page || 1;
        const limit = paginationDto.limit || 10;

        const { data, total } = await this.commentsService.getComments(
            user.id,
            projectId,
            taskId,
            { page, limit },
        );

        return new PaginatedResponseDto(
            data,
            page,
            limit,
            total,
            'Comments retrieved successfully',
        );
    }

    /**
     * POST /projects/:projectId/tasks/:taskId/comments
     * Create a new comment on a task.
     * Requires project membership.
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiSwagger({
        resourceName: 'Comment',
        operation: 'create',
        successStatus: 201,
        requestDto: CreateCommentDto,
    })
    async createComment(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('taskId', ParseUUIDPipe) taskId: string,
        @Body() dto: CreateCommentDto,
    ): Promise<CreatedResponseDto<Comment>> {
        const comment = await this.commentsService.createComment(
            user.id,
            projectId,
            taskId,
            dto,
        );

        return new CreatedResponseDto(comment, 'Comment created successfully');
    }

    /**
     * PATCH /projects/:projectId/tasks/:taskId/comments/:commentId
     * Edit a comment. Author only.
     */
    @Patch(':commentId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Comment',
        operation: 'update',
        paramName: 'commentId',
        requestDto: UpdateCommentDto,
    })
    async updateComment(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('taskId', ParseUUIDPipe) taskId: string,
        @Param('commentId', ParseUUIDPipe) commentId: string,
        @Body() dto: UpdateCommentDto,
    ): Promise<UpdatedResponseDto<Comment>> {
        const comment = await this.commentsService.updateComment(
            user.id,
            projectId,
            taskId,
            commentId,
            dto,
        );

        return new UpdatedResponseDto(comment, 'Comment updated successfully');
    }

    /**
     * DELETE /projects/:projectId/tasks/:taskId/comments/:commentId
     * Delete a comment. Author or project owner can delete.
     */
    @Delete(':commentId')
    @HttpCode(HttpStatus.OK)
    @ApiSwagger({
        resourceName: 'Comment',
        operation: 'delete',
        paramName: 'commentId',
    })
    async deleteComment(
        @CurrentUser() user: IJwtPayload,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('taskId', ParseUUIDPipe) taskId: string,
        @Param('commentId', ParseUUIDPipe) commentId: string,
    ): Promise<DeletedResponseDto> {
        await this.commentsService.deleteComment(
            user.id,
            projectId,
            taskId,
            commentId,
        );

        return new DeletedResponseDto('Comment deleted successfully');
    }
}
