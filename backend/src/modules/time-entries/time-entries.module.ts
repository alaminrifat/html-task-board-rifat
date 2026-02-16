import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeEntriesController } from './time-entries.controller';
import { TimeEntriesService } from './time-entries.service';
import { TimeEntryRepository } from './time-entry.repository';
import { TimeEntry } from './time-entry.entity';
import { Task } from '@modules/tasks/task.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';

@Module({
    imports: [TypeOrmModule.forFeature([TimeEntry, Task, ProjectMember])],
    controllers: [TimeEntriesController],
    providers: [TimeEntriesService, TimeEntryRepository],
    exports: [TimeEntriesService, TimeEntryRepository],
})
export class TimeEntriesModule {}
