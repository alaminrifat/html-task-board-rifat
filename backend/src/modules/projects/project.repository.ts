import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@core/base/base.repository';
import { Project } from './project.entity';
import { ProjectFilterDto } from './dtos';

@Injectable()
export class ProjectRepository extends BaseRepository<Project> {
    constructor(
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
    ) {
        super(projectRepository);
    }

    /**
     * Find paginated projects where the user is a member.
     * Supports filtering by status, search by title/description, and sorting.
     */
    async findProjectsForUser(
        userId: string,
        filters: ProjectFilterDto,
    ): Promise<{ data: Project[]; total: number }> {
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 10;
        const skip = (page - 1) * limit;
        const sortBy = filters.sortBy ?? 'createdAt';
        const sortOrder = filters.sortOrder ?? 'DESC';

        const qb = this.projectRepository
            .createQueryBuilder('project')
            .innerJoin('project.members', 'member', 'member.userId = :userId', {
                userId,
            })
            .leftJoinAndSelect('project.owner', 'owner')
            .leftJoin('project.members', 'allMembers')
            .addSelect([
                'allMembers.id',
                'allMembers.userId',
                'allMembers.projectRole',
            ])
            .where('project.deletedAt IS NULL');

        if (filters.status) {
            qb.andWhere('project.status = :status', { status: filters.status });
        }

        if (filters.search) {
            qb.andWhere(
                '(project.title ILIKE :search OR project.description ILIKE :search)',
                { search: `%${filters.search}%` },
            );
        }

        // Validate sortBy against allowed columns to prevent injection
        const allowedSortColumns: Record<string, string> = {
            createdAt: 'project.createdAt',
            updatedAt: 'project.updatedAt',
            title: 'project.title',
            deadline: 'project.deadline',
            status: 'project.status',
        };

        const sortColumn = allowedSortColumns[sortBy] ?? 'project.createdAt';
        qb.orderBy(sortColumn, sortOrder);

        const total = await qb.getCount();
        const data = await qb.skip(skip).take(limit).getMany();

        return { data, total };
    }

    /**
     * Load the full board state for a project:
     * columns (sorted by position), each with tasks (sorted by position),
     * each task with labels, assignee, and subtask counts.
     */
    async findProjectWithBoard(projectId: string): Promise<Project | null> {
        return this.projectRepository
            .createQueryBuilder('project')
            .leftJoinAndSelect('project.columns', 'column')
            .leftJoinAndSelect('column.tasks', 'task', 'task.deletedAt IS NULL')
            .leftJoinAndSelect('task.labels', 'label')
            .leftJoinAndSelect('task.assignee', 'assignee')
            .leftJoin('task.subTasks', 'subTask')
            .addSelect('COUNT(subTask.id)', 'subTaskCount')
            .where('project.id = :projectId', { projectId })
            .andWhere('project.deletedAt IS NULL')
            .groupBy('project.id')
            .addGroupBy('column.id')
            .addGroupBy('task.id')
            .addGroupBy('label.id')
            .addGroupBy('assignee.id')
            .orderBy('column.position', 'ASC')
            .addOrderBy('task.position', 'ASC')
            .getOne();
    }
}
