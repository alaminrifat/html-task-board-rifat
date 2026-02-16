# TaskBoard PRD

> **Source**: prd.pdf
> **Converted**: 2026-02-16

## 1. Overview

TaskBoard is a lightweight, mobile-first project management platform centered around Kanban boards. It enables project owners to organize work visually, assign tasks to team members, and track progress in real-time. The platform focuses on simplicity and real-time collaboration without the complexity of traditional enterprise PM tools.

### Goals

1. Provide a simple, intuitive Kanban board experience with real-time synchronization across all users
2. Enable project owners to track team progress through automated dashboards and completion metrics
3. Facilitate team collaboration through task comments, file attachments, and notification-driven workflows

### Project Type

- Mobile App (React Native) - Project Owner & Team Member
- Web App (React Webview) - Alternative access for Project Owner & Team Member
- Admin Dashboard (React) - Admin management interface
- Backend API (NestJS / Django) - Team member chooses based on their stack

### 3rd Party APIs

| Service | Purpose |
|---------|---------|
| Google OAuth | Social login authentication for user signup/login |
| SendGrid | Email notifications for invitations, deadline reminders, and daily digest |
| AWS S3 | File attachment storage for documents and images uploaded to tasks |

## 2. Terminology

| Term | Definition |
|------|------------|
| Board | A Kanban-style project workspace containing columns and task cards |
| Column | A vertical list on the board representing a task status (e.g., To Do, In Progress, Done) |
| Card | A task item displayed on the board that can be dragged between columns |
| Label | A color-coded tag attached to tasks for categorization (e.g., Bug, Feature, Design) |
| Assignee | The team member responsible for completing a task |
| WIP Limit | Work In Progress limit - maximum number of cards allowed in a column |
| Swimlane | A horizontal division on the board for grouping cards by category or assignee |
| Backlog | A holding area for tasks that are planned but not yet moved to the active board |
| Blocker | A task dependency or issue preventing progress on the current task |
| Sprint | An optional time-boxed period for organizing tasks (not enforced) |

## 3. User Types

### Project Owner
- **Description**: Creates and manages projects, builds Kanban boards, creates and assigns tasks, invites team members, monitors project progress via dashboard
- **Permissions**:
  - Create / edit / delete projects
  - Create / edit / delete tasks
  - Manage columns (add, edit, delete, set WIP limits)
  - Invite / remove members
  - Drag cards between columns
  - Change due dates via Calendar drag
  - Archive / delete project
  - Export CSV
  - Soft delete tasks (move to Trash)
  - Restore deleted tasks

### Team Member
- **Description**: Views assigned tasks, creates tasks, updates task status by dragging cards, adds comments and file attachments, creates sub-tasks, logs time on tasks, receives notifications for assignments and deadlines
- **Permissions**:
  - Create tasks
  - Edit own tasks only (title, description, assignee, priority, due date)
  - Drag cards between columns
  - Add / manage sub-tasks
  - Log time on tasks
  - Add comments
  - Upload file attachments
  - View board, calendar, and dashboard
  - **Cannot**: Create projects, edit project settings, delete tasks, restore deleted tasks, manage columns, invite/remove members, archive/delete project, change due dates via Calendar drag, export CSV

### Admin
- **Description**: Manages all users and projects, monitors system usage analytics, configures system settings
- **Permissions**:
  - Manage all users (create, edit, suspend, delete, change role, reset password)
  - Manage all projects (view, archive, delete)
  - View system analytics (user registration trend, project creation trend, task completion rate)
  - Configure system settings (general, notification, labels)
  - Export data (user reports, project reports, task reports as CSV)

### User Relationships

- Project Owner → Projects: 1:N (one owner manages multiple projects)
- Project Owner → Team Members: 1:N (one owner invites multiple members per project)
- Team Member → Projects: N:M (one member belongs to multiple projects)
- Team Member → Tasks: 1:N (one member is assigned multiple tasks)

## 4. Project Structure

### Frontend (React Web)
- Web application for Project Owner and Team Member access
- Real-time Kanban board with drag-and-drop
- Calendar view, dashboard, task management
- Port: 5173

### Mobile (React Native)
- Mobile app for Project Owner and Team Member
- Same feature set as web application
- Push notifications for assignments and deadlines

### Backend (NestJS)
- REST API server
- WebSocket for real-time board synchronization
- JWT authentication with Google OAuth
- File upload handling (AWS S3)
- Email notifications (SendGrid)
- Port: 3000

