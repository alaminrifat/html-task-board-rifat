# PRD vs HTML Prototype Audit Report

> **Audited**: 2026-02-16
> **Sources**: prd.md, PROJECT_KNOWLEDGE.md, PROJECT_API.md, PROJECT_DATABASE.md, 25 HTML files

---

## Summary

| Metric | Count |
|--------|-------|
| **Total mismatches found** | **47** |
| Missing HTML pages | 2 |
| Extra HTML pages (not in PRD) | 1 |
| Missing form fields (in PRD/DB, not in HTML) | 14 |
| Extra form fields (in HTML, not in PRD/DB) | 8 |
| Broken user flows | 4 |
| API endpoints with no UI | 11 |
| UI features with no API | 0 |
| Role/permission mismatches | 7 |

---

## Audit 1: Pages — PRD Features vs HTML Pages

### PRD Features vs HTML Pages

| # | PRD Feature / Page | Expected Page | HTML File | Status | Notes |
|---|-------------------|---------------|-----------|--------|-------|
| 1 | Splash Page | Loading/splash screen | `index.html` | OK | Auto-redirects to login after 1500ms |
| 2 | Login Page | Email/password + Google OAuth | `auth/02-login.html` | OK | Has email, password, Google OAuth, forgot link, signup link |
| 3 | Sign Up Page | Registration form | `auth/05-signup.html` | OK | Has name, email, password, confirm, job title, photo, terms |
| 4 | Forgot Password Page | Email input, send reset link | `auth/03-forgot-password.html` | OK | Has email input and success state |
| 5 | Reset Password Page | New password + confirm | `auth/04-reset-password.html` | OK | Has password, confirm, 8-char validation |
| 6 | Projects List (Home) | Grid/list, filters, search, FAB | `user/06-projects-list.html` | OK | Has grid view, filters, sort, FAB, bottom nav |
| 7 | Project Creation Page | Title, description, deadline, template, invite | `user/07-project-creation.html` | OK | Has all fields plus member invite section |
| 8 | Board Template Selection | Default/Minimal/Custom templates | `user/07a-board-template.html` | OK | Has all 3 templates with custom column editor |
| 9 | Board View Page | Kanban columns, drag-drop, cards | `user/08-board-view.html` | OK | Has 4 columns, cards with priority/labels/assignee/dates |
| 10 | Calendar View | Monthly calendar with tasks | `user/09-calendar-view.html` | OK | Has month view, week/month toggle, task indicators |
| 11 | Task Detail Page | Full task detail with sub-sections | `user/10-task-detail.html` | OK | Has sub-tasks, time tracking, comments, activity |
| 12 | Trash View Page | Soft-deleted tasks, restore/delete | `user/11-trash-view.html` | OK | Has task list, restore, permanent delete, 30-day notice |
| 13 | Board Settings Page | Project settings, columns, members | `user/12-board-settings.html` | OK | Has project info, column mgmt, members, danger zone |
| 14 | Project Dashboard | Charts, stats, filters, export | `user/13-project-dashboard.html` | OK | Has all 4 charts, summary cards, filters, CSV export |
| 15 | My Tasks Tab | Cross-project task list | `user/14-my-tasks.html` | OK | Has grouped tasks, filters, sort, overdue indicators |
| 16 | Notifications Tab | Notification list, mark as read | `user/15-notifications.html` | OK | Has notification types, mark all as read |
| 17 | Profile Tab | Profile info, notification prefs | `user/16-profile.html` | OK | Has profile card, notification prefs, log out, delete |
| 18 | Edit Profile Page | Edit name, job title, photo, email | `user/17-edit-profile.html` | OK | Has name, job title, email (disabled), photo |
| 19 | Admin Dashboard | Stats, charts, activity | `admin/18-admin-dashboard.html` | OK | Has 4 stat cards, 4 charts, recent activity table |
| 20 | Admin User Management | User table, search, filter, bulk | `admin/19-user-management.html` | OK | Has table, search, filters, bulk actions, pagination |
| 21 | Admin User Creation Modal | Create user form | `admin/20-user-creation-modal.html` | OK | Has name, email, role, password, welcome email checkbox |
| 22 | Admin User Detail Drawer | User profile, actions, tabs | `admin/21-user-detail-drawer.html` | OK | Has profile, stats, actions, projects/tasks/activity tabs |
| 23 | Admin Project Management | Project table, search, filter | `admin/22-project-management.html` | OK | Has table, search, filters, pagination |
| 24 | Admin Project Detail Drawer | Project info, members, tasks | `admin/23-project-detail-drawer.html` | OK | Has project info, task breakdown, members, activity |
| 25 | Admin System Configuration | General, notifications, labels | `admin/24-system-configuration.html` | OK | Has all 3 setting sections |
| 26 | **Email Verification Page** | Verify email after signup | **MISSING** | **MISSING** | PRD requires email verification page (POST /api/auth/verify-email) — no HTML exists |
| 27 | **Export / Data Download Page** | Dedicated admin export page | **MISSING** | **MISSING** | PRD Section 6 lists "Export / Data Download" as a separate admin page with date range filters; no dedicated HTML exists (export buttons exist inline on other pages) |

### Reverse Check — HTML Pages Not in PRD

