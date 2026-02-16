# Project Knowledge: html-taskboard

## 1. Project Overview

TaskBoard is a lightweight, mobile-first project management platform centered around Kanban boards. It enables project owners to organize work visually, assign tasks to team members, and track progress in real-time. The platform focuses on simplicity and real-time collaboration without the complexity of traditional enterprise PM tools. It comprises three deployable applications: a React web frontend for project owners and team members, a React admin dashboard for system administrators, and a NestJS backend API with WebSocket support for real-time board synchronization. Key goals are: (1) provide a simple, intuitive Kanban board experience with real-time synchronization across all users, (2) enable project owners to track team progress through automated dashboards and completion metrics, and (3) facilitate team collaboration through task comments, file attachments, and notification-driven workflows.

## 2. Tech Stack

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| NestJS | 11.0.1 | API framework |
| TypeORM | 0.3.27 | ORM / database access |
| PostgreSQL (pg) | 8.14.1 | Database driver |
| TypeScript | 5.7.3 | Language |
| Passport + passport-jwt | 0.7.0 / 4.0.1 | Authentication middleware |
| @nestjs/jwt | 11.0.0 | JWT token management |
| @nestjs/swagger | 11.1.0 | API documentation |
| @nestjs/throttler | 6.4.0 | Rate limiting |
| @nestjs/microservices | 11.1.6 | WebSocket / microservice support |
| class-validator | 0.14.1 | DTO validation |
| class-transformer | 0.5.1 | DTO transformation |
| bcrypt | 5.1.1 | Password hashing |
| nodemailer | 7.0.9 | Email sending (SendGrid SMTP) |
| @aws-sdk/client-s3 | 3.775.0 | S3 file storage |
| @aws-sdk/lib-storage | 3.775.0 | S3 multipart uploads |
| multer | 2.0.1 | File upload handling |
| nest-winston | 1.10.2 | Logging |
| nestjs-i18n | 10.5.1 | Internationalization |
| rxjs | 7.8.1 | Reactive programming |

### Frontend (Web App)

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.0.0 | UI framework |
| React Router | 7.5.0 | Client-side routing |
| Redux Toolkit | 2.6.1 | State management |
| React Redux | 9.2.0 | React-Redux bindings |
| TailwindCSS | 4.0.0 | Utility-first CSS |
| Vite | 5.4.11 | Build tool / dev server |
| TypeScript | 5.7.2 | Language |
| Axios | 1.8.4 | HTTP client |
| React Hook Form | 7.55.0 | Form handling |
| Zod | 3.24.2 | Schema validation |
| Lucide React | 0.487.0 | Icon library |
| Radix UI | 2.1.3+ | Headless UI primitives |
| tailwind-merge | 3.2.0 | Tailwind class merging |

### Dashboard (Admin)

Same stack as Frontend (cloned from same react-starter-kit). Runs on port 5174.

### Infrastructure

| Technology | Purpose |
|-----------|---------|
| Docker + Docker Compose | Container orchestration |
| PostgreSQL | Relational database |
| WebSocket (NestJS gateway) | Real-time board synchronization |

### Service Ports

| Service | Port |
|---------|------|
| Backend API | 3000 |
| Frontend Web | 5173 |
| Admin Dashboard | 5174 |

## 3. User Types & Roles

### Project Owner

Creates and manages projects, builds Kanban boards, creates and assigns tasks, invites team members, monitors project progress via dashboard.

| Permission | Allowed |
|-----------|---------|
| Create project | Yes |
| Edit project settings (title, description, deadline) | Yes |
| Delete project (with confirmation) | Yes |
| Archive project | Yes |
| Create tasks | Yes |
| Edit any task details (title, description, assignee, priority, due date, labels) | Yes |
| Delete tasks (soft delete to Trash) | Yes |
| Restore deleted tasks from Trash | Yes |
| Permanently delete trashed tasks | Yes |
| Manage columns (add, rename, reorder, delete) | Yes |
| Set WIP limits on columns | Yes |
| Invite team members via email or link | Yes |
| Remove team members from project | Yes |
| Resend invitation to members | Yes |
| Drag cards between columns | Yes |
| Change due dates via Calendar drag | Yes |
| Add / manage sub-tasks | Yes |
| Log time on tasks (timer + manual) | Yes |
| Add comments | Yes |
| Upload file attachments | Yes |
| View board, calendar, and project dashboard | Yes |
| Export project report as CSV | Yes |
| Select board template (Default / Minimal / Custom) | Yes |

