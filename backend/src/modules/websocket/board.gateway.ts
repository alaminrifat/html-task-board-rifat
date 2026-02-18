import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import { User } from '@modules/users/user.entity';
import { Task } from '@modules/tasks/task.entity';
import { ProjectMember } from '@modules/project-members/project-member.entity';
import { BoardColumn } from '@modules/columns/column.entity';

import { TasksService } from '@modules/tasks/tasks.service';
import { ProjectMembersService } from '@modules/project-members/project-members.service';
import { ActivityLogsService } from '@modules/activity-logs/activity-logs.service';
import { NotificationsService } from '@modules/notifications/notifications.service';

import { UserStatus, ActivityAction, NotificationType } from '@shared/enums';
import type { IJwtPayload } from '@shared/interfaces';

import {
    JoinProjectDto,
    MoveTaskWsDto,
    CreateTaskWsDto,
    UpdateTaskWsDto,
    DeleteTaskWsDto,
} from './dtos';

// ─── Type Definitions ──────────────────────────────────────────────

interface WsSuccessResponse<T = unknown> {
    event: string;
    data: { success: true; message?: string } & T;
}

interface WsErrorResponse {
    event: string;
    data: { success: false; message: string; code: string };
}

type WsResponse<T = unknown> = WsSuccessResponse<T> | WsErrorResponse;