### Admin Dashboard (React)
- Separate React application for Admin role
- User management, project management, system configuration
- Analytics dashboards and data export
- Port: 5174

## 5. Page Architecture

### Navigation Structure

**Project Owner / Team Member Navigation:**
1. Projects (Home)
2. My Tasks
3. Notifications
4. Profile

**Admin Sidebar Navigation:**
1. Dashboard
2. User Management
3. Project Management
4. System Configuration

### Page Hierarchy

```
Common Pages (Public)
├── Splash Page
├── Login Page
├── Sign Up Page
├── Forgot Password Page
└── Reset Password Page

Project Owner / Team Member Pages
├── Projects Tab (Home)
│   ├── Project List (Grid/List toggle)
│   └── Project Creation Page
├── Board View Page
│   ├── Kanban Board (drag-and-drop columns)
│   ├── Calendar View (month/week toggle)
│   ├── Task Detail Page
│   │   ├── Sub-Tasks Section
│   │   ├── Time Tracking Section
│   │   ├── Attachments Section
│   │   ├── Comments Section
│   │   └── Activity Log
│   ├── Board Settings Page
│   ├── Trash View Page
│   └── Project Dashboard Page
├── My Tasks Tab
├── Notifications Tab
└── Profile Tab
    └── Edit Profile Page

Admin Dashboard Pages
├── Dashboard Home (stats, charts, activity)
├── User Management
│   ├── User List (search, filter, bulk actions)
│   ├── Create User Modal
│   └── User Detail Drawer
├── Project Management
│   ├── Project List (search, filter, bulk actions)
│   └── Project Detail Drawer
└── System Configuration
    ├── General Settings
    ├── Notification Settings
    ├── Label Configuration
    └── Export / Data Download
```

## 6. Page List with Features

### Common Pages

