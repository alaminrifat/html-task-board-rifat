import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubTasksController } from './sub-tasks.controller';
import { SubTasksService } from './sub-tasks.service';
import { SubTaskRepository } from './sub-task.repository';
import { SubTask } from './sub-task.entity';
import { Task } from '@modules/tasks/task.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';

@Module({
    imports: [TypeOrmModule.forFeature([SubTask, Task, ProjectMember])],
    controllers: [SubTasksController],
    providers: [SubTasksService, SubTaskRepository],
    exports: [SubTasksService, SubTaskRepository],
})
export class SubTasksModule {}