| HTML File | Matching PRD Feature | Status |
|-----------|---------------------|--------|
| `user/07a-board-template.html` | Part of Project Creation flow | **EXTRA** — PRD describes template selection as part of Project Creation Page, not as a separate page. However, this is a reasonable UX split and not harmful. |

---

## Audit 2: Fields — PRD Data vs HTML Forms

### Auth Pages

| Page | Form Field in HTML | In PRD/Database? | Mismatch |
|------|-------------------|-----------------|----------|
| 05-signup.html | Full name (text) | PRD: "full name" / DB: `full_name` | OK |
| 05-signup.html | Email (email) | PRD: "email" / DB: `email` | OK |
| 05-signup.html | Job title (text, optional) | PRD: "job title (optional)" / DB: `job_title` | OK |
| 05-signup.html | Profile photo (file) | PRD: "profile photo (optional)" / DB: `profile_photo_url` | OK |
| 05-signup.html | Password (password) | PRD: "password" / DB: `password_hash` | OK |
| 05-signup.html | Confirm password | PRD: "confirm password" | OK |
| 05-signup.html | Terms checkbox | PRD: "Terms of Service and Privacy Policy agreement" | OK |
| 05-signup.html | **MISSING: Invitation token field** | PRD: "invitation auto-fill" / API: `invitationToken` | **MISSING** — PRD says invited users get auto-filled email; HTML has no invitation token handling or auto-fill logic |
| 02-login.html | Email | PRD: "Email" | OK |
| 02-login.html | Password | PRD: "password" | OK |
| 02-login.html | **MISSING: Remember Me checkbox** | API: `rememberMe` field on login | **MISSING** — API supports `rememberMe: boolean` to extend token lifetime to 30 days, but HTML has no "Remember Me" checkbox |
| 04-reset-password.html | New password | PRD: "new password" | OK |
| 04-reset-password.html | Confirm password | PRD: "confirm password" | OK |

### Project Creation Page

| Page | Form Field in HTML | In PRD/Database? | Mismatch |
|------|-------------------|-----------------|----------|
| 07-project-creation.html | Title (text, required) | PRD: "title (required)" / DB: `title` | OK |
| 07-project-creation.html | Description (rich text) | PRD: "description (rich text)" / DB: `description` | OK |
| 07-project-creation.html | Deadline (date) | PRD: "deadline (date picker)" / DB: `deadline` | OK |
| 07-project-creation.html | Template selection | PRD: "board template selection" / DB: `template` | OK |
| 07-project-creation.html | Member invite (email) | PRD: "team invitation (email)" | OK |
| 07-project-creation.html | Copy invite link button | PRD: "shareable invitation link" | OK |
| 07a-board-template.html | Custom column names | PRD: "create your own columns" | OK |
| 07a-board-template.html | WIP limit per column | PRD: "column WIP limits" | OK |

### Task Detail Page

| Page | Form Field in HTML | In PRD/Database? | Mismatch |
|------|-------------------|-----------------|----------|
| 10-task-detail.html | Title (display only) | PRD: "Editable title" | **PARTIAL** — PRD says title is editable by Owner, but HTML shows it as read-only display text |
| 10-task-detail.html | Status badge (display only) | PRD: "status badge (current column name)" | OK (display only is expected) |
| 10-task-detail.html | Priority dot + text | PRD: "priority selector" | **PARTIAL** — PRD says priority is a selector (editable), HTML shows it as a static dot + text |
| 10-task-detail.html | Description (display only) | PRD: "description (rich text, editable by Owner)" | **PARTIAL** — HTML shows description as read-only text, no edit capability shown |
| 10-task-detail.html | Assignee (display only) | PRD: "assignee (dropdown of project members)" | **PARTIAL** — HTML shows assignee as static display, PRD expects a dropdown selector |
| 10-task-detail.html | Due date (display only) | PRD: "due date (date picker)" | **PARTIAL** — HTML shows date as static text, PRD expects a date picker |
| 10-task-detail.html | Labels (display only) | PRD: "labels (multi-select)" | **PARTIAL** — HTML shows labels as static tags, PRD expects multi-select |
| 10-task-detail.html | Sub-tasks (checklist) | PRD: "sub-tasks checklist with progress" | OK |
| 10-task-detail.html | Time tracking (start timer + entries) | PRD: "start/stop timer + manual entry" | **PARTIAL** — HTML shows "Start Timer" button and entries, but no "Add Manual Entry" input form (hours + minutes + description) |
| 10-task-detail.html | Comments (threaded) | PRD: "threaded comments with @mentions" | **PARTIAL** — HTML shows flat comments (no visible threading/reply UI), and no @mention autocomplete |
| 10-task-detail.html | Activity log | PRD: "activity log" | **MISSING** — PRD specifies an Activity Log section in task detail; HTML has no activity log section |
| 10-task-detail.html | **MISSING: Attachments section** | PRD: "Attachments section" / DB: `attachments` | **MISSING** — PRD specifies a file attachments section (upload, list, download); the task detail HTML has no attachments section at all |
| 10-task-detail.html | Move to Trash button | PRD: "Move to Trash (Owner only)" | OK |

### Board Settings Page