### Team Member

Views assigned tasks, creates tasks, updates task status by dragging cards, adds comments and file attachments, creates sub-tasks, logs time on tasks, receives notifications for assignments and deadlines.

| Permission | Allowed |
|-----------|---------|
| Create project | No |
| Edit project settings | No |
| Delete / archive project | No |
| Create tasks | Yes |
| Edit own tasks only (title, description, assignee, priority, due date) | Yes |
| Edit other users' tasks | No |
| Delete tasks (soft delete) | No |
| Restore deleted tasks | No |
| Manage columns | No |
| Invite / remove members | No |
| Drag cards between columns | Yes |
| Change due dates via Calendar drag | No (read-only calendar) |
| Add / manage sub-tasks | Yes |
| Log time on tasks (timer + manual) | Yes |
| Add comments (including @mentions) | Yes |
| Upload file attachments | Yes |
| View board, calendar, and project dashboard | Yes |
| Export CSV | No |

### Admin

Manages all users and projects from a separate dashboard application. Does not interact with Kanban boards directly.

| Permission | Allowed |
|-----------|---------|
| View system analytics (user registration, project creation, task completion trends) | Yes |
| Create users (sends invitation email) | Yes |
| Edit users (name, email, role) | Yes |
| Suspend / activate users | Yes |
| Delete users (with confirmation) | Yes |
| Reset user passwords | Yes |
| Change user roles (Project Owner / Team Member) | Yes |
| View all projects | Yes |
| Archive any project | Yes |
| Delete any project (with confirmation) | Yes |
| Configure general settings (app name, default template columns, max file upload size, allowed file types) | Yes |
| Configure notification settings (global email toggle, default digest frequency, deadline reminder timing) | Yes |
| Manage predefined labels (add, edit, delete, set colors) | Yes |
| Export user reports as CSV | Yes |
| Export project reports as CSV | Yes |
| Export task reports as CSV | Yes |
| Bulk actions: activate / suspend / delete users | Yes |
| Bulk actions: archive / delete projects | Yes |

### User Relationships

- Project Owner → Projects: 1:N (one owner manages multiple projects)
- Project Owner → Team Members: 1:N (one owner invites multiple members per project)
- Team Member → Projects: N:M (one member belongs to multiple projects)
- Team Member → Tasks: 1:N (one member is assigned multiple tasks)
- No limit on projects per user
- No limit on members per project

## 4. Core Features

### Authentication & Account Management

1. **Splash page** with auto-login check: valid token redirects to main screen, no token redirects to Login
2. **Email/password login** with show/hide password toggle
3. **Google OAuth login** ("Continue with Google" button)
4. **Sign up** with fields: full name (required), email (required), password (required, min 8 chars), confirm password (required), job title (optional), profile photo (optional)
5. **Email verification** required after sign up (verification link sent via SendGrid)
6. **Invitation flow**: users invited via email link get auto-filled email and simplified signup (name + password only)
7. **Terms of Service and Privacy Policy** agreement checkbox (required for signup)
8. **Forgot password**: email input, sends reset link via SendGrid, success message displayed
9. **Reset password** (via email link): new password + confirm, min 8 chars, must match, redirects to Login on success
10. **Profile viewing**: photo, full name, email, job title
11. **Profile editing**: editable name, job title, profile photo; email change requires re-verification
12. **Notification preferences**: push notifications on/off, email digest (Off / Daily / Weekly), per-type toggles (assignments, deadlines, comments, status changes)
13. **Log out** button
14. **Delete account** button with confirmation dialog

### Project Management

15. **Project list** with grid/list toggle view
16. **Project cards** showing: title, progress bar (completion %), member count (avatar stack), deadline date, task count (total / completed)
17. **Floating Action Button** for new project creation (Owner only; hidden for Team Member)
18. **Project search** by name
19. **Project filters**: All / Active / Completed / Archived
20. **Project sorting**: Recent / Deadline / Name
21. **Project creation**: title (required), description (optional, rich text), deadline (date picker)
22. **Board template selection**: Default (To Do → In Progress → Review → Done), Minimal (To Do → Done), Custom (create your own columns with optional WIP limits)
23. **Team invitation** during project creation: email input with "Add" button for multiple emails, or shareable invitation link
24. **Project archiving** (Owner only)
25. **Project deletion** with confirmation dialog (Owner only)