| Page Name | Features | User Type | Priority |
|-----------|----------|-----------|----------|
| Splash Page | Logo display (#4A90D9 background), auto-login check, redirect logic | All | P0 |
| Login Page | Email/password input, show/hide toggle, Google OAuth, forgot password link, sign up link | All | P0 |
| Sign Up Page | Full name, email, password, confirm password, job title (optional), profile photo (optional), email verification, invitation auto-fill | All | P0 |
| Forgot Password Page | Email input, send reset link via SendGrid | All | P0 |
| Reset Password Page | New password, confirm password, min 8 chars validation | All | P0 |

### Project Owner / Team Member Pages

| Page Name | Features | User Type | Priority |
|-----------|----------|-----------|----------|
| Projects List (Home) | Grid/list toggle, project cards (title, progress bar, member count, deadline, task count), FAB for new project (Owner only), search by name, filter (All/Active/Completed/Archived), sort (Recent/Deadline/Name) | Owner, Member | P0 |
| Project Creation Page | Title (required), description (rich text), deadline (date picker), board template selection (Default/Minimal/Custom), column WIP limits, team invitation (email or link) | Owner | P0 |
| Board View Page | Board header (title, member avatars, view toggle, settings, dashboard, progress badge), horizontal scrollable columns, column title with task count, WIP limit indicator, "+" add card button, task cards (title, priority badge, assignee avatar, due date, labels, comment/attachment counts), drag-and-drop, real-time WebSocket sync | Owner, Member | P0 |
| Calendar View | Monthly calendar with tasks on due dates, color-coded by priority, tap date to see tasks, tap task for detail, drag to change due date (Owner only), week/month toggle | Owner, Member | P1 |
| Task Detail Page | Editable title/status/priority, description (rich text), assignee dropdown, due date, labels (Bug/Feature/Design/Documentation/Improvement), sub-tasks checklist with progress, time tracking (start/stop timer + manual entry), file attachments (PDF/PNG/JPG/DOCX/XLSX, max 10MB), threaded comments with @mentions, activity log, move to trash (Owner only) | Owner, Member | P0 |
| Trash View Page | List of soft-deleted tasks (title, deleted by, deleted date), restore button, permanent delete (Owner only), auto-delete after 30 days | Owner | P1 |
| Board Settings Page | Edit project title/description/deadline, manage columns (add/rename/reorder/delete/WIP limits), manage members (view/remove/resend invite), trash link, archive/delete project | Owner | P1 |
| Project Dashboard Page | Summary cards (total/completed/overdue tasks, completion %), charts (tasks per status bar chart, tasks per priority pie chart, member workload horizontal bar, completion trend line chart), date range filter, assignee filter, priority filter, CSV export | Owner, Member | P1 |
| My Tasks Tab | All assigned tasks across projects, grouped by project, task cards (title, project, status, priority, due date), overdue highlighting, filter (All/Overdue/Due Today/Due This Week), sort (Due date/Priority/Project) | Owner, Member | P0 |
| Notifications Tab | Chronological list, types (task assigned, due date reminder, status change, comment mention, new comment, invitation), tap to navigate, swipe to dismiss, mark all as read | Owner, Member | P1 |
| Profile Tab | Profile photo, name, email, job title, edit profile link, notification preferences (push on/off, email digest Off/Daily/Weekly, per-type toggles), log out, delete account | Owner, Member | P1 |
| Edit Profile Page | Editable name, job title, profile photo, email change with re-verification | Owner, Member | P1 |

### Admin Dashboard Pages

| Page Name | Features | User Type | Priority |
|-----------|----------|-----------|----------|
| Dashboard Home | Stats cards (total users, total projects, total tasks, active users today), period filter (Today/7d/30d/Custom), charts (user registration trend line, project creation trend bar, task completion rate line, top 5 active projects bar), recent activity (latest 10 events) | Admin | P0 |
| User Management | Search (name, email), filters (role, status, date range), create user button, bulk actions (activate/suspend/delete/export CSV), table (name, email, role, status, projects count, tasks count, registration date, last active), column sorting, pagination | Admin | P0 |
| User Creation Modal | Full name, email, role selection (Project Owner/Team Member), sends invitation email | Admin | P0 |
| User Detail Drawer | Profile header, account actions (activate/suspend, reset password, change role), project list, recent tasks, activity stats, timestamps | Admin | P1 |
| Project Management | Search (project name, owner name), filters (status, date range, member count range), bulk actions (archive/delete/export CSV), table (project name, owner, status, members, tasks, completion %, created, deadline), column sorting, pagination | Admin | P0 |
| Project Detail Drawer | Project info, owner info, members list, task summary (per status, overdue count), recent activity, archive/delete actions | Admin | P1 |
| System Configuration | General settings (app name, default template columns, max file upload size, allowed file types), notification settings (global email toggle, default digest frequency, deadline reminder timing), label configuration (manage predefined labels with colors) | Admin | P1 |
| Export / Data Download | User reports CSV, project reports CSV, task reports CSV, date range filter, current filtered results export | Admin | P1 |

## 7. System Modules (Step-by-step Flows)

### Module 1 - Project Creation (Project Owner)

1. Project Owner taps "New Project" button
2. Owner enters project title, description, and deadline
3. Owner selects Kanban template (Default: To Do, In Progress, Review, Done) or creates custom columns
4. System creates the project with the selected board template
5. Owner invites team members via email
6. Team members receive invitation notification and join the project
7. Project appears in both owner's and members' project list

### Module 2 - Task Management (Project Owner / Team Member)

1. User opens a project board
2. Any user (Owner or Member) creates a new task card in a column by tapping "+" button
3. User fills in task details: title, description, assignee, priority (Low/Medium/High/Urgent), due date, labels
4. User can add sub-tasks (checklist items) within the task
5. Assigned team member receives push notification
6. Team member drags task card between columns to update status
7. System updates task status in real-time via WebSocket and notifies relevant users
8. Users can add threaded comments, file attachments, and log time spent on the task

### Module 3 - Kanban Board Real-Time Interaction

1. User opens project board
2. Board displays columns with task cards sorted by priority
3. User drags a card from one column to another
4. System broadcasts the change to all connected users via WebSocket
5. All users viewing the board see the change instantly without refresh
6. If a column has a WIP limit and it's reached, system shows a warning before allowing the move
7. Board auto-saves all changes

### Module 4 - Progress Tracking (Project Owner)

1. Owner opens project dashboard
2. System displays overall completion percentage (Done tasks / Total tasks)
3. Dashboard shows: overdue tasks count, tasks per status bar chart, member workload distribution, total time logged
4. Owner can filter by date range, assignee, or priority
5. Owner can export project report as CSV

### Module 5 - Calendar View (All App Users)

1. User navigates to Calendar View (toggle on Board View header)
2. System displays a monthly calendar with task cards placed on their due dates
3. Tasks are color-coded by priority
4. User can tap a date to see all tasks due that day
5. User can tap a task to open Task Detail Page
6. User can drag tasks to different dates to change due dates (Owner only)
7. Week/Month toggle for different views

## 8. Admin Dashboard Standard Features

### List Page Standard Features

| Feature | Description |
|---------|-------------|
| Search | Keyword search field (name, ID, email, etc.) |
| Filters | Status / Date / Category dropdown filters |
| Column Sorting | Click table header to sort ASC/DESC |
| Checkbox Selection | Row checkboxes + Select All checkbox |
| Bulk Actions | Bulk delete / Status change / Export for selected items |
| Pagination | Page navigation + Items per page selector (10/25/50/100) |

### Table UI Standard Features

| Feature | Description |
|---------|-------------|
| Loading State | Skeleton or spinner while data loads |
| Empty State | Message displayed when no data exists |
| Action Column | Edit / Delete / View Detail buttons per row |

### Detail/Edit Standard Features

| Feature | Description |
|---------|-------------|
| Detail Drawer/Modal | Click row to open detail panel |
| Edit Form | Switch to edit mode within detail view |
| Delete Confirmation | Confirmation dialog before deletion |

### Data Export Standard Features

| Feature | Description |
|---------|-------------|
| CSV/Excel Download | Export current filtered/searched results |
| Date Range Selection | Period filter for export |

### Common UI/UX Standard Features

| Feature | Description |
|---------|-------------|
| Toast Notifications | Success/Error feedback messages |
| Breadcrumb | Current location navigation |

## 9. Permission Differences (Owner vs Team Member)

| Feature | Project Owner | Team Member |
|---------|--------------|-------------|
| Create project | Yes | No |
| Edit project settings | Yes | No |
| Create tasks | Yes | Yes |
| Edit task details (title, description, assignee, priority, due date) | Yes | Own tasks only |
| Delete tasks (soft delete) | Yes | No |
| Restore deleted tasks | Yes | No |
| Manage columns (add/edit/delete) | Yes | No |
| Invite/remove members | Yes | No |
| Archive/delete project | Yes | No |
| Drag cards between columns | Yes | Yes |
| Add/manage sub-tasks | Yes | Yes |
| Log time on tasks | Yes | Yes |
| Add comments | Yes | Yes |
| Upload file attachments | Yes | Yes |
| View board, calendar, and dashboard | Yes | Yes |
| Change due dates via Calendar drag | Yes | No |
| Export CSV | Yes | No |

## 10. Resolved Questions

| # | Question | Answer |
|---|----------|--------|
| 1 | Maximum number of projects per user? | No limit |
| 2 | Maximum number of members per project? | No limit |
| 3 | Is time tracking required for MVP? | Yes - start/stop timer + manual entry |
| 4 | Should deleted tasks be soft-deleted or hard-deleted? | Soft delete - recoverable for 30 days |
| 5 | Should team members be able to create tasks? | Yes |
| 6 | Is sub-task support needed? | Yes - checklist-style with progress indicator |
| 7 | Should there be a calendar view? | Yes - month/week toggle |
| 8 | Is guest access needed? | No |
| 9 | Should offline mode support editing? | No - view only |

## 11. UX Improvement Suggestions

| # | Current Flow | Issue | Suggestion | Priority |
|---|-------------|-------|------------|----------|
| 1 | Board view only | No flat list for 30+ tasks | Add "List View" toggle on Board page for table-style task viewing | Medium |
| 2 | No quick overdue visibility | Must scroll all columns to spot overdue cards | Add "Overdue (N)" filter badge on board header | High |
| 3 | File attachments lack preview | Must download to view contents | Add inline preview for images and PDF thumbnails | Medium |
| 4 | No keyboard shortcuts | Mouse-only interaction on desktop | Add shortcuts: N (new task), arrows (navigate), Enter (open detail) | Low |
| 5 | Notifications flat list | All types mixed, hard to find urgent items | Add tab filters: All / Assignments / Comments / Deadlines | Medium |

## 12. Change Log

### Version 1.1 (2026-02-09)

| Change Type | Before | After |
|-------------|--------|-------|
| Feature Addition | No time tracking | Time Tracking Section added (start/stop timer + manual entry) |
| Feature Addition | No sub-tasks | Sub-Tasks Section added (checklist with progress indicator) |
| Feature Addition | Board view only | Calendar View added (month/week toggle) |
| Permission Change | Only Owner creates tasks | Team Members can also create tasks |
| Behavior Change | Hard delete tasks | Soft delete with 30-day Trash recovery |
| Clarification | No project/member limits defined | No limits on projects per user or members per project |
| Clarification | Guest access undefined | No guest access |
| Clarification | Offline editing undefined | Offline viewing only, no editing |

### Version 1.0 (2026-02-09)

- Initial PRD created from TaskBoard training project generation

---
*Generated from PRD PDF using /pdf-to-prd skill*