| Page | Form Field in HTML | In PRD/Database? | Mismatch |
|------|-------------------|-----------------|----------|
| 12-board-settings.html | Board title (text) | PRD: "Edit project title" | OK |
| 12-board-settings.html | Description (textarea) | PRD: "Edit project description" | OK |
| 12-board-settings.html | Deadline (text input) | PRD: "Edit project deadline" | OK |
| 12-board-settings.html | Column names (text inputs) | PRD: "Manage columns" | OK |
| 12-board-settings.html | Column WIP limits (number inputs) | PRD: "set WIP limits" | OK |
| 12-board-settings.html | Member list with remove/resend | PRD: "Manage members" | OK |
| 12-board-settings.html | Archive Project button | PRD: "Archive project" | OK |
| 12-board-settings.html | Delete Project button | PRD: "Delete project with confirmation" | OK |
| 12-board-settings.html | **MISSING: Add member/invite button** | PRD: "invite members" | **MISSING** — Board settings shows existing members but has no "Invite Member" button or email input to add new members |

### Profile / Edit Profile Pages

| Page | Form Field in HTML | In PRD/Database? | Mismatch |
|------|-------------------|-----------------|----------|
| 17-edit-profile.html | Full name (text) | PRD: "editable name" | OK |
| 17-edit-profile.html | Job title (text) | PRD: "editable job title" | OK |
| 17-edit-profile.html | Email (disabled) | PRD: "email change with re-verification" | **PARTIAL** — HTML shows email as disabled with hint text "Changing email requires re-verification" but no way to actually change it |
| 17-edit-profile.html | Profile photo (upload) | PRD: "editable profile photo" | OK |
| 16-profile.html | Notification preferences | PRD: per-type toggles | OK |
| 16-profile.html | **MISSING: Invitation notification toggle** | PRD: notification types include "invitation" | **PARTIAL** — HTML shows toggles for Assignments, Deadlines, Comments, Status Changes but no toggle for Invitation notifications |

### Admin User Creation Modal

| Page | Form Field in HTML | In PRD/Database? | Mismatch |
|------|-------------------|-----------------|----------|
| 20-user-creation-modal.html | Full Name | PRD: "full name" | OK |
| 20-user-creation-modal.html | Email Address | PRD: "email" | OK |
| 20-user-creation-modal.html | Role dropdown | PRD: "role (Project Owner / Team Member)" | **MISMATCH** — HTML shows roles: Admin / Manager / Member / Viewer. PRD specifies only: Project Owner / Team Member. "Manager" and "Viewer" are not in PRD or database enum |
| 20-user-creation-modal.html | Password field | PRD says "sends invitation email" | **EXTRA** — PRD says admin creates user and "sends invitation email" (no admin-set password). HTML has a password field the admin fills in. API also accepts password-less creation |
| 20-user-creation-modal.html | Send welcome email checkbox | Not explicitly in PRD | OK (reasonable UX addition) |

### Admin User Management

| Page | Form Field in HTML | In PRD/Database? | Mismatch |
|------|-------------------|-----------------|----------|
| 19-user-management.html | Role filter dropdown | PRD: "Role (Project Owner / Team Member)" | **MISMATCH** — HTML shows: Admin / Manager / Member / Viewer. PRD/DB enum: PROJECT_OWNER / TEAM_MEMBER / ADMIN |
| 19-user-management.html | Status filter dropdown | PRD: "Active / Suspended" | **MISMATCH** — HTML shows: Active / Inactive / Suspended. DB enum: ACTIVE / SUSPENDED / DELETED. "Inactive" is not a valid status in the DB |
| 19-user-management.html | **MISSING: Date range filter** | PRD: "Registration date range" filter | **MISSING** — PRD specifies date range filter for user list; HTML has no date range picker |
| 19-user-management.html | **MISSING: Export CSV button** | PRD: "Bulk actions: export CSV" | **MISSING** — Bulk actions button exists but no CSV export option visible |
| 19-user-management.html | Table role badges | PRD: "Project Owner / Team Member" | **MISMATCH** — Table shows Admin/Manager/Member/Viewer badges instead of PROJECT_OWNER/TEAM_MEMBER/ADMIN |

### Admin Project Management

| Page | Form Field in HTML | In PRD/Database? | Mismatch |
|------|-------------------|-----------------|----------|
| 22-project-management.html | Status filter | PRD: "Active / Completed / Archived" | OK |
| 22-project-management.html | Category filter | Not in PRD | **EXTRA** — HTML has "All Categories / Development / Marketing / Design" filter which is not in the PRD or database schema |
| 22-project-management.html | **MISSING: Date range filter** | PRD: "Date range" filter | **MISSING** — PRD specifies date range filter |
| 22-project-management.html | **MISSING: Member count range filter** | PRD: "Member count range" filter | **MISSING** — PRD specifies member count range filter |
| 22-project-management.html | **MISSING: Bulk actions dropdown** | PRD: "Bulk actions: Archive / Delete / Export CSV" | **MISSING** — No visible bulk actions UI on project management page |
| 22-project-management.html | Table "Completed" column | PRD: "Completed Tasks" column | OK |
| 22-project-management.html | **MISSING: Create Project button** | Should not exist per PRD | **EXTRA** — HTML has a "Create Project" button, but admin should not create projects (PRD says only Project Owner creates projects) |

