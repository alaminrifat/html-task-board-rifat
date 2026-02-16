import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CommentRepository } from './comment.repository';
import { Comment } from './comment.entity';
import { Task } from '@modules/tasks/task.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Comment, Task, ProjectMember])],
    controllers: [CommentsController],
    providers: [CommentsService, CommentRepository],
    exports: [CommentsService, CommentRepository],
})
export class CommentsModule {}
