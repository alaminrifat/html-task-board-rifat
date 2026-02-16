import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ColumnsController } from './columns.controller';
import { ColumnsService } from './columns.service';
import { ColumnRepository } from './column.repository';
import { BoardColumn } from './column.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { Task } from '@modules/tasks/task.entity';

@Module({
    imports: [TypeOrmModule.forFeature([BoardColumn, ProjectMember, Task])],
    controllers: [ColumnsController],
    providers: [ColumnsService, ColumnRepository],
    exports: [ColumnsService, ColumnRepository],
})
export class ColumnsModule {}