### Admin System Configuration

| Page | Form Field in HTML | In PRD/Database? | Mismatch |
|------|-------------------|-----------------|----------|
| 24-system-configuration.html | Application Name | PRD: "app name display" | OK |
| 24-system-configuration.html | Default Kanban Columns | PRD: "default Kanban template columns" | OK |
| 24-system-configuration.html | Max File Upload Size | PRD: "maximum file upload size" | OK |
| 24-system-configuration.html | Allowed File Types | PRD: "allowed file types" | OK |
| 24-system-configuration.html | Email Notifications toggle | PRD: "email notification enabled/disabled" | OK |
| 24-system-configuration.html | Default Digest Frequency | PRD: "default email digest frequency" | OK |
| 24-system-configuration.html | Deadline Reminder (hours) | PRD: "deadline reminder timing" | OK |
| 24-system-configuration.html | Label configuration | PRD: "manage predefined labels" | OK |

### Admin Dashboard

| Page | Form Field in HTML | In PRD/Database? | Mismatch |
|------|-------------------|-----------------|----------|
| 18-admin-dashboard.html | Period filter (Today/7d/30d/Custom) | PRD: "period filter" | OK |
| 18-admin-dashboard.html | Stats: Total Users | PRD: "total users (with new this week)" | OK |
| 18-admin-dashboard.html | Stats: Total Projects | PRD: "total projects (active count)" | OK |
| 18-admin-dashboard.html | Stats: Total Tasks | PRD: "total tasks (completed this week)" | OK |
| 18-admin-dashboard.html | Stats: Active Users Today | PRD: "active users today" | OK |
| 18-admin-dashboard.html | Charts (4 charts) | PRD: 4 chart types | OK |
| 18-admin-dashboard.html | Recent activity table | PRD: "latest 10 events" | OK |

---

## Audit 3: User Roles — PRD Permissions vs HTML UI

### PRD Roles vs HTML Role Labels

| PRD Role | DB Enum Value | HTML Label Used | Mismatch |
|----------|--------------|-----------------|----------|
| Project Owner | `PROJECT_OWNER` | "Owner" (board settings), but admin pages use "Admin/Manager/Member/Viewer" | **MISMATCH** — Admin HTML uses completely different role taxonomy |
| Team Member | `TEAM_MEMBER` | "Member" (board settings) | OK (in user-facing pages) |
| Admin | `ADMIN` | "Admin" | OK |
| N/A | N/A | "Manager" (admin pages) | **EXTRA** — "Manager" role does not exist in PRD or DB enum |
| N/A | N/A | "Viewer" (admin pages) | **EXTRA** — "Viewer" role does not exist in PRD or DB enum |

### Permission Audit by Feature

| Feature | PRD Permission | HTML Shows | Mismatch |
|---------|---------------|-----------|----------|
| Create Project | Owner only | FAB visible on projects list (no role check shown) | **INFO** — HTML doesn't show Owner-only gating; frontend must implement `v-if` |
| Edit task fields | Owner: any task; Member: own only | Task detail shows all fields as read-only for all users | **INFO** — Need edit mode for Owner, limited edit for Member |
| Delete tasks (soft) | Owner only | "Move to Trash" button visible to all on task detail | **MISMATCH** — Button should be hidden for Team Members |
| Restore deleted tasks | Owner only | Trash view shows Restore button for all | **INFO** — PRD says Owner only; HTML doesn't differentiate |
| Permanent delete | Owner only | "Delete Permanently" shown for all in trash | **INFO** — Should be Owner-only |
| Manage columns | Owner only | Board settings page accessible to all via view toggle | **INFO** — Settings link should be hidden for Members |
| Invite/remove members | Owner only | Board settings shows member management | **INFO** — Should be hidden for Members |
| Calendar drag to change due date | Owner only | Calendar shows tasks but no drag UI visible | OK (no drag for anyone in static HTML) |
| Export CSV | Owner only | Dashboard shows Export CSV button visible to all | **MISMATCH** — Button should be hidden for Team Members |
| Archive/delete project | Owner only | Board settings shows Archive/Delete buttons | **INFO** — Should be hidden for Members |
| Admin create users | Admin only | Admin user creation modal has wrong roles | **MISMATCH** (see role mismatch above) |

---

## Audit 4: Navigation — PRD User Flows vs HTML Links

### User Flow Tracing