### Kanban Board

26. **Board header**: project title, member avatars (tap for full list), view toggle (Board / Calendar), settings icon, dashboard icon, progress percentage badge
27. **Horizontal scrollable columns** with vertical scrollable task cards per column
28. **Column display**: title with task count, WIP limit indicator ("3/5" style)
29. **Add card button** ("+") on each column for both Owner and Member
30. **Task cards** displaying: title, priority badge (color-coded: Low=gray, Medium=blue, High=orange, Urgent=red), assignee avatar, due date (red if overdue), label tags (color dots), comment count icon, attachment count icon
31. **Drag-and-drop** cards between columns to update task status
32. **Real-time sync via WebSocket**: all connected users see changes instantly without refresh
33. **WIP limit enforcement**: warning shown before allowing a move to a column at its WIP limit
34. **Board auto-save**: all changes saved automatically

### Calendar View

35. **Monthly calendar** with task cards placed on their due dates
36. **Color-coded tasks** by priority
37. **Tap date** to see all tasks due that day
38. **Tap task** to open Task Detail Page
39. **Drag tasks to change due dates** (Owner only; read-only for Team Member)
40. **Week / month toggle** for different calendar views

### Task Detail

41. **Editable task header**: title (editable by Owner), status badge (current column name), priority selector (Low / Medium / High / Urgent)
42. **Task body**: description (rich text, editable by Owner), assignee (dropdown of project members, editable by Owner), due date (date picker, editable by Owner), labels (multi-select)
43. **Predefined labels**: Bug (red), Feature (green), Design (purple), Documentation (blue), Improvement (orange)
44. **Sub-tasks section**: checklist items with checkboxes, progress indicator ("3/5 completed"), "Add Sub-Task" button with text input, tap checkbox to toggle, swipe to delete, sub-task completion contributes to parent task progress
45. **Time tracking section**: "Start Timer" button (starts counting HH:MM:SS), "Stop Timer" button (logs the entry), "Add Manual Entry" (input hours + minutes + description), time log list (date, duration, user, description), total time logged
46. **Attachments section**: file list (name, size, upload date), "Upload File" button, supported types: PDF, PNG, JPG, DOCX, XLSX (max 10MB), tap to preview/download
47. **Comments section**: threaded comment list with timestamps, author avatar/name/timestamp/text, @mention support (triggers notification), reply to comment (nested thread), text input with "Send" button
48. **Activity log**: chronological list of changes (status changes, assignee changes, comment additions, time entries), format: "[User] moved this task to [Column]" with timestamp
49. **Move to Trash** button (Owner only): soft delete with confirmation dialog

### Trash Management

50. **Trash view page** accessible via Board View header or Board Settings
51. **Trashed task list**: title, deleted by, deleted date
52. **Restore button** per task: moves task back to its original column
53. **Permanent delete button** per task (Owner only, with confirmation)
54. **Auto-permanent-delete** after 30 days
55. **Empty state**: "No deleted tasks" message

### Board Settings

56. **Edit project title and description**
57. **Edit project deadline**
58. **Manage columns**: add, rename, reorder, delete, set WIP limits
59. **Manage members**: view member list, remove member, resend invitation
60. **Trash link** to Trash View Page
61. **Archive project** button
62. **Delete project** button with confirmation

### Project Dashboard

63. **Summary cards**: total tasks, completed tasks, overdue tasks, completion percentage
64. **Tasks per status** bar chart
65. **Tasks per priority** pie chart
66. **Member workload** horizontal bar chart (tasks per member)
67. **Completion trend** line chart (completed tasks over time)
68. **Total time logged** display
69. **Date range filter** picker
70. **Filter by assignee**
71. **Filter by priority**
72. **Export CSV** button (Owner only)

### My Tasks

73. **Cross-project task list**: all tasks assigned to user across all projects
74. **Grouped by project name**
75. **Task display**: title, project name, status badge, priority badge, due date
76. **Overdue tasks** highlighted in red
77. **Tap task** navigates to Task Detail Page
78. **Filters**: All / Overdue / Due Today / Due This Week
79. **Sort by**: Due date / Priority / Project

