import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogsController } from './activity-logs.controller';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogRepository } from './activity-log.repository';
import { ActivityLog } from './activity-log.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([ActivityLog, ProjectMember])],
    controllers: [ActivityLogsController],
    providers: [ActivityLogsService, ActivityLogRepository],
    exports: [ActivityLogsService],
})
export class ActivityLogsModule {}