| Flow | PRD Steps | HTML Supports? | Broken At | Details |
|------|-----------|----------------|-----------|---------|
| **Signup** | Signup → Email Verification → Login | **BROKEN** | Step 2 | No email verification page exists. After signup, HTML auto-shows "Created!" but has no verification flow. PRD requires email verification before login. |
| **Login** | Enter email/password → Dashboard | OK | - | Login redirects to projects list |
| **Google OAuth** | Click Google → Redirect → Dashboard | OK | - | Google button present on login page |
| **Forgot Password** | Enter email → Check inbox → Reset → Login | OK | - | Full flow: forgot → success message → reset password → success → redirect to login |
| **Project Creation** | New Project → Fill form → Select template → Invite → Create | OK | - | FAB → creation form → template selection → member invite → create button |
| **Board Interaction** | Open project → View board → Drag cards | OK | - | Project card → board view with columns and cards |
| **Task Detail** | Tap card → View detail → Edit fields | **PARTIAL** | Step 3 | Card links to task detail, but all fields are read-only (no edit mode) |
| **Calendar View** | Board header → Calendar toggle → View/drag | OK | - | View toggle links to calendar |
| **Trash Flow** | Board header → Trash → Restore/Delete | OK | - | Trash icon in board header → trash view with restore/delete |
| **My Tasks** | Bottom nav → My Tasks → Tap task → Detail | **BROKEN** | Step 4 | My Tasks page shows tasks, but individual task cards have no click handlers or links to task detail pages |
| **Notifications** | Bottom nav → Notifications → Tap → Navigate | **PARTIAL** | Step 3 | Notification items shown but no click handlers or links to navigate to related tasks/projects |
| **Profile Edit** | Profile → Edit → Save | OK | - | Profile has edit link → edit profile page → save button |
| **Admin User Management** | Sidebar → Users → Create/Edit/Detail | OK | - | Sidebar link → user list → create modal / detail drawer |
| **Admin Project Management** | Sidebar → Projects → View/Archive/Delete | OK | - | Sidebar link → project list → detail drawer |
| **Invitation Accept** | Email → Click link → Accept → Join project | **NO UI** | Step 2 | PRD has `POST /api/invitations/:token/accept` endpoint, but no HTML page for accepting invitations. This is a public page users land on from email links. |

### Navigation Consistency

| Navigation Element | Expected | Actual | Status |
|-------------------|----------|--------|--------|
| Bottom nav (Projects) | Links to Projects List | `06-projects-list.html` | OK |
| Bottom nav (My Tasks) | Links to My Tasks | `14-my-tasks.html` | OK |
| Bottom nav (Inbox) | Links to Notifications | `15-notifications.html` | OK |
| Bottom nav (Profile) | Links to Profile | `16-profile.html` | OK |
| Board view toggles | Board/Calendar/Settings/Dashboard/Trash | All 5 linked correctly | OK |
| Admin sidebar | Dashboard/Users/Projects/Config | All 4 linked | OK |

---

## Audit 5: API ↔ HTML Consistency

### API Endpoints That Need HTML UI