### Notifications

80. **Chronological notification list**
81. **Notification types**: task assigned ("[Owner] assigned you to [Task] in [Project]"), due date reminder ("[Task] is due tomorrow"), status change ("[User] moved [Task] to [Column]"), comment mention ("[User] mentioned you in [Task]"), new comment ("[User] commented on [Task]"), invitation ("You've been invited to [Project]")
82. **Tap notification** navigates to related task or project
83. **Swipe to dismiss** individual notification
84. **"Mark All as Read"** button

### Admin Dashboard

85. **Dashboard home stats cards**: total users (with new this week), total projects (active count), total tasks (completed this week), active users today
86. **Period filter**: Today / Last 7 days / Last 30 days / Custom date range
87. **User registration trend** line chart
88. **Project creation trend** bar chart
89. **Task completion rate** line chart (completed per day)
90. **Top 5 most active projects** horizontal bar chart
91. **Recent activity**: latest 10 system events (user signups, project creations, etc.)

### Admin User Management

92. **User search** by name or email
93. **User filters**: Role (Project Owner / Team Member), Status (Active / Suspended), Registration date range
94. **"Create User" button** opens creation modal
95. **Bulk actions dropdown**: Activate / Suspend / Delete / Export CSV
96. **User table columns**: Name, Email, Role, Status, Projects Count, Tasks Count, Registration Date, Last Active
97. **Column sorting** (click header)
98. **Pagination** with items per page selector (10 / 25 / 50 / 100)
99. **Checkbox selection** with Select All
100. **User creation modal**: full name, email, role (Project Owner / Team Member), sends invitation email
101. **User detail drawer**: profile header, account actions (activate/suspend, reset password, change role), project list, recent tasks, activity stats (last login, total logins, tasks completed), timestamps (created at, last active)

### Admin Project Management

102. **Project search** by project name or owner name
103. **Project filters**: Status (Active / Completed / Archived), Date range, Member count range
104. **Bulk actions dropdown**: Archive / Delete / Export CSV
105. **Project table columns**: Project Name, Owner Name, Status, Members Count, Total Tasks, Completed Tasks, Completion %, Created Date, Deadline
106. **Column sorting and pagination**
107. **Project detail drawer**: project info (title, description, deadline, status, completion %), owner info (name, email), members list with roles, task summary (total, per-status breakdown, overdue count), recent activity, archive/delete actions

### Admin System Configuration

108. **General settings**: app name display, default Kanban template columns (configurable), maximum file upload size (default 10MB), allowed file types
109. **Notification settings**: email notification enabled/disabled (global toggle), default email digest frequency, deadline reminder timing (default 24 hours before)
110. **Label configuration**: manage predefined labels (Bug red, Feature green, Design purple, Documentation blue, Improvement orange), add / edit / delete labels, set default label colors

### Admin Data Export

111. **User reports CSV**: user list with activity metrics
112. **Project reports CSV**: project list with completion stats
113. **Task reports CSV**: all tasks with status, assignee, dates
114. **Date range selection** for export period
115. **Current filtered results export**

### Admin Standard UI Features

116. **Search** on every list page (keyword search by name, ID, email)
117. **Filters** on every list page (status, date, category dropdowns)
118. **Column sorting** (ASC/DESC) on every table
119. **Checkbox selection** with Select All on every table
120. **Bulk actions** on every table (delete, status change, export)
121. **Pagination** on every table (10 / 25 / 50 / 100 items per page)
122. **Loading state** (skeleton/spinner) while data loads
123. **Empty state** message when no data exists
124. **Action column** per row (Edit / Delete / View Detail)
125. **Detail drawer/modal** on row click
126. **Edit form** within detail view
127. **Delete confirmation** dialog before any deletion
128. **CSV/Excel download** of current filtered/searched results
129. **Date range selection** for exports
130. **Toast notifications** for success/error feedback
131. **Breadcrumb navigation** showing current location

## 5. Business Rules

### Authentication Rules

- Email must be unique in the system
- Password minimum 8 characters
- Password and confirm password must match
- Email verification required before account activation
- Invitation flow: invited users get auto-filled email + simplified signup (name + password only)
- Terms of Service and Privacy Policy agreement required for signup
- Auto-login: valid token on splash redirects to main screen; no token redirects to Login
- Email change on profile requires re-verification

