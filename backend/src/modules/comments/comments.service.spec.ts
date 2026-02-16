import {
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { CommentsService } from './comments.service';
import { CommentRepository } from './comment.repository';
import { Comment } from './comment.entity';
import { Task } from '@modules/tasks/task.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { ProjectRole } from '@shared/enums';

describe('CommentsService', () => {
    let service: CommentsService;
    let commentRepository: jest.Mocked<Partial<CommentRepository>>;
    let taskRepository: jest.Mocked<Partial<Repository<Task>>>;
    let projectMemberRepository: jest.Mocked<
        Partial<Repository<ProjectMember>>
    >;

    const userId = 'user-uuid-1';
    const otherUserId = 'user-uuid-2';
    const projectId = 'project-uuid-1';
    const taskId = 'task-uuid-1';
    const commentId = 'comment-uuid-1';

    const mockOwnerMember: Partial<ProjectMember> = {
        id: 'member-uuid-1',
        projectId,
        userId,
        projectRole: ProjectRole.OWNER,
    };

    const mockRegularMember: Partial<ProjectMember> = {
        id: 'member-uuid-2',
        projectId,
        userId: otherUserId,
        projectRole: ProjectRole.MEMBER,
    };

    const mockTask: Partial<Task> = {
        id: taskId,
        projectId,
    };

    const mockComment: Partial<Comment> = {
        id: commentId,
        taskId,
        userId,
        parentId: null,
        content: 'Test comment content',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockCommentWithUser: Partial<Comment> = {
        ...mockComment,
        user: { id: userId, fullName: 'Test User' } as any,
    };

    beforeEach(async () => {
        commentRepository = {
            findByTask: jest.fn(),
            findByIdWithUser: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            softDelete: jest.fn(),
            findOne: jest.fn(),
        };

        taskRepository = {
            findOne: jest.fn(),
        };

        projectMemberRepository = {
            findOne: jest.fn(),
        };

        service = new CommentsService(
            commentRepository as any,
            taskRepository as any,
            projectMemberRepository as any,
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ─── getComments ────────────────────────────────────────────────

    describe('getComments', () => {
        it('should return paginated comments for a task', async () => {
            const pagination = { page: 1, limit: 10 };
            const commentsResult = {
                data: [mockComment as Comment],
                total: 1,
            };

            (projectMemberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (taskRepository.findOne as jest.Mock).mockResolvedValue(mockTask);
            (commentRepository.findByTask as jest.Mock).mockResolvedValue(
                commentsResult,
            );

            const result = await service.getComments(
                userId,
                projectId,
                taskId,
                pagination,
            );

            expect(projectMemberRepository.findOne).toHaveBeenCalledWith({
                where: { userId, projectId },
            });
            expect(taskRepository.findOne).toHaveBeenCalledWith({
                where: { id: taskId, projectId },
            });
            expect(commentRepository.findByTask).toHaveBeenCalledWith(
                taskId,
                1,
                10,
            );
            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('should throw ForbiddenException when user is not a project member', async () => {
            (projectMemberRepository.findOne as jest.Mock).mockResolvedValue(
                null,
            );

            await expect(
                service.getComments('stranger-id', projectId, taskId, {
                    page: 1,
                    limit: 10,
                }),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException when task not found in project', async () => {
            (projectMemberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (taskRepository.findOne as jest.Mock).mockResolvedValue(null);

            await expect(
                service.getComments(userId, projectId, 'nonexistent-task', {
                    page: 1,
                    limit: 10,
                }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ─── createComment ──────────────────────────────────────────────

    describe('createComment', () => {
        it('should create a top-level comment', async () => {
            const dto = { content: 'New comment' };

            (projectMemberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (taskRepository.findOne as jest.Mock).mockResolvedValue(mockTask);
            (commentRepository.create as jest.Mock).mockResolvedValue({
                ...mockComment,
                content: 'New comment',
            });
            (commentRepository.findByIdWithUser as jest.Mock).mockResolvedValue(
                {
                    ...mockCommentWithUser,
                    content: 'New comment',
                },
            );

            const result = await service.createComment(
                userId,
                projectId,
                taskId,
                dto,
            );

            expect(commentRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    taskId,
                    userId,
                    parentId: null,
                    content: 'New comment',
                }),
            );
            expect(result.content).toBe('New comment');
        });

        it('should create a reply comment with valid parentId', async () => {
            const parentComment = { ...mockComment, id: 'parent-uuid', taskId };
            const dto = { content: 'Reply comment', parentId: 'parent-uuid' };

            (projectMemberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (taskRepository.findOne as jest.Mock).mockResolvedValue(mockTask);
            (commentRepository.findOne as jest.Mock).mockResolvedValue(
                parentComment,
            );
            (commentRepository.create as jest.Mock).mockResolvedValue({
                ...mockComment,
                content: 'Reply comment',
                parentId: 'parent-uuid',
            });
            (commentRepository.findByIdWithUser as jest.Mock).mockResolvedValue(
                {
                    ...mockCommentWithUser,
                    content: 'Reply comment',
                    parentId: 'parent-uuid',
                },
            );

            const result = await service.createComment(
                userId,
                projectId,
                taskId,
                dto,
            );

            expect(result.content).toBe('Reply comment');
            expect(result.parentId).toBe('parent-uuid');
        });

        it('should throw BadRequestException when parent comment not found', async () => {
            const dto = { content: 'Reply', parentId: 'nonexistent-parent' };

            (projectMemberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (taskRepository.findOne as jest.Mock).mockResolvedValue(mockTask);
            (commentRepository.findOne as jest.Mock).mockResolvedValue(null);

            await expect(
                service.createComment(userId, projectId, taskId, dto),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when parent comment belongs to different task', async () => {
            const parentComment = {
                ...mockComment,
                id: 'parent-uuid',
                taskId: 'other-task-id',
            };
            const dto = { content: 'Reply', parentId: 'parent-uuid' };

            (projectMemberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (taskRepository.findOne as jest.Mock).mockResolvedValue(mockTask);
            (commentRepository.findOne as jest.Mock).mockResolvedValue(
                parentComment,
            );

            await expect(
                service.createComment(userId, projectId, taskId, dto),
            ).rejects.toThrow(BadRequestException);
        });

        it('should detect @mentions in comment content', async () => {
            const dto = { content: 'Hello @john and @jane please review' };

            (projectMemberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (taskRepository.findOne as jest.Mock).mockResolvedValue(mockTask);
            (commentRepository.create as jest.Mock).mockResolvedValue(
                mockComment,
            );
            (commentRepository.findByIdWithUser as jest.Mock).mockResolvedValue(
                mockCommentWithUser,
            );

            // This should not throw; mentions are detected silently
            const result = await service.createComment(
                userId,
                projectId,
                taskId,
                dto,
            );

            expect(result).toBeDefined();
        });

        it('should throw ForbiddenException when user is not a member', async () => {
            (projectMemberRepository.findOne as jest.Mock).mockResolvedValue(
                null,
            );

            await expect(
                service.createComment('stranger-id', projectId, taskId, {
                    content: 'Hi',
                }),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ─── updateComment ──────────────────────────────────────────────

    describe('updateComment', () => {
        it('should update comment when author edits their own comment', async () => {
            const dto = { content: 'Updated content' };
            const updatedComment = {
                ...mockCommentWithUser,
                content: 'Updated content',
            };

            (projectMemberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (taskRepository.findOne as jest.Mock).mockResolvedValue(mockTask);
            (commentRepository.findByIdWithUser as jest.Mock)
                .mockResolvedValueOnce(mockCommentWithUser) // first call for finding
                .mockResolvedValueOnce(updatedComment); // second call after update
            (commentRepository.update as jest.Mock).mockResolvedValue(
                updatedComment,
            );

            const result = await service.updateComment(
                userId,
                projectId,
                taskId,
                commentId,
                dto,
            );

            expect(commentRepository.update).toHaveBeenCalledWith(commentId, {
                content: 'Updated content',
            });
            expect(result.content).toBe('Updated content');
        });

        it('should throw ForbiddenException when non-author tries to edit', async () => {
            const otherUserComment = {
                ...mockCommentWithUser,
                userId: 'someone-else',
            };

            (projectMemberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (taskRepository.findOne as jest.Mock).mockResolvedValue(mockTask);
            (commentRepository.findByIdWithUser as jest.Mock).mockResolvedValue(
                otherUserComment,
            );

            await expect(
                service.updateComment(userId, projectId, taskId, commentId, {
                    content: 'Hack',
                }),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException when comment not found', async () => {
            (projectMemberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (taskRepository.findOne as jest.Mock).mockResolvedValue(mockTask);
            (commentRepository.findByIdWithUser as jest.Mock).mockResolvedValue(
                null,
            );

            await expect(
                service.updateComment(
                    userId,
                    projectId,
                    taskId,
                    'nonexistent',
                    { content: 'X' },
                ),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException when comment belongs to a different task', async () => {
            const otherTaskComment = {
                ...mockCommentWithUser,
                taskId: 'other-task-id',
            };

            (projectMemberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (taskRepository.findOne as jest.Mock).mockResolvedValue(mockTask);
            (commentRepository.findByIdWithUser as jest.Mock).mockResolvedValue(
                otherTaskComment,
            );

            await expect(
                service.updateComment(userId, projectId, taskId, commentId, {
                    content: 'X',
                }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ─── deleteComment ──────────────────────────────────────────────

    describe('deleteComment', () => {
        it('should delete comment when author deletes their own comment', async () => {
            (projectMemberRepository.findOne as jest.Mock).mockResolvedValue(
                mockRegularMember,
            );
            (taskRepository.findOne as jest.Mock).mockResolvedValue(mockTask);
            // Comment authored by otherUserId (the regular member)
            const memberComment = { ...mockComment, userId: otherUserId };
            (commentRepository.findById as jest.Mock).mockResolvedValue(
                memberComment,
            );
            (commentRepository.delete as jest.Mock).mockResolvedValue(true);

            await expect(
                service.deleteComment(
                    otherUserId,
                    projectId,
                    taskId,
                    commentId,
                ),
            ).resolves.toBeUndefined();

            expect(commentRepository.delete).toHaveBeenCalledWith(commentId);
        });

        it('should delete comment when project owner deletes any comment', async () => {
            // Comment authored by someone else, but the owner deletes it
            const otherUserComment = { ...mockComment, userId: 'someone-else' };

            (projectMemberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (taskRepository.findOne as jest.Mock).mockResolvedValue(mockTask);
            (commentRepository.findById as jest.Mock).mockResolvedValue(
                otherUserComment,
            );
            (commentRepository.delete as jest.Mock).mockResolvedValue(true);

            await expect(
                service.deleteComment(userId, projectId, taskId, commentId),
            ).resolves.toBeUndefined();

            expect(commentRepository.delete).toHaveBeenCalledWith(commentId);
        });

        it('should throw ForbiddenException when non-author non-owner tries to delete', async () => {
            // Comment authored by userId, but otherUserId (MEMBER) tries to delete
            const ownerComment = { ...mockComment, userId };

            (projectMemberRepository.findOne as jest.Mock).mockResolvedValue(
                mockRegularMember,
            );
            (taskRepository.findOne as jest.Mock).mockResolvedValue(mockTask);
            (commentRepository.findById as jest.Mock).mockResolvedValue(
                ownerComment,
            );

            await expect(
                service.deleteComment(
                    otherUserId,
                    projectId,
                    taskId,
                    commentId,
                ),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException when comment not found', async () => {
            (projectMemberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (taskRepository.findOne as jest.Mock).mockResolvedValue(mockTask);
            (commentRepository.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                service.deleteComment(userId, projectId, taskId, 'nonexistent'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException when comment belongs to a different task', async () => {
            const otherTaskComment = {
                ...mockComment,
                taskId: 'other-task-id',
            };

            (projectMemberRepository.findOne as jest.Mock).mockResolvedValue(
                mockOwnerMember,
            );
            (taskRepository.findOne as jest.Mock).mockResolvedValue(mockTask);
            (commentRepository.findById as jest.Mock).mockResolvedValue(
                otherTaskComment,
            );

            await expect(
                service.deleteComment(userId, projectId, taskId, commentId),
            ).rejects.toThrow(NotFoundException);
        });
    });
});