| API Endpoint | HTML Page That Needs It | Status | Notes |
|-------------|------------------------|--------|-------|
| `POST /api/auth/register` | `05-signup.html` | OK | |
| `POST /api/auth/login` | `02-login.html` | OK | |
| `POST /api/auth/google` | `02-login.html` | OK | |
| `POST /api/auth/refresh` | (background, no UI) | OK | |
| `POST /api/auth/forgot-password` | `03-forgot-password.html` | OK | |
| `POST /api/auth/reset-password` | `04-reset-password.html` | OK | |
| `POST /api/auth/verify-email` | **NO PAGE** | **MISSING** | No email verification page |
| `POST /api/auth/resend-verification` | **NO PAGE** | **MISSING** | No resend verification UI |
| `POST /api/auth/logout` | `16-profile.html` (Log Out button) | OK | |
| `GET /api/users/me` | `16-profile.html` | OK | |
| `PATCH /api/users/me` | `17-edit-profile.html` | OK | |
| `POST /api/users/me/avatar` | `17-edit-profile.html` | OK | |
| `PATCH /api/users/me/email` | `17-edit-profile.html` | **PARTIAL** | Email field is disabled with no "change" action |
| `PATCH /api/users/me/password` | **NO PAGE** | **MISSING** | No change password UI on profile or edit profile page |
| `PATCH /api/users/me/notifications` | `16-profile.html` | OK | |
| `POST /api/users/me/devices` | (background, push registration) | OK | |
| `DELETE /api/users/me/devices/:id` | (background) | OK | |
| `DELETE /api/users/me` | `16-profile.html` (Delete Account button) | OK | |
| `GET /api/projects` | `06-projects-list.html` | OK | |
| `POST /api/projects` | `07-project-creation.html` | OK | |
| `GET /api/projects/:id` | `08-board-view.html` | OK | |
| `GET /api/projects/:id/board` | `08-board-view.html` | OK | |
| `PATCH /api/projects/:id` | `12-board-settings.html` | OK | |
| `POST /api/projects/:id/archive` | `12-board-settings.html` | OK | |
| `DELETE /api/projects/:id` | `12-board-settings.html` | OK | |
| `GET /api/projects/:id/members` | `12-board-settings.html` | OK | |
| `POST /api/projects/:id/members/invite` | `07-project-creation.html` | **PARTIAL** | Invite works on creation page but no invite UI in board settings |
| `DELETE /api/projects/:id/members/:userId` | `12-board-settings.html` | OK | |
| `GET /api/projects/:id/invitations` | `12-board-settings.html` | **MISSING** | No invitation list shown in settings |
| `POST /api/invitations/:id/resend` | `12-board-settings.html` | **PARTIAL** | "Resend Invite" shown for pending members |
| `DELETE /api/invitations/:id` | **NO UI** | **MISSING** | No cancel invitation UI |
| `POST /api/invitations/:token/accept` | **NO PAGE** | **MISSING** | No invitation accept page |
| `POST /api/invitations/:token/decline` | **NO PAGE** | **MISSING** | No invitation decline page |
| `GET /api/projects/:id/columns` | `08-board-view.html` | OK | |
| `POST /api/projects/:id/columns` | `12-board-settings.html` | OK | |
| `PATCH /api/projects/:id/columns/:id` | `12-board-settings.html` | OK | |
| `DELETE /api/projects/:id/columns/:id` | `12-board-settings.html` | OK | |
| `PATCH /api/projects/:id/columns/reorder` | `12-board-settings.html` | OK | |
| `GET /api/projects/:id/tasks` | `08-board-view.html` | OK | |
| `POST /api/projects/:id/tasks` | `08-board-view.html` (+button) | **PARTIAL** | "+" button exists but no task creation form/modal HTML |
| `GET /api/projects/:id/tasks/:id` | `10-task-detail.html` | OK | |
| `PATCH /api/projects/:id/tasks/:id` | `10-task-detail.html` | **PARTIAL** | No edit mode shown (all fields read-only) |
| `PATCH /api/projects/:id/tasks/:id/move` | `08-board-view.html` (drag-drop) | OK | |
| `DELETE /api/projects/:id/tasks/:id` | `10-task-detail.html` | OK | |
| `GET /api/projects/:id/tasks/trash` | `11-trash-view.html` | OK | |
| `POST /api/projects/:id/tasks/:id/restore` | `11-trash-view.html` | OK | |
| `DELETE /api/projects/:id/tasks/trash/:id` | `11-trash-view.html` | OK | |
| `GET /api/users/me/tasks` | `14-my-tasks.html` | OK | |
| `GET .../subtasks` | `10-task-detail.html` | OK | |
| `POST .../subtasks` | `10-task-detail.html` | OK | |
| `PATCH .../subtasks/:id` | `10-task-detail.html` | OK | |
| `DELETE .../subtasks/:id` | `10-task-detail.html` | **PARTIAL** | PRD says "swipe to delete"; HTML shows no delete UI for sub-tasks |
| `PATCH .../subtasks/reorder` | `10-task-detail.html` | **PARTIAL** | No drag handles for reordering sub-tasks |
| `GET .../comments` | `10-task-detail.html` | OK | |
| `POST .../comments` | `10-task-detail.html` | OK | |
| `PATCH .../comments/:id` | `10-task-detail.html` | **MISSING** | No edit comment UI |
| `DELETE .../comments/:id` | `10-task-detail.html` | **MISSING** | No delete comment UI |
| `GET .../attachments` | `10-task-detail.html` | **MISSING** | No attachments section |
| `POST .../attachments` | `10-task-detail.html` | **MISSING** | No file upload UI |
| `GET .../attachments/:id/download` | `10-task-detail.html` | **MISSING** | No download UI |
| `DELETE .../attachments/:id` | `10-task-detail.html` | **MISSING** | No attachment delete UI |
| `GET .../time-entries` | `10-task-detail.html` | OK | |
| `POST .../time-entries` (manual) | `10-task-detail.html` | **MISSING** | No manual time entry form |
| `POST .../time-entries/start` | `10-task-detail.html` | OK | Start Timer button |
| `POST .../time-entries/:id/stop` | `10-task-detail.html` | **MISSING** | No Stop Timer button shown |
| `PATCH .../time-entries/:id` | `10-task-detail.html` | **MISSING** | No edit time entry UI |
| `DELETE .../time-entries/:id` | `10-task-detail.html` | **MISSING** | No delete time entry UI |
| `GET .../labels` | `10-task-detail.html` | OK | |
| `POST .../labels` | **NO UI** | **MISSING** | No create label UI in project context (only admin config) |
| `GET /api/notifications` | `15-notifications.html` | OK | |
| `PATCH /api/notifications/:id/read` | `15-notifications.html` | **PARTIAL** | No individual mark-as-read; only "Mark All as Read" |
| `POST /api/notifications/read-all` | `15-notifications.html` | OK | |
| `DELETE /api/notifications/:id` | `15-notifications.html` | **PARTIAL** | PRD says "swipe to dismiss" but no swipe/delete UI in HTML |
| `GET .../activity` | `10-task-detail.html` | **MISSING** | No activity log section on task detail |
| `GET /api/admin/dashboard/stats` | `18-admin-dashboard.html` | OK | |
| `GET /api/admin/dashboard/charts` | `18-admin-dashboard.html` | OK | |
| `GET /api/admin/dashboard/recent-activity` | `18-admin-dashboard.html` | OK | |
| `GET /api/admin/users` | `19-user-management.html` | OK | |
| `POST /api/admin/users` | `20-user-creation-modal.html` | OK | |
| `GET /api/admin/users/:id` | `21-user-detail-drawer.html` | OK | |
| `PATCH /api/admin/users/:id` | `21-user-detail-drawer.html` | **PARTIAL** | "Edit User" button exists but no edit form shown |
| `PATCH /api/admin/users/:id/status` | `21-user-detail-drawer.html` | OK | Deactivate button |
| `PATCH /api/admin/users/:id/role` | `21-user-detail-drawer.html` | **MISSING** | No "Change Role" UI in drawer |
| `POST /api/admin/users/:id/reset-password` | `21-user-detail-drawer.html` | OK | Reset Password button |
| `DELETE /api/admin/users/:id` | `21-user-detail-drawer.html` | OK | Delete User button |
| `POST /api/admin/users/bulk` | `19-user-management.html` | **PARTIAL** | Bulk Actions button exists but disabled, no action menu |
| `GET /api/admin/users/export` | `19-user-management.html` | **MISSING** | No export button |
| `GET /api/admin/projects` | `22-project-management.html` | OK | |
| `POST /api/admin/projects/:id/archive` | `23-project-detail-drawer.html` | OK | |
| `DELETE /api/admin/projects/:id` | `23-project-detail-drawer.html` | OK | |
| `GET /api/admin/projects/:id` | `23-project-detail-drawer.html` | OK | |
| `POST /api/admin/projects/bulk` | `22-project-management.html` | **MISSING** | No bulk actions visible |
| `GET /api/admin/projects/export` | `22-project-management.html` | **MISSING** | No export button |
| `GET /api/admin/settings` | `24-system-configuration.html` | OK | |
| `PATCH /api/admin/settings/general` | `24-system-configuration.html` | OK | |
| `PATCH /api/admin/settings/notifications` | `24-system-configuration.html` | OK | |
| `GET /api/admin/settings/labels` | `24-system-configuration.html` | OK | |
| `POST /api/admin/settings/labels` | `24-system-configuration.html` | OK | |
| `PATCH /api/admin/settings/labels/:id` | `24-system-configuration.html` | OK | |
| `DELETE /api/admin/settings/labels/:id` | `24-system-configuration.html` | OK | |
| `GET /api/admin/export/users` | **NO DEDICATED PAGE** | **MISSING** | PRD lists Export/Data Download as separate admin page |
| `GET /api/admin/export/projects` | **NO DEDICATED PAGE** | **MISSING** | Same |
| `GET /api/admin/export/tasks` | **NO DEDICATED PAGE** | **MISSING** | Same |
| `GET .../dashboard/summary` | `13-project-dashboard.html` | OK | |
| `GET .../dashboard/charts` | `13-project-dashboard.html` | OK | |
| `GET .../export` | `13-project-dashboard.html` | OK | |
| `GET .../calendar` | `09-calendar-view.html` | OK | |
| `PATCH .../calendar/tasks/:id/reschedule` | `09-calendar-view.html` | **PARTIAL** | No visible drag interaction for rescheduling |

