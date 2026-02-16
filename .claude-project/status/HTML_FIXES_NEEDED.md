# HTML Prototype Fixes Needed

> **Generated**: 2026-02-16
> **Source**: PRD_HTML_AUDIT.md (47 mismatches)
> **Source of Truth**: prd.md (PRD v1.1)

This document lists every HTML prototype change needed to align with the PRD. The PRD is the source of truth. Items marked **REMOVE** should be deleted from HTML. Items marked **ADD** need new HTML content. Items marked **FIX** need modifications to existing HTML.

---

## Priority Legend

| Priority | Meaning |
|----------|---------|
| **P0** | Blocks frontend development - must fix before React conversion |
| **P1** | Should fix - incomplete features that will need implementation |
| **P2** | Nice to have - minor UX completeness |

---

## 1. Missing Pages (CREATE NEW HTML FILES)

### 1.1 Email Verification Page — P0

**File to create**: `auth/05a-email-verification.html`
**PRD Reference**: Section 6 "Sign Up Page" — email verification required before login
**API Endpoints**: `POST /api/auth/verify-email`, `POST /api/auth/resend-verification`

**Required UI elements**:
- Success state: "Email verified! Redirecting to login..."
- Failure state: "Verification link expired or invalid"
- "Resend Verification Email" button
- Loading spinner during verification
- Auto-verify on mount using token from URL query parameter

**User flow**: Sign Up → "Check your email" screen → Click email link → This page → Auto-verify → Redirect to Login

---

### 1.2 Invitation Accept/Decline Page — P0

**File to create**: `user/07b-invitation.html`
**PRD Reference**: Section 7 Module 1 step 6 — team members receive invitation and join project
**API Endpoints**: `POST /api/invitations/:token/accept`, `POST /api/invitations/:token/decline`

**Required UI elements**:
- Project name and inviter name display
- "Accept Invitation" button (primary)
- "Decline Invitation" button (secondary/text)
- Success state: "You've joined [Project Name]!" with link to project board
- Decline state: "Invitation declined" with link to projects list
- Error state: "Invitation expired or invalid"
- If not logged in: redirect to login with return URL

**User flow**: Email link → This page → Accept → Redirect to project board

---

### 1.3 Task Creation Form/Modal — P0

**File to create**: `user/08a-task-creation-modal.html` (or inline in 08-board-view.html)
**PRD Reference**: Section 6 "Board View Page" — "+" add card button creates task
**API Endpoint**: `POST /api/projects/:projectId/tasks`

**Required UI elements**:
- Title input (required)
- Description (rich text editor)
- Priority selector (Low/Medium/High/Urgent)
- Assignee dropdown (project members)
- Due date picker
- Label multi-select (project + system labels)
- Column selector (which column to add card to)
- "Create Task" button
- "Cancel" button

**User flow**: Board View → Click "+" on column → This modal → Fill form → Create → Card appears in column

---

### 1.4 Change Password Section — P1

**Where to add**: `user/16-profile.html` (add section) or `user/17-edit-profile.html`
**PRD Reference**: Section 6 "Profile Tab" — password management
**API Endpoint**: `PATCH /api/users/me/password`

**Required UI elements**:
- Current password input
- New password input (min 8 chars)
- Confirm new password input
- "Change Password" button
- Validation: passwords match, min 8 chars

---

### 1.5 Admin Export/Data Download Page — P1

**File to create**: `admin/25-admin-export.html`
**PRD Reference**: Section 6 Admin "Export / Data Download" — dedicated page
**API Endpoints**: `GET /api/admin/export/users`, `GET /api/admin/export/projects`, `GET /api/admin/export/tasks`

**Required UI elements**:
- Date range picker (from/to)
- Export type cards/buttons:
  - "User Report CSV" → downloads user data
  - "Project Report CSV" → downloads project data
  - "Task Report CSV" → downloads task data
- Download progress indicator
- "Export current filtered results" option

**Note**: Export buttons also exist inline on User Management and Project Management pages. This is the dedicated standalone page the PRD describes.

---

## 2. Task Detail Page Fixes (`user/10-task-detail.html`)

### 2.1 Add Edit Mode for All Fields — P0

**Audit ref**: C2
**Current state**: All fields (title, description, priority, assignee, due date, labels) are read-only display text.
**Required state**: Fields must be editable based on user role.

**Changes needed**:
- **Title**: FIX — Make clickable to edit inline (text input appears on click)
- **Description**: FIX — Add "Edit" button that switches to rich text editor
- **Priority**: FIX — Change from static dot+text to a dropdown selector (Low/Medium/High/Urgent)
- **Assignee**: FIX — Change from static avatar+name to a dropdown of project members
- **Due date**: FIX — Change from static text to a date picker
- **Labels**: FIX — Change from static tags to a multi-select tag picker
- **Status**: Display-only is correct (status changes via drag on board)

