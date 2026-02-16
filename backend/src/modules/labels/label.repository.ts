import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@core/base/base.repository';
import { Label } from './label.entity';

@Injectable()
export class LabelRepository extends BaseRepository<Label> {
    constructor(
        @InjectRepository(Label)
        private readonly labelRepository: Repository<Label>,
    ) {
        super(labelRepository);
    }

    /**
     * Find all labels for a project, including system-wide labels (projectId IS NULL).
     * Returns project-specific labels first, then system labels.
     */
    async findByProject(projectId: string): Promise<Label[]> {
        return this.labelRepository
            .createQueryBuilder('label')
            .where('label.projectId = :projectId OR label.projectId IS NULL', {
                projectId,
            })
            .orderBy(
                'CASE WHEN label.project_id IS NULL THEN 1 ELSE 0 END',
                'ASC',
            )
            .addOrderBy('label.name', 'ASC')
            .getMany();
    }

    /**
     * Find only system-wide labels (where projectId IS NULL).
     */
    async findSystemLabels(): Promise<Label[]> {
        return this.labelRepository.find({
            where: { projectId: null as any },
            order: { name: 'ASC' },
        });
    }
}