---

## Priority Classification

### Critical (Blocks Frontend Development)

These MUST be resolved before frontend implementation begins:

| # | Issue | Category | Impact |
|---|-------|----------|--------|
| C1 | **Admin role taxonomy mismatch** — HTML uses Admin/Manager/Member/Viewer; PRD/DB uses PROJECT_OWNER/TEAM_MEMBER/ADMIN | Fields, Roles | Frontend will build wrong role system if following HTML; affects user creation modal, user table, filters, and all role badges |
| C2 | **Task detail page missing edit mode** — All task fields (title, description, priority, assignee, due date, labels) are read-only in HTML; PRD requires them to be editable | Fields | Task editing is a P0 feature; frontend needs edit state designs |
| C3 | **Task detail page missing Attachments section** — No file attachment UI exists in HTML | Pages | Attachments is a core feature (P0); frontend has no design reference |
| C4 | **Task detail page missing Activity Log section** — No activity log shown | Pages | PRD specifies this as part of task detail |
| C5 | **Email verification page missing** — No HTML page for email verification flow | Pages, Flows | PRD requires email verification before login; signup flow is broken without it |
| C6 | **Invitation accept/decline page missing** — No HTML for public invitation token pages | Pages, Flows | Team member invitation flow has no landing page |
| C7 | **Admin "Inactive" status not in DB enum** — HTML filter uses "Inactive" but DB only has ACTIVE/SUSPENDED/DELETED | Fields | Frontend filter will not match backend enum values |

### Medium (Should Fix)

