import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { BaseRepository } from '@core/base/base.repository';
import { Comment } from './comment.entity';

@Injectable()
export class CommentRepository extends BaseRepository<Comment> {
    constructor(
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,
    ) {
        super(commentRepository);
    }

    /**
     * Find paginated comments for a task, loading user relation.
     * Ordered by createdAt DESC (newest first).
     */
    async findByTask(
        taskId: string,
        page: number,
        limit: number,
    ): Promise<{ data: Comment[]; total: number }> {
        const [data, total] = await this.commentRepository.findAndCount({
            where: { taskId },
            relations: { user: true, replies: { user: true } },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, total };
    }

    /**
     * Find top-level comments for a task with nested replies loaded.
     * Top-level comments have parentId = null.
     * Each top-level comment has its replies loaded (one level deep with user info).
     */
    async findByTaskThreaded(taskId: string): Promise<Comment[]> {
        return this.commentRepository.find({
            where: { taskId, parentId: IsNull() },
            relations: {
                user: true,
                replies: { user: true },
            },
            order: {
                createdAt: 'DESC',
                replies: { createdAt: 'ASC' },
            },
        });
    }

    /**
     * Find a comment by ID with user relation loaded.
     */
    async findByIdWithUser(commentId: string): Promise<Comment | null> {
        return this.commentRepository.findOne({
            where: { id: commentId },
            relations: { user: true },
        });
    }
}
