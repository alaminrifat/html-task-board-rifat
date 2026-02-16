import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller';
import { DashboardController } from './dashboard.controller';
import { CalendarController } from './calendar.controller';
import { ProjectsService } from './projects.service';
import { DashboardService } from './dashboard.service';
import { CalendarService } from './calendar.service';
import { ProjectRepository } from './project.repository';
import { Project } from './project.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { BoardColumn } from '@modules/columns/column.entity';
import { Task } from '@modules/tasks/task.entity';
import { TimeEntry } from '@modules/time-entries/time-entry.entity';
import { SubTask } from '@modules/sub-tasks/sub-task.entity';
import { Comment } from '@modules/comments/comment.entity';
import { Attachment } from '@modules/attachments/attachment.entity';
import { Label } from '@modules/labels/label.entity';
import { User } from '@modules/users/user.entity';
import { I18nHelper } from '@core/utils/i18n.helper';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Project,
            ProjectMember,
            BoardColumn,
            Task,
            TimeEntry,
            SubTask,
            Comment,
            Attachment,
            Label,
            User,
        ]),
    ],
    controllers: [ProjectsController, DashboardController, CalendarController],
    providers: [
        ProjectsService,
        DashboardService,
        CalendarService,
        ProjectRepository,
        I18nHelper,
    ],
    exports: [ProjectsService, ProjectRepository],
})
export class ProjectsModule {}