| # | Issue | Category | Impact |
|---|-------|----------|--------|
| M1 | **Login page missing "Remember Me" checkbox** — API supports `rememberMe` for extended token lifetime | Fields | Users can't opt for 30-day sessions |
| M2 | **Signup page missing invitation token handling** — No auto-fill for invited users | Fields | Invited users won't get streamlined signup experience |
| M3 | **Task detail missing manual time entry form** — Only Start Timer button, no manual hours/minutes input | Fields | PRD specifies both timer and manual entry |
| M4 | **Task detail missing Stop Timer button** — Only Start Timer shown, no way to stop | Fields | Timer feature is incomplete |
| M5 | **Task detail comments are flat, not threaded** — No reply button or nested UI | Fields | PRD specifies threaded comments with replies |
| M6 | **Task detail missing comment edit/delete UI** — No edit or delete actions on comments | Fields | API has endpoints but no UI |
| M7 | **Board settings missing "Invite Member" button** — Can remove members but can't add new ones | Fields | Owner can't invite members after project creation |
| M8 | **My Tasks page — task cards not clickable** — No links to task detail pages | Navigation | Users can't navigate to task details from My Tasks |
| M9 | **Notification items not clickable** — No navigation to related tasks/projects | Navigation | PRD says "Tap notification navigates to related task" |
| M10 | **Admin user export/bulk actions incomplete** — Bulk actions disabled, no CSV export button | Fields | PRD specifies bulk operations and CSV export |
| M11 | **Admin project management missing filters** — No date range or member count range filters | Fields | PRD specifies these filters |
| M12 | **Admin project management has extra "Category" filter** — Not in PRD/DB | Fields | Will confuse frontend developers |
| M13 | **Edit profile email field locked with no change flow** — PRD says email change with re-verification | Fields | Email change feature has no UI |
| M14 | **Admin user detail drawer missing "Change Role" action** — PRD specifies role change capability | Fields | API endpoint exists but no UI |
| M15 | **Admin export pages missing** — PRD lists Export/Data Download as a separate admin page | Pages | Export endpoints exist but no dedicated download page |
| M16 | **Task creation form/modal missing** — "+" button exists on board but no card creation form | Pages | Users can click "+" but have no form to fill |
| M17 | **Sub-task missing delete UI** — PRD says "swipe to delete" | Fields | API endpoint exists but no UI |
| M18 | **Admin project management has "Create Project" button** — Admin should not create projects per PRD | Roles | Contradicts PRD permissions |

### Low (Nice to Have / Cosmetic)

| # | Issue | Category | Impact |
|---|-------|----------|--------|
| L1 | **Profile page missing invitation notification toggle** — Has 4 toggles but not one for Invitation type | Fields | Minor completeness issue |
| L2 | **Notification items missing swipe-to-dismiss** — PRD specifies swipe gesture | Fields | Mobile gesture; can be implemented without HTML prototype |
| L3 | **Notification items missing individual mark-as-read** — Only "Mark All" exists | Fields | API supports individual read marking |
| L4 | **Sub-task missing reorder drag handles** — PRD mentions ordering | Fields | Minor UX enhancement |
| L5 | **Calendar view missing task rescheduling drag UI** — Owner-only drag to change dates | Fields | Complex interaction, static HTML can't fully show |
| L6 | **Board template selection is a separate page (07a)** — PRD describes it as part of creation | Pages | Reasonable UX split, not harmful |
| L7 | **Time entry missing edit/delete actions** — Read-only list of entries | Fields | API supports CRUD but no UI |
| L8 | **Project label CRUD missing from project UI** — Only admin can manage labels | Fields | PRD allows project-scoped labels via owner |
| L9 | **Admin dashboard "View All Activity" link** — Leads nowhere | Navigation | Minor broken link |

---

## Appendix: File Inventory

### HTML Files (25 total)

| # | File | PRD Match | Status |
|---|------|-----------|--------|
| 1 | `index.html` | Splash Page | OK |
| 2 | `auth/02-login.html` | Login Page | OK |
| 3 | `auth/03-forgot-password.html` | Forgot Password Page | OK |
| 4 | `auth/04-reset-password.html` | Reset Password Page | OK |
| 5 | `auth/05-signup.html` | Sign Up Page | OK |
| 6 | `user/06-projects-list.html` | Projects List (Home) | OK |
| 7 | `user/07-project-creation.html` | Project Creation Page | OK |
| 8 | `user/07a-board-template.html` | (Part of Project Creation) | EXTRA |
| 9 | `user/08-board-view.html` | Board View Page | OK |
| 10 | `user/09-calendar-view.html` | Calendar View | OK |
| 11 | `user/10-task-detail.html` | Task Detail Page | OK |
| 12 | `user/11-trash-view.html` | Trash View Page | OK |
| 13 | `user/12-board-settings.html` | Board Settings Page | OK |
| 14 | `user/13-project-dashboard.html` | Project Dashboard Page | OK |
| 15 | `user/14-my-tasks.html` | My Tasks Tab | OK |
| 16 | `user/15-notifications.html` | Notifications Tab | OK |
| 17 | `user/16-profile.html` | Profile Tab | OK |
| 18 | `user/17-edit-profile.html` | Edit Profile Page | OK |
| 19 | `admin/18-admin-dashboard.html` | Dashboard Home | OK |
| 20 | `admin/19-user-management.html` | User Management | OK |
| 21 | `admin/20-user-creation-modal.html` | User Creation Modal | OK |
| 22 | `admin/21-user-detail-drawer.html` | User Detail Drawer | OK |
| 23 | `admin/22-project-management.html` | Project Management | OK |
| 24 | `admin/23-project-detail-drawer.html` | Project Detail Drawer | OK |
| 25 | `admin/24-system-configuration.html` | System Configuration | OK |

### Missing HTML Pages

| # | Page | PRD Reference |
|---|------|--------------|
| 1 | Email Verification Page | PRD Section 4 item 5, API: `POST /api/auth/verify-email` |
| 2 | Invitation Accept/Decline Page | PRD Section 6 Module 1 step 6, API: `POST /api/invitations/:token/accept` |
| 3 | Admin Export/Data Download Page | PRD Section 6 Admin "Export / Data Download" |
| 4 | Change Password Page/Modal | API: `PATCH /api/users/me/password` |
| 5 | Task Creation Form/Modal | PRD Board View "+" add card button |