**Permission note**: Show edit controls for Owner (all tasks) and Member (own tasks only). Add visual indicator (e.g., pencil icon) on editable fields.

---

### 2.2 Add Attachments Section — P0

**Audit ref**: C3
**Current state**: No attachments section exists.
**API Endpoints**: `GET/POST/DELETE .../attachments`, `GET .../attachments/:id/download`

**Add after Comments section**:
- Section header: "Attachments" with file count badge
- Upload button/drop zone: "Upload File" (accepts PDF, PNG, JPG, DOCX, XLSX, max 10MB)
- File list: filename, file type icon, file size, uploader name, upload date
- Each file: download link, delete button (uploader or Owner only)
- Empty state: "No attachments yet"

---

### 2.3 Add Activity Log Section — P0

**Audit ref**: C4
**Current state**: No activity log section exists.
**API Endpoint**: `GET /api/projects/:projectId/activity?taskId=:taskId`

**Add at bottom of task detail**:
- Section header: "Activity"
- Chronological list of activity entries:
  - User avatar + name
  - Action description (e.g., "moved task from To Do to In Progress")
  - Timestamp (relative, e.g., "2 hours ago")
- Activity types: created, updated, moved, comment added, attachment added, subtask added, etc.
- Pagination or "Load more" for long lists

---

### 2.4 Add Manual Time Entry Form — P1

**Audit ref**: M3
**Current state**: Only "Start Timer" button exists.
**API Endpoint**: `POST .../time-entries` (with `entryType: "manual"`)

**Add to Time Tracking section**:
- "Add Manual Entry" button or link
- Expandable form with:
  - Hours and minutes inputs (number)
  - Description text input
  - Date picker (defaults to today)
  - "Save" and "Cancel" buttons

---

### 2.5 Add Stop Timer Button — P1

**Audit ref**: M4
**Current state**: Only "Start Timer" shown.
**API Endpoint**: `POST .../time-entries/:id/stop`

**Changes needed**:
- When timer is running: replace "Start Timer" with "Stop Timer" button (red/destructive style)
- Show elapsed time counter (HH:MM:SS) while timer is active
- On stop: timer entry appears in the list below

---

### 2.6 Fix Comments to be Threaded — P1

**Audit ref**: M5
**Current state**: Flat comment list (no reply button, no nesting).
**API**: `POST .../comments` with `parentId` field for replies

**Changes needed**:
- Add "Reply" link/button under each comment
- Show replies indented under parent comment
- Reply input appears inline below parent when "Reply" is clicked
- Visual nesting (left border/indentation for replies)
- Support @mention autocomplete in comment input (type @ → dropdown of project members)

---

### 2.7 Add Comment Edit/Delete Actions — P1

**Audit ref**: M6
**API Endpoints**: `PATCH .../comments/:id`, `DELETE .../comments/:id`

**Changes needed**:
- Add "..." overflow menu (or edit/delete icons) on each comment
- "Edit" (author only): switches comment to editable text area
- "Delete" (author or Owner): confirmation prompt, then removes comment

---

### 2.8 Add Sub-task Delete UI — P1

**Audit ref**: M17
**API Endpoint**: `DELETE .../subtasks/:id`

**Changes needed**:
- Add delete icon (trash/X) on each sub-task item (visible on hover or always)
- On mobile: swipe-to-delete gesture
- Confirmation not required (lightweight action)

---

### 2.9 Add Sub-task Reorder Drag Handles — P2

**Audit ref**: L4
**API Endpoint**: `PATCH .../subtasks/reorder`

**Changes needed**:
- Add drag handle icon (⠿ or ≡) to the left of each sub-task
- Enable drag-and-drop reordering of sub-task items

---

### 2.10 Add Time Entry Edit/Delete Actions — P2

**Audit ref**: L7
**API Endpoints**: `PATCH .../time-entries/:id`, `DELETE .../time-entries/:id`

**Changes needed**:
- Add edit/delete icons on each time entry row
- "Edit": inline edit of duration and description
- "Delete": remove entry with confirmation

---

## 3. Auth Page Fixes

### 3.1 Login Page — Add "Remember Me" Checkbox (`auth/02-login.html`) — P1

**Audit ref**: M1
**API field**: `rememberMe: boolean` on `POST /api/auth/login`

**Changes needed**:
- ADD checkbox below password field: "Remember me" (extends session to 30 days)
- Default: unchecked

---

### 3.2 Sign Up Page — Add Invitation Token Handling (`auth/05-signup.html`) — P1

**Audit ref**: M2
**API field**: `invitationToken` on `POST /api/auth/register`

