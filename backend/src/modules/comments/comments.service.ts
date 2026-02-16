import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '@core/base/base.service';
import { Comment } from './comment.entity';
import { CommentRepository } from './comment.repository';
import { CreateCommentDto, UpdateCommentDto } from './dtos';
import { Task } from '@modules/tasks/task.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { ProjectRole } from '@shared/enums';

@Injectable()
export class CommentsService extends BaseService<Comment> {
    constructor(
        private readonly commentRepository: CommentRepository,
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,
        @InjectRepository(ProjectMember)
        private readonly projectMemberRepository: Repository<ProjectMember>,
    ) {
        super(commentRepository, 'Comment');
    }

    /**
     * Validate that the user is a member of the project.
     * Returns the ProjectMember record.
     */
    private async validateMembership(
        userId: string,
        projectId: string,
    ): Promise<ProjectMember> {
        const member = await this.projectMemberRepository.findOne({
            where: { userId, projectId },
        });
        if (!member) {
            throw new ForbiddenException(
                'You are not a member of this project',
            );
        }
        return member;
    }

    /**
     * Validate that a task belongs to the given project.
     * Returns the Task if valid.
     */
    private async validateTaskInProject(
        taskId: string,
        projectId: string,
    ): Promise<Task> {
        const task = await this.taskRepository.findOne({
            where: { id: taskId, projectId },
        });
        if (!task) {
            throw new NotFoundException('Task not found in this project');
        }
        return task;
    }

    /**
     * Detect @mentions in comment content.
     * Returns an array of mentioned usernames.
     */
    private detectMentions(content: string): string[] {
        const mentionRegex = /@(\w+)/g;
        const mentions: string[] = [];
        let match: RegExpExecArray | null;
        while ((match = mentionRegex.exec(content)) !== null) {
            mentions.push(match[1]);
        }
        return mentions;
    }

    /**
     * Get paginated comments for a task.
     * Validates that the user is a member of the project.
     */
    async getComments(
        userId: string,
        projectId: string,
        taskId: string,
        pagination: { page: number; limit: number },
    ): Promise<{ data: Comment[]; total: number }> {
        await this.validateMembership(userId, projectId);
        await this.validateTaskInProject(taskId, projectId);

        const { page, limit } = pagination;
        return this.commentRepository.findByTask(taskId, page, limit);
    }

    /**
     * Create a new comment on a task.
     * Validates membership, task ownership in project, and optional parentId.
     * Detects @mentions in content for future notification support.
     */
    async createComment(
        userId: string,
        projectId: string,
        taskId: string,
        dto: CreateCommentDto,
    ): Promise<Comment> {
        await this.validateMembership(userId, projectId);
        await this.validateTaskInProject(taskId, projectId);

        // Validate parentId if provided - must be a comment on the same task
        if (dto.parentId) {
            const parentComment = await this.commentRepository.findOne({
                id: dto.parentId,
            } as any);
            if (!parentComment) {
                throw new BadRequestException('Parent comment not found');
            }
            if (parentComment.taskId !== taskId) {
                throw new BadRequestException(
                    'Parent comment does not belong to this task',
                );
            }
        }

        // Detect @mentions for future notification processing
        const mentions = this.detectMentions(dto.content);
        // TODO: Send notifications to mentioned users (integrate with NotificationsService)
        void mentions;

        const comment = await this.commentRepository.create({
            taskId,
            userId,
            parentId: dto.parentId || null,
            content: dto.content,
        });

        // Return the comment with user relation loaded
        const created = await this.commentRepository.findByIdWithUser(
            comment.id,
        );
        return created!;
    }

    /**
     * Update a comment. Only the author can edit their own comment.
     */
    async updateComment(
        userId: string,
        projectId: string,
        taskId: string,
        commentId: string,
        dto: UpdateCommentDto,
    ): Promise<Comment> {
        await this.validateMembership(userId, projectId);
        await this.validateTaskInProject(taskId, projectId);

        const comment =
            await this.commentRepository.findByIdWithUser(commentId);
        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        // Verify the comment belongs to this task
        if (comment.taskId !== taskId) {
            throw new NotFoundException('Comment not found on this task');
        }

        // Author-only check
        if (comment.userId !== userId) {
            throw new ForbiddenException('You can only edit your own comments');
        }

        await this.commentRepository.update(commentId, {
            content: dto.content,
        });

        const updated =
            await this.commentRepository.findByIdWithUser(commentId);
        return updated!;
    }

    /**
     * Delete a comment. The author or the project owner can delete a comment.
     */
    async deleteComment(
        userId: string,
        projectId: string,
        taskId: string,
        commentId: string,
    ): Promise<void> {
        const member = await this.validateMembership(userId, projectId);
        await this.validateTaskInProject(taskId, projectId);

        const comment = await this.commentRepository.findById(commentId);
        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        // Verify the comment belongs to this task
        if (comment.taskId !== taskId) {
            throw new NotFoundException('Comment not found on this task');
        }

        // Author or project owner can delete
        const isAuthor = comment.userId === userId;
        const isProjectOwner = member.projectRole === ProjectRole.OWNER;

        if (!isAuthor && !isProjectOwner) {
            throw new ForbiddenException(
                'Only the comment author or project owner can delete this comment',
            );
        }

        // Hard delete - comments do not have soft delete (no deletedAt column in comments table)
        await this.commentRepository.delete(commentId);
    }
}