// ─── Gateway ───────────────────────────────────────────────────────

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: '/board',
})
export class BoardGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(BoardGateway.name);

    @WebSocketServer()
    server!: Server;

    constructor(
        private readonly jwtService: JwtService,
        private readonly tasksService: TasksService,
        private readonly projectMembersService: ProjectMembersService,
        private readonly activityLogsService: ActivityLogsService,
        private readonly notificationsService: NotificationsService,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Task)
        private readonly taskRepo: Repository<Task>,
        @InjectRepository(ProjectMember)
        private readonly memberRepo: Repository<ProjectMember>,
        @InjectRepository(BoardColumn)
        private readonly columnRepo: Repository<BoardColumn>,
    ) {}

    // ─── Connection Lifecycle ──────────────────────────────────────

    async handleConnection(client: Socket): Promise<void> {
        // Support both explicit auth token and cookie-based auth
        let token = client.handshake.auth?.token;

        if (!token) {
            // Fallback: extract token from cookies (httpOnly cookie support)
            const cookieHeader = client.handshake.headers?.cookie;
            if (cookieHeader) {
                const cookieName =
                    process.env.AUTH_TOKEN_COOKIE_NAME || 'accessToken';
                const match = cookieHeader.match(
                    new RegExp(`(?:^|;\\s*)${cookieName}=([^;]*)`),
                );
                if (match) {
                    token = match[1];
                }
            }
        }

        if (!token) {
            client.emit('error', {
                code: 'AUTH_REQUIRED',
                message: 'Authentication required',
            });
            client.disconnect();
            return;
        }

        try {
            const payload = this.jwtService.verify<IJwtPayload>(token);

            // Check user exists and is not suspended
            const user = await this.userRepo.findOne({
                where: { id: payload.id },
            });

            if (!user || user.status === UserStatus.SUSPENDED) {
                client.emit('error', {
                    code: 'ACCOUNT_SUSPENDED',
                    message: 'Account is suspended',
                });
                client.disconnect();
                return;
            }

            // Store user data on socket for later use
            client.data.userId = payload.id;
            client.data.userName = user.fullName;

            this.logger.log(
                `Client connected: ${client.id} (user: ${user.fullName}, id: ${payload.id})`,
            );
        } catch {
            client.emit('error', {
                code: 'INVALID_TOKEN',
                message: 'Invalid or expired token',
            });
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket): void {
        this.logger.log(
            `Client disconnected: ${client.id} (user: ${client.data?.userId ?? 'unknown'})`,
        );
    }

    // ─── Client-to-Server Events ───────────────────────────────────

    /**
     * 1. joinProject - Join a project room for real-time updates
     */
    @SubscribeMessage('joinProject')
    async handleJoinProject(
        client: Socket,
        payload: { projectId: string },
    ): Promise<WsResponse> {
        try {
            const dto = await this.validatePayload(JoinProjectDto, payload);
            const userId = client.data.userId;

            // Validate membership
            await this.projectMembersService.validateMembership(
                userId,
                dto.projectId,
            );

            // Join the project room
            const room = `project:${dto.projectId}`;
            await client.join(room);

            this.logger.log(`User ${client.data.userName} joined room ${room}`);

            return {
                event: 'joinProject',
                data: { success: true, message: 'Joined project room' },
            };
        } catch (error) {
            return this.buildErrorResponse('joinProject', error);
        }
    }

    /**
     * 2. leaveProject - Leave a project room
     */
    @SubscribeMessage('leaveProject')
    async handleLeaveProject(
        client: Socket,
        payload: { projectId: string },
    ): Promise<WsResponse> {
        try {
            const dto = await this.validatePayload(JoinProjectDto, payload);

            const room = `project:${dto.projectId}`;
            await client.leave(room);

            this.logger.log(`User ${client.data.userName} left room ${room}`);

            return {
                event: 'leaveProject',
                data: { success: true, message: 'Left project room' },
            };
        } catch (error) {
            return this.buildErrorResponse('leaveProject', error);
        }
    }

    /**
     * 3. moveTask - Move a task to a different column/position
     */
    @SubscribeMessage('moveTask')
    async handleMoveTask(
        client: Socket,
        payload: { taskId: string; targetColumnId: string; position: number },
    ): Promise<WsResponse> {
        try {
            const dto = await this.validatePayload(MoveTaskWsDto, payload);
            const userId = client.data.userId;

            // Find the task to determine its project
            const task = await this.taskRepo.findOne({
                where: { id: dto.taskId },
                relations: { column: true },
            });

            if (!task) {
                return {
                    event: 'moveTask',
                    data: {
                        success: false,
                        message: 'Task not found',
                        code: 'TASK_NOT_FOUND',
                    },
                };
            }

            const projectId = task.projectId;

            // Validate membership
            await this.projectMembersService.validateMembership(
                userId,
                projectId,
            );

            // Check WIP limit on target column (only if moving to a different column)
            if (task.columnId !== dto.targetColumnId) {
                const targetColumn = await this.columnRepo.findOne({
                    where: { id: dto.targetColumnId, projectId },
                });

                if (!targetColumn) {
                    return {
                        event: 'moveTask',
                        data: {
                            success: false,
                            message: 'Target column not found in this project',
                            code: 'COLUMN_NOT_FOUND',
                        },
                    };
                }

                if (
                    targetColumn.wipLimit !== null &&
                    targetColumn.wipLimit > 0
                ) {
                    const currentCount = await this.taskRepo.count({
                        where: { columnId: dto.targetColumnId },
                    });

                    if (currentCount >= targetColumn.wipLimit) {
                        return {
                            event: 'moveTask',
                            data: {
                                success: false,
                                message: `Column "${targetColumn.title}" has reached its WIP limit of ${targetColumn.wipLimit}`,
                                code: 'WIP_LIMIT_REACHED',
                            },
                        };
                    }
                }
            }

            // Delegate to TasksService for the actual move (handles position reordering)
            const updatedTask = await this.tasksService.moveTask(
                userId,
                projectId,
                dto.taskId,
                {
                    columnId: dto.targetColumnId,
                    position: dto.position,
                },
            );

            // Log activity
            await this.activityLogsService.logActivity(
                projectId,
                userId,
                ActivityAction.TASK_MOVED,
                dto.taskId,
                {
                    fromColumnId: task.columnId,
                    toColumnId: dto.targetColumnId,
                    position: dto.position,
                },
            );

            // Broadcast to room (exclude sender)
            client.to(`project:${projectId}`).emit('taskMoved', {
                task: updatedTask,
                movedBy: {
                    id: userId,
                    name: client.data.userName,
                },
                fromColumnId: task.columnId,
                toColumnId: dto.targetColumnId,
                position: dto.position,
            });

            return {
                event: 'moveTask',
                data: { success: true, task: updatedTask } as any,
            };
        } catch (error) {
            return this.buildErrorResponse('moveTask', error);
        }
    }

    /**
     * 4. createTask - Create a new task via WebSocket
     */
    @SubscribeMessage('createTask')
    async handleCreateTask(
        client: Socket,
        payload: {
            columnId: string;
            title: string;
            description?: string;
            priority?: string;
            assigneeId?: string;
            dueDate?: string;
            labelIds?: string[];
        },
    ): Promise<WsResponse> {
        try {
            const dto = await this.validatePayload(CreateTaskWsDto, payload);
            const userId = client.data.userId;

            // Find the column to determine its project
            const column = await this.columnRepo.findOne({
                where: { id: dto.columnId },
            });

            if (!column) {
                return {
                    event: 'createTask',
                    data: {
                        success: false,
                        message: 'Column not found',
                        code: 'COLUMN_NOT_FOUND',
                    },
                };
            }

            const projectId = column.projectId;

            // Delegate to TasksService (handles membership validation, WIP limit, position)
            const newTask = await this.tasksService.createTask(
                userId,
                projectId,
                {
                    columnId: dto.columnId,
                    title: dto.title,
                    description: dto.description,
                    priority: dto.priority,
                    assigneeId: dto.assigneeId,
                    dueDate: dto.dueDate,
                    labelIds: dto.labelIds,
                },
            );

            // If assignee is set and differs from creator, send notification
            if (dto.assigneeId && dto.assigneeId !== userId) {
                await this.notificationsService.createNotification(
                    dto.assigneeId,
                    NotificationType.TASK_ASSIGNED,
                    'Task Assigned',
                    `${client.data.userName} assigned you to "${dto.title}"`,
                    newTask.id,
                    projectId,
                );

                // Push real-time notification to assignee
                this.emitNotification(dto.assigneeId, {
                    type: NotificationType.TASK_ASSIGNED,
                    title: 'Task Assigned',
                    message: `${client.data.userName} assigned you to "${dto.title}"`,
                    taskId: newTask.id,
                    projectId,
                });
            }

            // Log activity
            await this.activityLogsService.logActivity(
                projectId,
                userId,
                ActivityAction.TASK_CREATED,
                newTask.id,
                { title: dto.title, columnId: dto.columnId },
            );

            // Broadcast to room (exclude sender)
            client.to(`project:${projectId}`).emit('taskCreated', {
                task: newTask,
                createdBy: {
                    id: userId,
                    name: client.data.userName,
                },
            });

            return {
                event: 'createTask',
                data: { success: true, task: newTask } as any,
            };
        } catch (error) {
            return this.buildErrorResponse('createTask', error);
        }
    }

    /**
     * 5. updateTask - Update task fields via WebSocket
     */
    @SubscribeMessage('updateTask')
    async handleUpdateTask(
        client: Socket,
        payload: {
            taskId: string;
            changes: Record<string, unknown>;
        },
    ): Promise<WsResponse> {
        try {
            const dto = await this.validatePayload(UpdateTaskWsDto, payload);
            const userId = client.data.userId;

            // Find the task to determine its project
            const task = await this.taskRepo.findOne({
                where: { id: dto.taskId },
            });

            if (!task) {
                return {
                    event: 'updateTask',
                    data: {
                        success: false,
                        message: 'Task not found',
                        code: 'TASK_NOT_FOUND',
                    },
                };
            }

            const projectId = task.projectId;
            const previousAssigneeId = task.assigneeId;

            // Delegate to TasksService (handles permission checks: owner edits any, member edits own)
            const updatedTask = await this.tasksService.updateTask(
                userId,
                projectId,
                dto.taskId,
                dto.changes,
            );

            // If assignee changed, notify the new assignee
            if (
                dto.changes.assigneeId &&
                dto.changes.assigneeId !== previousAssigneeId &&
                dto.changes.assigneeId !== userId
            ) {
                await this.notificationsService.createNotification(
                    dto.changes.assigneeId,
                    NotificationType.TASK_ASSIGNED,
                    'Task Assigned',
                    `${client.data.userName} assigned you to "${updatedTask.title}"`,
                    dto.taskId,
                    projectId,
                );

                this.emitNotification(dto.changes.assigneeId, {
                    type: NotificationType.TASK_ASSIGNED,
                    title: 'Task Assigned',
                    message: `${client.data.userName} assigned you to "${updatedTask.title}"`,
                    taskId: dto.taskId,
                    projectId,
                });
            }

            // Log activity
            await this.activityLogsService.logActivity(
                projectId,
                userId,
                ActivityAction.TASK_UPDATED,
                dto.taskId,
                { changes: dto.changes },
            );

            // Broadcast to room (exclude sender)
            client.to(`project:${projectId}`).emit('taskUpdated', {
                task: updatedTask,
                updatedBy: {
                    id: userId,
                    name: client.data.userName,
                },
                changes: dto.changes,
            });

            return {
                event: 'updateTask',
                data: { success: true, task: updatedTask } as any,
            };
        } catch (error) {
            return this.buildErrorResponse('updateTask', error);
        }
    }

    /**
     * 6. deleteTask - Soft-delete a task (Owner only)
     */
    @SubscribeMessage('deleteTask')
    async handleDeleteTask(
        client: Socket,
        payload: { taskId: string },
    ): Promise<WsResponse> {
        try {
            const dto = await this.validatePayload(DeleteTaskWsDto, payload);
            const userId = client.data.userId;

            // Find the task to determine its project
            const task = await this.taskRepo.findOne({
                where: { id: dto.taskId },
            });

            if (!task) {
                return {
                    event: 'deleteTask',
                    data: {
                        success: false,
                        message: 'Task not found',
                        code: 'TASK_NOT_FOUND',
                    },
                };
            }

            const projectId = task.projectId;

            // Delegate to TasksService (handles ownership validation and soft-delete)
            await this.tasksService.deleteTask(userId, projectId, dto.taskId);

            // Log activity
            await this.activityLogsService.logActivity(
                projectId,
                userId,
                ActivityAction.TASK_DELETED,
                dto.taskId,
                { title: task.title },
            );

            // Broadcast to room (exclude sender)
            client.to(`project:${projectId}`).emit('taskDeleted', {
                taskId: dto.taskId,
                columnId: task.columnId,
                deletedBy: {
                    id: userId,
                    name: client.data.userName,
                },
            });

            return {
                event: 'deleteTask',
                data: { success: true, message: 'Task moved to trash' },
            };
        } catch (error) {
            return this.buildErrorResponse('deleteTask', error);
        }
    }

    // ─── Public Broadcast Methods (for REST controllers) ───────────

    /**
     * Emit taskMoved event to all clients in a project room.
     * Called by REST controllers after a task move operation.
     */
    emitTaskMoved(
        projectId: string,
        data: {
            task: Task;
            movedBy: { id: string; name: string };
            fromColumnId: string;
            toColumnId: string;
            position: number;
        },
    ): void {
        this.server.to(`project:${projectId}`).emit('taskMoved', data);
    }

    /**
     * Emit taskCreated event to all clients in a project room.
     */
    emitTaskCreated(
        projectId: string,
        data: {
            task: Task;
            createdBy: { id: string; name: string };
        },
    ): void {
        this.server.to(`project:${projectId}`).emit('taskCreated', data);
    }

    /**
     * Emit taskUpdated event to all clients in a project room.
     */
    emitTaskUpdated(
        projectId: string,
        data: {
            task: Task;
            updatedBy: { id: string; name: string };
            changes: Record<string, unknown>;
        },
    ): void {
        this.server.to(`project:${projectId}`).emit('taskUpdated', data);
    }

    /**
     * Emit taskDeleted event to all clients in a project room.
     */
    emitTaskDeleted(
        projectId: string,
        data: {
            taskId: string;
            columnId: string;
            deletedBy: { id: string; name: string };
        },
    ): void {
        this.server.to(`project:${projectId}`).emit('taskDeleted', data);
    }

    /**
     * Emit memberJoined event to all clients in a project room.
     */
    emitMemberJoined(
        projectId: string,
        data: {
            member: { id: string; name: string; role: string };
        },
    ): void {
        this.server.to(`project:${projectId}`).emit('memberJoined', data);
    }

    /**
     * Emit memberLeft event to all clients in a project room.
     */
    emitMemberLeft(
        projectId: string,
        data: {
            memberId: string;
            memberName: string;
        },
    ): void {
        this.server.to(`project:${projectId}`).emit('memberLeft', data);
    }

    /**
     * Emit columnUpdated event to all clients in a project room.
     */
    emitColumnUpdated(
        projectId: string,
        data: {
            column: {
                id: string;
                title: string;
                position: number;
                wipLimit: number | null;
            };
            action: 'created' | 'updated' | 'deleted' | 'reordered';
        },
    ): void {
        this.server.to(`project:${projectId}`).emit('columnUpdated', data);
    }

    /**
     * Emit boardRefresh event to force all clients in a project room to reload board data.
     */
    emitBoardRefresh(
        projectId: string,
        data: {
            reason: string;
        },
    ): void {
        this.server.to(`project:${projectId}`).emit('boardRefresh', data);
    }

    /**
     * Emit notification to a specific user across all their connected sockets.
     * Iterates connected sockets to find ones belonging to the target user.
     */
    emitNotification(
        userId: string,
        data: {
            type: NotificationType;
            title: string;
            message: string;
            taskId?: string;
            projectId?: string;
        },
    ): void {
        const sockets = this.server.sockets;
        if (!sockets) return;

        for (const [, socket] of sockets.sockets) {
            if (socket.data.userId === userId) {
                socket.emit('notification', data);
            }
        }
    }

    /**
     * Emit timerUpdate event to all clients in a project room.
     */
    emitTimerUpdate(
        projectId: string,
        data: {
            taskId: string;
            userId: string;
            userName: string;
            action: 'started' | 'stopped';
            duration?: number;
        },
    ): void {
        this.server.to(`project:${projectId}`).emit('timerUpdate', data);
    }

    // ─── Private Helpers ───────────────────────────────────────────

    /**
     * Validate a payload against a DTO class using class-validator.
     * Throws an error with validation details if validation fails.
     */
    private async validatePayload<T extends object>(
        DtoClass: new () => T,
        payload: unknown,
    ): Promise<T> {
        const instance = plainToInstance(DtoClass, payload);
        const errors = await validate(instance);

        if (errors.length > 0) {
            const messages = errors
                .map((e) => Object.values(e.constraints ?? {}).join(', '))
                .join('; ');

            const error = new Error(messages);
            (error as any).code = 'VALIDATION_ERROR';
            throw error;
        }

        return instance;
    }

    /**
     * Build a standardized error response for WebSocket event handlers.
     * Extracts code and message from various error types.
     */
    private buildErrorResponse(event: string, error: unknown): WsErrorResponse {
        let message = 'An unexpected error occurred';
        let code = 'INTERNAL_ERROR';

        if (error instanceof Error) {
            message = error.message;
            code =
                (error as any).code ??
                (error as any).status ??
                'INTERNAL_ERROR';

            // Map NestJS HTTP exception status codes
            if (typeof code === 'number') {
                switch (code) {
                    case 400:
                        code = 'BAD_REQUEST';
                        break;
                    case 403:
                        code = 'FORBIDDEN';
                        break;
                    case 404:
                        code = 'NOT_FOUND';
                        break;
                    default:
                        code = 'INTERNAL_ERROR';
                }
            }
        }

        // Handle NestJS HttpException
        if (error && typeof error === 'object' && 'getStatus' in error) {
            const httpError = error as {
                getStatus: () => number;
                message: string;
            };
            const status = httpError.getStatus();
            message = httpError.message;

            switch (status) {
                case 400:
                    code = 'BAD_REQUEST';
                    break;
                case 403:
                    code = 'FORBIDDEN';
                    break;
                case 404:
                    code = 'NOT_FOUND';
                    break;
                default:
                    code = `HTTP_${status}`;
            }
        }

        this.logger.warn(`WebSocket error on [${event}]: ${code} - ${message}`);

        return {
            event,
            data: {
                success: false,
                message,
                code: String(code),
            },
        };
    }
}
