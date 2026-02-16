import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabelsController } from './labels.controller';
import { LabelsService } from './labels.service';
import { LabelRepository } from './label.repository';
import { Label } from './label.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Label, ProjectMember])],
    controllers: [LabelsController],
    providers: [LabelsService, LabelRepository],
    exports: [LabelsService, LabelRepository],
})
export class LabelsModule {}