### Project Rules

- Only Project Owner can create projects
- No limit on number of projects per user
- No limit on number of members per project
- Team Members only see projects they have been invited to
- Project Owner can select board template: Default (To Do, In Progress, Review, Done), Minimal (To Do, Done), or Custom columns
- Each column can optionally have a WIP (Work In Progress) limit
- Project can be archived (reversible) or deleted (with confirmation, irreversible)

### Task Rules

- Both Owner and Member can create tasks
- Team Members can only edit their own tasks' details (title, description, assignee, priority, due date)
- Project Owner can edit any task
- Tasks are sorted by priority within columns
- Priority levels: Low (gray), Medium (blue), High (orange), Urgent (red)
- Predefined labels: Bug (red), Feature (green), Design (purple), Documentation (blue), Improvement (orange)
- Assignee receives push notification when assigned
- Status updates via drag-and-drop between columns
- All board changes broadcast via WebSocket to connected users in real-time
- Board auto-saves all changes

### Soft Delete & Trash Rules

- Only Owner can soft-delete tasks (move to Trash)
- Trashed tasks are hidden from the board but recoverable
- Trashed tasks can be restored to their original column
- Only Owner can permanently delete trashed tasks
- Tasks auto-permanently-delete after 30 days in Trash
- Trash is accessible from Board View header or Board Settings

### Sub-Task Rules

- Sub-tasks are checklist items within a parent task
- Checkbox toggles complete/incomplete
- Swipe to delete a sub-task
- Sub-task completion contributes to parent task progress indicator ("3/5 completed")

### Time Tracking Rules

- Start/stop timer records elapsed time (HH:MM:SS)
- Manual entry accepts hours, minutes, and description
- Time log shows: date, duration, user, description
- Total time logged is displayed per task

### File Attachment Rules

- Allowed types: PDF, PNG, JPG, DOCX, XLSX
- Maximum file size: 10MB (configurable by Admin)
- Files stored on AWS S3
- Tap to preview/download

### Comment Rules

- Threaded comments with nested replies
- @mention triggers notification to mentioned user
- Each comment shows: author avatar, name, timestamp, text

### Calendar Rules

- Monthly calendar shows tasks on due dates
- Tasks color-coded by priority
- Owner can drag tasks to change due dates
- Team Member calendar is read-only (no drag)
- Week/month toggle available

### WIP Limit Rules

- WIP limit is optional per column
- Display format: "current/limit" (e.g., "3/5")
- System shows warning before allowing a card to move into a column at its WIP limit

### Notification Rules

- Six notification types: task assigned, due date reminder, status change, comment mention, new comment, invitation
- Tap navigates to related task/project
- Swipe to dismiss
- "Mark All as Read" available
- Notification preferences configurable: push on/off, email digest (Off/Daily/Weekly), per-type toggles (assignments, deadlines, comments, status changes)
- Default deadline reminder: 24 hours before due date (configurable by Admin)

### Admin Rules

- Admin operates from a separate dashboard application
- Admin can create users with role assignment (Project Owner / Team Member)
- Admin can suspend, activate, delete users
- Admin can reset user passwords and change roles
- Admin can archive or delete any project
- Bulk actions available on all admin list pages
- Pagination options: 10 / 25 / 50 / 100 items per page
- All admin list pages include: search, filters, column sorting, checkbox selection, bulk actions, pagination

### Data Export Rules

- Project Owner can export project report as CSV
- Admin can export: user reports, project reports, task reports as CSV
- Export respects current filters and date range
- Format: CSV

### Offline Rules

- Offline editing is not supported
- Offline viewing only

### Guest Access

- No guest access (account required)

## 6. Third-Party Integrations

### Google OAuth

