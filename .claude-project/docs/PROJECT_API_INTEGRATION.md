# API Integration Status: html-taskboard

## Overview

This document tracks which frontend pages use which API endpoints, organized by frontend project and role access.

**Frontend Projects:**
- `frontend` - Main web application (Project Owner, Team Member)
- `dashboard` - Admin dashboard (Admin role)

## HTML <-> PRD Cross-Check

| HTML File | PRD Screen Match | PRD Section | Status |
|-----------|------------------|-------------|--------|
| index.html | Splash Page | Part 2: Common | Matched |
| - | Login Page | Part 2: Common | HTML Pending |
| - | Sign Up Page | Part 2: Common | HTML Pending |
| - | Forgot Password Page | Part 2: Common | HTML Pending |
| - | Projects List (Home) | Part 2: Project Owner | HTML Pending |
| - | Board View Page | Part 2: Project Owner | HTML Pending |
| - | Task Detail Page | Part 2: Project Owner | HTML Pending |
| - | Calendar View | Part 2: Project Owner | HTML Pending |
| - | Project Dashboard | Part 2: Project Owner | HTML Pending |
| - | My Tasks Tab | Part 2: Project Owner | HTML Pending |
| - | Notifications Tab | Part 2: Project Owner | HTML Pending |
| - | Profile Tab | Part 2: Project Owner | HTML Pending |
| - | Board Settings | Part 2: Project Owner | HTML Pending |
| - | Trash View | Part 2: Project Owner | HTML Pending |
| - | Admin Dashboard | Part 3: Admin | HTML Pending |
| - | User Management | Part 3: Admin | HTML Pending |
| - | Project Management | Part 3: Admin | HTML Pending |
| - | System Configuration | Part 3: Admin | HTML Pending |

## Frontend Pages -> API Mapping

### Public Pages (frontend)

| HTML File | Route | Frontend | API Endpoints | Status |
|-----------|-------|----------|---------------|--------|
| index.html | `/` | frontend | - | Pending |
| - | `/login` | frontend | POST /auth/login | HTML Pending |
| - | `/signup` | frontend | POST /auth/register | HTML Pending |
| - | `/forgot-password` | frontend | POST /auth/forgot-password | HTML Pending |
| - | `/reset-password` | frontend | POST /auth/reset-password | HTML Pending |
| - | `/verify-email` | frontend | POST /auth/verify-email | HTML Pending |

### Project Owner / Team Member Pages (frontend)

| HTML File | Route | Frontend | API Endpoints | Status |
|-----------|-------|----------|---------------|--------|
| - | `/projects` | frontend | GET /projects | HTML Pending |
| - | `/projects/new` | frontend | POST /projects | HTML Pending |
| - | `/projects/:id/board` | frontend | GET /projects/:id, GET /projects/:id/columns, GET /projects/:id/tasks | HTML Pending |
| - | `/projects/:id/calendar` | frontend | GET /projects/:id/calendar | HTML Pending |
| - | `/projects/:id/dashboard` | frontend | GET /projects/:id/dashboard | HTML Pending |
| - | `/projects/:id/settings` | frontend | PATCH /projects/:id, columns CRUD | HTML Pending |
| - | `/projects/:id/trash` | frontend | GET /projects/:id/trash | HTML Pending |
| - | `/tasks/:id` | frontend | GET /tasks/:id, subtasks, comments, attachments, time-entries | HTML Pending |
| - | `/my-tasks` | frontend | GET /projects (all), filter tasks by assignee | HTML Pending |
| - | `/notifications` | frontend | GET /notifications | HTML Pending |
| - | `/profile` | frontend | GET /users/me, PATCH /users/me | HTML Pending |
| - | `/profile/edit` | frontend | PATCH /users/me | HTML Pending |

### Admin Dashboard Pages (dashboard)

| HTML File | Route | Frontend | Role Access | API Endpoints | Status |
|-----------|-------|----------|-------------|---------------|--------|
| - | `/admin/dashboard` | dashboard | Admin | GET /admin/stats | HTML Pending |
| - | `/admin/users` | dashboard | Admin | GET /admin/users | HTML Pending |
| - | `/admin/users/:id` | dashboard | Admin | GET/PATCH/DELETE /admin/users/:id | HTML Pending |
| - | `/admin/users/new` | dashboard | Admin | POST /admin/users | HTML Pending |
| - | `/admin/projects` | dashboard | Admin | GET /admin/projects | HTML Pending |
| - | `/admin/projects/:id` | dashboard | Admin | GET/PATCH /admin/projects/:id | HTML Pending |
| - | `/admin/settings` | dashboard | Admin | GET/PATCH /admin/settings | HTML Pending |
| - | `/admin/export` | dashboard | Admin | GET /admin/export/* | HTML Pending |

**Routing Strategy:**
- `/admin/*` routes → Admin features (full system access)
- No ops/organizer routes needed for TaskBoard

**Note:** Almost all pages are "HTML Pending" since only a splash screen (index.html) exists as HTML prototype. Implementation will be done from PRD specifications directly.

## API Service Files

| Service | Location | Endpoints |
|---------|----------|-----------|
| AuthService | `src/services/auth.ts` | login, register, logout, refresh, forgot/reset password |
| ProjectService | `src/services/project.ts` | CRUD projects, members, dashboard |
| TaskService | `src/services/task.ts` | CRUD tasks, move, subtasks |
| CommentService | `src/services/comment.ts` | CRUD comments |
| AttachmentService | `src/services/attachment.ts` | upload, download, delete |
| TimeTrackingService | `src/services/time-tracking.ts` | timer, manual entries |
| NotificationService | `src/services/notification.ts` | list, mark read |
| AdminService | `src/services/admin.ts` | users, projects, settings, export |
| WebSocketService | `src/services/websocket.ts` | board real-time events |

## Integration Checklist

- [ ] Set up Axios instance with base URL
- [ ] Configure auth interceptors
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Add error states
- [ ] Test all endpoints
