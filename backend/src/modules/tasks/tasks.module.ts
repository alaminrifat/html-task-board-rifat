import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController, MyTasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskRepository } from './task.repository';
import { Task } from './task.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { BoardColumn } from '@modules/columns/column.entity';
import { Label } from '@modules/labels/label.entity';
import { I18nHelper } from '@core/utils/i18n.helper';

@Module({
    imports: [
        TypeOrmModule.forFeature([Task, ProjectMember, BoardColumn, Label]),
    ],
    controllers: [TasksController, MyTasksController],
    providers: [TasksService, TaskRepository, I18nHelper],
    exports: [TasksService, TaskRepository],
})
export class TasksModule {}