| Property | Value |
|----------|-------|
| Purpose | Social login ("Continue with Google") for signup and login |
| Integration point | Login page and Sign Up page |
| Documentation | [Google Identity](https://developers.google.com/identity) |

### SendGrid

| Property | Value |
|----------|-------|
| Purpose | Transactional email delivery |
| Use cases | Email verification links, password reset links, team invitation emails, deadline reminder emails, daily/weekly digest emails |
| Integration | Via nodemailer (SMTP) or SendGrid API |
| Documentation | [SendGrid Docs](https://docs.sendgrid.com/) |

### AWS S3

| Property | Value |
|----------|-------|
| Purpose | File attachment storage |
| Use cases | Upload, store, and serve task attachments (PDF, PNG, JPG, DOCX, XLSX) |
| SDK | @aws-sdk/client-s3 v3.775.0, @aws-sdk/lib-storage v3.775.0 |
| Max file size | 10MB (configurable by Admin) |
| Documentation | [AWS S3 Docs](https://docs.aws.amazon.com/s3/) |

## 7. Terminology

| Term | Definition |
|------|------------|
| **Board** | A Kanban-style project workspace containing columns and task cards |
| **Column** | A vertical list on the board representing a task status (e.g., To Do, In Progress, Done) |
| **Card** | A task item displayed on the board that can be dragged between columns |
| **Label** | A color-coded tag attached to tasks for categorization (e.g., Bug, Feature, Design) |
| **Assignee** | The team member responsible for completing a task |
| **WIP Limit** | Work In Progress limit - maximum number of cards allowed in a column |
| **Swimlane** | A horizontal division on the board for grouping cards by category or assignee |
| **Backlog** | A holding area for tasks that are planned but not yet moved to the active board |
| **Blocker** | A task dependency or issue preventing progress on the current task |
| **Sprint** | An optional time-boxed period for organizing tasks (not enforced) |
| **Soft Delete** | Moving a task to Trash (hidden from board, recoverable for 30 days) |
| **Hard Delete** | Permanent deletion of a trashed task (irreversible) |
| **Template** | A preset column configuration for new boards (Default, Minimal, or Custom) |

---

## Appendix: Architecture

```
html-taskboard/
├── backend/              # NestJS 11 API server (port 3000)
├── frontend/             # React 19 web application (port 5173)
├── dashboard/            # React 19 admin dashboard (port 5174)
├── .claude/              # Claude Code configuration
├── .claude-project/      # Project documentation
└── docker-compose.yml    # Docker services orchestration
```

## Appendix: Environment Variables

### Backend (.env)

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - | `postgresql://user:pass@localhost:5432/db` |
| `AUTH_JWT_SECRET` | JWT signing secret (min 32 chars, never commit) | Yes | - | `your-secure-secret-key-min-32-chars` |
| `AUTH_TOKEN_COOKIE_NAME` | Access token cookie name | No | `accessToken` | `accessToken` |
| `AUTH_TOKEN_EXPIRE_TIME` | Access token expiration | No | `24h` | `24h`, `1d`, `3600s` |
| `AUTH_TOKEN_EXPIRED_TIME_REMEMBER_ME` | Extended expiration for "remember me" | No | `30d` | `30d` |
| `AUTH_REFRESH_TOKEN_COOKIE_NAME` | Refresh token cookie name | No | `refreshToken` | `refreshToken` |
| `AUTH_REFRESH_TOKEN_EXPIRE_TIME` | Refresh token expiration | No | `7d` | `7d` |
| `FRONTEND_URL` | Frontend URL for CORS allowlist | Yes | `http://localhost:5173` | `https://app.example.com` |
| `MODE` | Environment mode (DEV/PROD, affects cookie security) | Yes | `DEV` | `DEV`, `PROD` |

### Frontend / Dashboard (.env)

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `VITE_API_URL` | Backend API base URL | Yes | `http://localhost:3000/api` | `https://api.example.com` |

## Appendix: Security Architecture

This project uses **httpOnly cookie-based authentication** to prevent XSS token theft.

### Cookie Security Configuration

| Setting | Development (`MODE=DEV`) | Production (`MODE=PROD`) |
|---------|--------------------------|--------------------------|
| `httpOnly` | `true` | `true` |
| `secure` | `false` | `true` (HTTPS only) |
| `sameSite` | `'lax'` | `'strict'` |
| `path` | `'/'` | `'/'` |

- Access Token: 24h (or 30d with "Remember Me")
- Refresh Token: 7d

### Threat Mitigations

| Threat | Mitigation |
|--------|------------|
| XSS token theft | httpOnly cookies (JS cannot access tokens) |
| CSRF | SameSite=strict in production |
| Man-in-the-middle | Secure flag + HTTPS enforcement |
| Token replay | Short-lived access tokens with expiration |
| Unauthorized cross-origin | CORS with explicit origin allowlist + credentials |