**Changes needed**:
- ADD hidden field: `invitationToken` (populated from URL query parameter `?token=xxx`)
- When token present: auto-fill email field (readonly) from invitation data
- Visual indicator: "You've been invited to join [Project Name]" banner at top of form

---

## 4. Admin Page Fixes

### 4.1 Fix Role Taxonomy Across All Admin Pages — P0

**Audit ref**: C1
**Affected files**: `admin/19-user-management.html`, `admin/20-user-creation-modal.html`, `admin/21-user-detail-drawer.html`

**Current (WRONG)**: Admin / Manager / Member / Viewer
**Correct (PRD/DB)**: Project Owner / Team Member / Admin

**Changes needed in each file**:

**19-user-management.html**:
- FIX Role filter dropdown options: "All Roles" / "Project Owner" / "Team Member" / "Admin"
- FIX Table role badges: use "Project Owner" / "Team Member" / "Admin" labels
- FIX Badge colors to match 3 roles only

**20-user-creation-modal.html**:
- FIX Role dropdown options: "Project Owner" / "Team Member" (Admin cannot create other admins via this modal per PRD — "role selection (Project Owner/Team Member)")
- REMOVE: "Admin" and "Viewer" role options
- REMOVE: "Manager" role option

**21-user-detail-drawer.html**:
- FIX Role badge: use correct role names
- ADD "Change Role" dropdown/button (PRD specifies admin can change user role)
  - API Endpoint: `PATCH /api/admin/users/:id/role`
  - Options: "Project Owner" / "Team Member"

---

### 4.2 Fix Admin User Status Filter (`admin/19-user-management.html`) — P0

**Audit ref**: C7
**Current (WRONG)**: Active / Inactive / Suspended
**Correct (DB enum)**: Active / Suspended

**Changes needed**:
- FIX Status filter dropdown: "All Status" / "Active" / "Suspended"
- REMOVE: "Inactive" option (not a valid status in the database)

---

### 4.3 Add Date Range Filter to User Management (`admin/19-user-management.html`) — P1

**Audit ref**: M10 (part)
**PRD Reference**: "filters (role, status, date range)"

**Changes needed**:
- ADD date range picker (registration date from/to) next to existing filters

---

### 4.4 Add Export CSV Button to User Management (`admin/19-user-management.html`) — P1

**Audit ref**: M10 (part)
**API Endpoint**: `GET /api/admin/users/export`, `GET /api/admin/export/users`

**Changes needed**:
- ADD "Export CSV" button in the bulk actions area or as a standalone toolbar button
- Downloads CSV of current filtered results

---

### 4.5 Enable Bulk Actions on User Management (`admin/19-user-management.html`) — P1

**Audit ref**: M10 (part)
**API Endpoint**: `POST /api/admin/users/bulk`

**Changes needed**:
- FIX "Bulk Actions" button to be enabled when checkboxes are selected
- ADD dropdown menu with actions: "Activate Selected", "Suspend Selected", "Delete Selected", "Export Selected as CSV"

---

### 4.6 Fix Admin Project Management (`admin/22-project-management.html`) — P1

**Audit ref**: M11, M12, M18

**Changes needed**:
- REMOVE: "Category" filter (Development / Marketing / Design) — not in PRD or DB
- ADD: Date range filter (created date from/to)
- ADD: Member count range filter (min/max members)
- ADD: Bulk actions dropdown (Archive / Delete / Export CSV)
  - API: `POST /api/admin/projects/bulk`, `GET /api/admin/projects/export`
- REMOVE: "Create Project" button — Admin cannot create projects per PRD (only Project Owner)

---

### 4.7 Add Edit User Form in Detail Drawer (`admin/21-user-detail-drawer.html`) — P1

**Audit ref**: from Audit 5 (PATCH /api/admin/users/:id partial)
**API Endpoint**: `PATCH /api/admin/users/:id`

**Changes needed**:
- ADD edit form (toggled by "Edit User" button): editable fields for `fullName`, `email`, `role`
- "Save" and "Cancel" buttons

---

## 5. Board Settings Fix (`user/12-board-settings.html`)

### 5.1 Add "Invite Member" Button — P1

**Audit ref**: M7
**API Endpoint**: `POST /api/projects/:projectId/members/invite`

**Changes needed**:
- ADD "Invite Member" section in the Members area:
  - Email input field
  - "Send Invite" button
- ADD pending invitations list (from `GET .../invitations`):
  - Email, status (pending), sent date
  - "Resend" button
  - "Cancel" button (X icon)

---

## 6. Navigation Fixes

### 6.1 Make My Tasks Cards Clickable (`user/14-my-tasks.html`) — P1

**Audit ref**: M8

**Changes needed**:
- ADD click handler / link on each task card → navigates to `/projects/:projectId/tasks/:taskId`
- Task cards need `projectId` and `taskId` data attributes for routing

---

### 6.2 Make Notification Items Clickable (`user/15-notifications.html`) — P1

**Audit ref**: M9
**API**: `PATCH /api/notifications/:id/read` (mark as read on click)

**Changes needed**:
- ADD click handler on each notification item → navigates to related task/project
- Navigation targets by notification type:
  - `TASK_ASSIGNED` → Task Detail page
  - `DUE_DATE_REMINDER` → Task Detail page
  - `STATUS_CHANGE` → Task Detail page / Board View
  - `COMMENT_MENTION` → Task Detail page (comments section)
  - `NEW_COMMENT` → Task Detail page (comments section)
  - `INVITATION` → Invitation Accept page
- Mark notification as read on click

---

### 6.3 Add Individual Mark-as-Read on Notifications — P2

**Audit ref**: L3
**API**: `PATCH /api/notifications/:id/read`

**Changes needed**:
- ADD per-notification "Mark as read" action (dot icon or swipe gesture)
- Currently only "Mark All as Read" exists

---

### 6.4 Add Swipe-to-Dismiss on Notifications — P2

**Audit ref**: L2
**API**: `DELETE /api/notifications/:id`

**Changes needed**:
- ADD swipe-left gesture to dismiss/delete individual notifications (mobile pattern)
- Or add a delete/dismiss icon on each item

---

## 7. Profile Page Fixes

### 7.1 Add Invitation Notification Toggle (`user/16-profile.html`) — P2

**Audit ref**: L1

**Changes needed**:
- ADD fifth notification toggle: "Invitations" (for `notifyInvitation` preference)
- Current toggles: Assignments, Deadlines, Comments, Status Changes
- Missing: Invitations

---

### 7.2 Enable Email Change Flow (`user/17-edit-profile.html`) — P1

**Audit ref**: M13
**API Endpoint**: `PATCH /api/users/me/email`

**Changes needed**:
- FIX email field: make it editable (remove disabled state)
- ADD "Change Email" button that triggers re-verification flow
- ADD info text: "Changing your email requires re-verification. A verification link will be sent to your new email."
- After submit: show confirmation message and instructions

---

## 8. Board View Fixes (`user/08-board-view.html`)

### 8.1 Hide "Move to Trash" for Team Members — P1

**Audit ref**: from Audit 3 permissions
**PRD Rule**: Only Owner can soft-delete tasks

**Changes needed in `user/10-task-detail.html`**:
- HIDE "Move to Trash" button when user role is MEMBER (not owner)
- Show only for project OWNER

---

### 8.2 Hide "Export CSV" for Team Members (`user/13-project-dashboard.html`) — P1

**Audit ref**: from Audit 3 permissions
**PRD Rule**: Only Owner can export CSV

**Changes needed**:
- HIDE "Export CSV" button when user role is MEMBER

---

### 8.3 Hide Settings Link for Team Members — P1

**Audit ref**: from Audit 3 permissions
**PRD Rule**: Only Owner can manage columns, members, project settings

**Changes needed in `user/08-board-view.html`**:
- HIDE settings gear icon in board header when user role is MEMBER

---

## 9. Calendar View Fix (`user/09-calendar-view.html`)

### 9.1 Add Task Drag-to-Reschedule Visual Indicator — P2

**Audit ref**: L5
**API Endpoint**: `PATCH .../calendar/tasks/:taskId/reschedule`

**Changes needed**:
- ADD visual drag handles on task items in calendar (Owner only)
- ADD drag-and-drop zones on calendar dates
- Static HTML can show the visual pattern (drag handle icon, cursor:grab)

---

## 10. Project Label Management

### 10.1 Add Label CRUD in Project Context — P2

**Audit ref**: L8
**API Endpoints**: `POST/PATCH/DELETE /api/projects/:projectId/labels`

**Where to add**: `user/12-board-settings.html` (new section) or `user/10-task-detail.html` (label picker with create option)

**Changes needed**:
- ADD ability for project Owner to create/edit/delete project-scoped labels
- Options: (a) New "Labels" section in Board Settings, or (b) "Create New Label" option inside the label picker on task detail

---

## Summary

| Priority | Count | Description |
|----------|-------|-------------|
| **P0** | 8 | Missing pages (3), task detail edit mode, attachments section, activity log, role taxonomy fix, status filter fix |
| **P1** | 18 | Navigation fixes, comment threading, time tracking completion, admin filters/export, invite in settings, email change, permission-based visibility |
| **P2** | 7 | Notification toggles, swipe gestures, drag handles, label management, calendar drag |
| **Total** | **33** | Actionable HTML fix items |

---

*Generated from PRD_HTML_AUDIT.md audit report*
