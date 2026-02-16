# Database Schema: html-taskboard

## Overview

- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Migrations**: backend/src/migrations/

## Entity Relationship Diagram

### Application ERD

```text
┌──────────────────────────────────┐
│            users                 │
├──────────────────────────────────┤
│ PK  id                UUID       │
│     email              VARCHAR   │
│     password           VARCHAR   │
│     name               VARCHAR   │
│     role               ENUM      │
│     job_title          VARCHAR   │
│     avatar_url         VARCHAR   │
│     status             ENUM      │
│     email_verified     BOOLEAN   │
│     notification_push  BOOLEAN   │
│     notification_email ENUM      │
│     _digest                      │
│     created_at         TIMESTAMP │
│     updated_at         TIMESTAMP │
└──────────┬───────────────────────┘
           │
           │ 1:N                        ┌──────────────────────────────────┐
           ├───────────────────────────>│         projects                │
           │ (owner_id)                 ├──────────────────────────────────┤
           │                            │ PK  id                UUID       │
           │                            │     title              VARCHAR   │
           │                            │     description        TEXT      │
           │                            │     deadline           DATE      │
           │                            │     status             ENUM      │
           │                            │     template           ENUM      │
           │                            │ FK  owner_id           UUID      │
           │                            │     created_at         TIMESTAMP │
           │                            │     updated_at         TIMESTAMP │
           │                            └──────────┬───────────────────────┘
           │                                       │
           │                                       │ 1:N
           │                                       v
           │                            ┌──────────────────────────────────┐
           │  N:M (project_members)     │       project_members           │
           ├───────────────────────────>│ (junction table)                │
           │                            ├──────────────────────────────────┤
           │                            │ PK/FK project_id       UUID      │
           │                            │ PK/FK user_id          UUID      │
           │                            │     role               ENUM      │
           │                            │     joined_at          TIMESTAMP │
           │                            └──────────────────────────────────┘
           │
           │                            ┌──────────────────────────────────┐
           │                            │          columns                │
           │                            ├──────────────────────────────────┤
           │                            │ PK  id                UUID       │
           │                            │ FK  project_id         UUID      │
           │                            │     name               VARCHAR   │
           │                            │     position           INTEGER   │
           │                            │     wip_limit          INTEGER   │
           │                            │     created_at         TIMESTAMP │
           │                            └──────────┬───────────────────────┘
           │                                       │
           │                                       │ 1:N
           │                                       v
           │                            ┌──────────────────────────────────┐
           │                            │           tasks                 │
           │  1:N (assignee_id,         ├──────────────────────────────────┤
           │   creator_id,              │ PK  id                UUID       │
           │   deleted_by)              │ FK  column_id          UUID      │
           ├───────────────────────────>│ FK  project_id         UUID      │
           │                            │     title              VARCHAR   │
           │                            │     description        TEXT      │
           │                            │     priority           ENUM      │
           │                            │     due_date           DATE      │
           │                            │ FK  assignee_id        UUID      │
           │                            │ FK  creator_id         UUID      │
           │                            │     position           INTEGER   │
           │                            │     is_deleted         BOOLEAN   │
           │                            │     deleted_at         TIMESTAMP │
           │                            │ FK  deleted_by         UUID      │
           │                            │     created_at         TIMESTAMP │
           │                            │     updated_at         TIMESTAMP │
           │                            └──┬───────┬───────┬──────────────┘
           │                               │       │       │
           │      ┌────────────────────────┘       │       └────────────────────┐
           │      │ 1:N                    1:N     │                     1:N    │
           │      v                                v                            v
           │  ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
           │  │     sub_tasks        │  │      comments         │  │    attachments        │
           │  ├───────────────────────┤  ├───────────────────────┤  ├───────────────────────┤
           │  │ PK id         UUID    │  │ PK id         UUID    │  │ PK id         UUID    │
           │  │ FK task_id    UUID    │  │ FK task_id    UUID    │  │ FK task_id    UUID    │
           │  │    title      VARCHAR │  │ FK user_id    UUID    │  │ FK user_id    UUID    │
           │  │    is_completed BOOL  │  │ FK parent_id  UUID    │  │    file_name  VARCHAR │
           │  │    position   INTEGER │  │    content    TEXT    │  │    file_size  INTEGER │
           │  │    created_at TSTAMP  │  │    created_at TSTAMP  │  │    file_type  VARCHAR │
           │  └───────────────────────┘  │    updated_at TSTAMP  │  │    s3_key     VARCHAR │
           │                             └───────────────────────┘  │    created_at TSTAMP  │
           │                                                        └───────────────────────┘
           │
           │      ┌───────────────────────┐  ┌───────────────────────┐
           │      │    time_entries       │  │      labels           │
           │      ├───────────────────────┤  ├───────────────────────┤
           │      │ PK id         UUID    │  │ PK id         UUID    │
           │      │ FK task_id    UUID    │  │    name       VARCHAR │
           │      │ FK user_id    UUID    │  │    color      VARCHAR │
           │      │    duration   INTEGER │  │    created_at TSTAMP  │
           │      │    _minutes           │  └─────────┬─────────────┘
           │      │    description TEXT   │            │
           │      │    started_at TSTAMP  │            │ N:M (task_labels)
           │      │    ended_at   TSTAMP  │            v
           │      │    is_manual  BOOLEAN │  ┌───────────────────────┐
           │      │    created_at TSTAMP  │  │    task_labels        │
           │      └───────────────────────┘  │ (junction table)      │
           │                                 ├───────────────────────┤
           │                                 │ PK/FK task_id  UUID   │
           │                                 │ PK/FK label_id UUID   │
           │                                 └───────────────────────┘
           │
           │      ┌───────────────────────┐  ┌───────────────────────┐
           │ 1:N  │   notifications       │  │   activity_logs       │
           ├─────>├───────────────────────┤  ├───────────────────────┤
                  │ PK id         UUID    │  │ PK id         UUID    │
                  │ FK user_id    UUID    │  │ FK project_id UUID    │
                  │    type       ENUM    │  │ FK task_id    UUID    │
                  │    title      VARCHAR │  │ FK user_id    UUID    │
                  │    message    TEXT    │  │    action     VARCHAR │
                  │    reference_id UUID  │  │    details    JSONB   │
                  │    is_read    BOOLEAN │  │    created_at TSTAMP  │
                  │    created_at TSTAMP  │  └───────────────────────┘
                  └───────────────────────┘
```

### Relationship Summary

```text
users ||--o{ projects           : "owns (owner_id)"
users }o--o{ projects           : "belongs to (via project_members)"
projects ||--o{ columns         : "has"
columns ||--o{ tasks            : "contains"
projects ||--o{ tasks           : "has"
users ||--o{ tasks              : "is assigned to (assignee_id)"
users ||--o{ tasks              : "creates (creator_id)"
tasks ||--o{ sub_tasks          : "has"
tasks ||--o{ comments           : "has"
comments ||--o{ comments        : "replies to (parent_id, self-ref)"
users ||--o{ comments           : "writes"
tasks ||--o{ attachments        : "has"
users ||--o{ attachments        : "uploads"
tasks ||--o{ time_entries       : "has"
users ||--o{ time_entries       : "logs"
tasks }o--o{ labels             : "tagged with (via task_labels)"
users ||--o{ notifications      : "receives"
projects ||--o{ activity_logs   : "tracked in"
users ||--o{ activity_logs      : "performs"
tasks ||--o{ activity_logs      : "related to (optional)"
```

## Entity Relationships

### One-to-Many (1:N)

| Parent | Child | Relationship | FK Column | Constraint |
|--------|-------|--------------|-----------|------------|
| users | projects | User owns projects | projects.owner_id | CASCADE on delete user cascades projects |
| projects | columns | Project has columns | columns.project_id | CASCADE on delete project cascades columns |
| projects | tasks | Project has tasks | tasks.project_id | CASCADE on delete project cascades tasks |
| columns | tasks | Column contains tasks | tasks.column_id | SET NULL on delete column (task reassigned) |
| users | tasks | User is assigned tasks | tasks.assignee_id | SET NULL on delete user |
| users | tasks | User creates tasks | tasks.creator_id | RESTRICT on delete user |
| users | tasks | User soft-deletes tasks | tasks.deleted_by | SET NULL on delete user |
| tasks | sub_tasks | Task has subtasks | sub_tasks.task_id | CASCADE on delete task cascades subtasks |
| tasks | comments | Task has comments | comments.task_id | CASCADE on delete task cascades comments |
| users | comments | User writes comments | comments.user_id | CASCADE on delete user cascades comments |
| comments | comments | Comment has replies (self-ref) | comments.parent_id | CASCADE on delete parent cascades replies |
| tasks | attachments | Task has attachments | attachments.task_id | CASCADE on delete task cascades attachments |
| users | attachments | User uploads attachments | attachments.user_id | SET NULL on delete user |
| tasks | time_entries | Task has time entries | time_entries.task_id | CASCADE on delete task cascades entries |
| users | time_entries | User logs time entries | time_entries.user_id | CASCADE on delete user cascades entries |
| users | notifications | User receives notifications | notifications.user_id | CASCADE on delete user cascades notifications |
| projects | activity_logs | Project has activity logs | activity_logs.project_id | CASCADE on delete project cascades logs |
| tasks | activity_logs | Task has activity logs | activity_logs.task_id | SET NULL on delete task |
| users | activity_logs | User performs actions | activity_logs.user_id | SET NULL on delete user |

### Many-to-Many (N:N)

| Entity 1 | Entity 2 | Junction Table | Composite PK | Description |
|----------|----------|----------------|--------------|-------------|
| users | projects | project_members | (project_id, user_id) | Users belong to multiple projects; projects have multiple members |
| tasks | labels | task_labels | (task_id, label_id) | Tasks can have multiple labels; labels apply to multiple tasks |

## Tables

### users

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | uuid_generate_v4() | Primary key |
| email | VARCHAR(255) | No | - | Unique email address for login |
| password | VARCHAR(255) | No | - | Bcrypt-hashed password |
| name | VARCHAR(100) | No | - | Display name |
| role | ENUM('project_owner', 'team_member', 'admin') | No | 'team_member' | User role in the system |
| job_title | VARCHAR(100) | Yes | NULL | User's job title or position |
| avatar_url | VARCHAR(500) | Yes | NULL | URL to user's avatar image |
| status | ENUM('active', 'suspended') | No | 'active' | Account status |
| email_verified | BOOLEAN | No | false | Whether email has been verified |
| notification_push | BOOLEAN | No | true | Enable/disable push notifications |
| notification_email_digest | ENUM('off', 'daily', 'weekly') | No | 'off' | Email digest notification frequency |
| created_at | TIMESTAMP | No | NOW() | Record creation time |
| updated_at | TIMESTAMP | No | NOW() | Record last update time |

**Constraints:**

- `PK_users` PRIMARY KEY (id)
- `UQ_users_email` UNIQUE (email)

---

### projects

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | uuid_generate_v4() | Primary key |
| title | VARCHAR(255) | No | - | Project title |
| description | TEXT | Yes | NULL | Detailed project description |
| deadline | DATE | Yes | NULL | Project deadline |
| status | ENUM('active', 'completed', 'archived') | No | 'active' | Current project status |
| template | ENUM('default', 'minimal', 'custom') | No | 'default' | Board template used at creation |
| owner_id | UUID | No | - | FK to users.id (project creator/owner) |
| created_at | TIMESTAMP | No | NOW() | Record creation time |
| updated_at | TIMESTAMP | No | NOW() | Record last update time |

**Constraints:**

- `PK_projects` PRIMARY KEY (id)
- `FK_projects_owner` FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE

---

### project_members

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| project_id | UUID | No | - | FK to projects.id |
| user_id | UUID | No | - | FK to users.id |
| role | ENUM('owner', 'member') | No | 'member' | Member's role within the project |
| joined_at | TIMESTAMP | No | NOW() | When the user joined the project |

**Constraints:**

- `PK_project_members` PRIMARY KEY (project_id, user_id)
- `FK_project_members_project` FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
- `FK_project_members_user` FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

---

### columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | uuid_generate_v4() | Primary key |
| project_id | UUID | No | - | FK to projects.id |
| name | VARCHAR(100) | No | - | Column display name (e.g., "To Do", "In Progress") |
| position | INTEGER | No | 0 | Display order (0-based, ascending left to right) |
| wip_limit | INTEGER | Yes | NULL | Work-in-progress limit (NULL = unlimited) |
| created_at | TIMESTAMP | No | NOW() | Record creation time |

**Constraints:**

- `PK_columns` PRIMARY KEY (id)
- `FK_columns_project` FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
- `UQ_columns_project_position` UNIQUE (project_id, position)

---

### tasks

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | uuid_generate_v4() | Primary key |
| column_id | UUID | No | - | FK to columns.id (current board column) |
| project_id | UUID | No | - | FK to projects.id (denormalized for query performance) |
| title | VARCHAR(255) | No | - | Task title |
| description | TEXT | Yes | NULL | Detailed task description (supports markdown) |
| priority | ENUM('low', 'medium', 'high', 'urgent') | No | 'medium' | Task priority level |
| due_date | DATE | Yes | NULL | Task due date |
| assignee_id | UUID | Yes | NULL | FK to users.id (assigned team member) |
| creator_id | UUID | No | - | FK to users.id (task creator) |
| position | INTEGER | No | 0 | Display order within column (ascending top to bottom) |
| is_deleted | BOOLEAN | No | false | Soft delete flag |
| deleted_at | TIMESTAMP | Yes | NULL | When the task was soft-deleted |
| deleted_by | UUID | Yes | NULL | FK to users.id (who deleted the task) |
| created_at | TIMESTAMP | No | NOW() | Record creation time |
| updated_at | TIMESTAMP | No | NOW() | Record last update time |

**Constraints:**

- `PK_tasks` PRIMARY KEY (id)
- `FK_tasks_column` FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE SET NULL
- `FK_tasks_project` FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
- `FK_tasks_assignee` FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
- `FK_tasks_creator` FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE RESTRICT
- `FK_tasks_deleted_by` FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL

---

### sub_tasks

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | uuid_generate_v4() | Primary key |
| task_id | UUID | No | - | FK to tasks.id (parent task) |
| title | VARCHAR(255) | No | - | Subtask / checklist item text |
| is_completed | BOOLEAN | No | false | Whether the subtask is checked off |
| position | INTEGER | No | 0 | Display order within task (ascending) |
| created_at | TIMESTAMP | No | NOW() | Record creation time |

**Constraints:**

- `PK_sub_tasks` PRIMARY KEY (id)
- `FK_sub_tasks_task` FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE

---

### comments

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | uuid_generate_v4() | Primary key |
| task_id | UUID | No | - | FK to tasks.id (commented task) |
| user_id | UUID | No | - | FK to users.id (comment author) |
| parent_id | UUID | Yes | NULL | FK to comments.id (for threaded replies; NULL = top-level) |
| content | TEXT | No | - | Comment body (supports markdown) |
| created_at | TIMESTAMP | No | NOW() | Record creation time |
| updated_at | TIMESTAMP | No | NOW() | Record last update time |

**Constraints:**

- `PK_comments` PRIMARY KEY (id)
- `FK_comments_task` FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
- `FK_comments_user` FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- `FK_comments_parent` FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE

---

### attachments

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | uuid_generate_v4() | Primary key |
| task_id | UUID | No | - | FK to tasks.id (attached to task) |
| user_id | UUID | No | - | FK to users.id (uploader) |
| file_name | VARCHAR(255) | No | - | Original file name |
| file_size | INTEGER | No | - | File size in bytes |
| file_type | VARCHAR(100) | No | - | MIME type (e.g., "image/png", "application/pdf") |
| s3_key | VARCHAR(500) | No | - | S3 object key for file retrieval |
| created_at | TIMESTAMP | No | NOW() | Record creation time |

**Constraints:**

- `PK_attachments` PRIMARY KEY (id)
- `FK_attachments_task` FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
- `FK_attachments_user` FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL

---

### time_entries

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | uuid_generate_v4() | Primary key |
| task_id | UUID | No | - | FK to tasks.id (time logged against) |
| user_id | UUID | No | - | FK to users.id (who logged the time) |
| duration_minutes | INTEGER | No | - | Duration in minutes |
| description | TEXT | Yes | NULL | Optional note about work performed |
| started_at | TIMESTAMP | Yes | NULL | Timer start time (for live timer tracking) |
| ended_at | TIMESTAMP | Yes | NULL | Timer end time (for live timer tracking) |
| is_manual | BOOLEAN | No | false | true = manually entered, false = tracked via timer |
| created_at | TIMESTAMP | No | NOW() | Record creation time |

**Constraints:**

- `PK_time_entries` PRIMARY KEY (id)
- `FK_time_entries_task` FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
- `FK_time_entries_user` FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

---

### labels

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | uuid_generate_v4() | Primary key |
| name | VARCHAR(50) | No | - | Label display name (e.g., "Bug", "Feature") |
| color | VARCHAR(7) | No | - | Hex color code (e.g., "#FF5733") |
| created_at | TIMESTAMP | No | NOW() | Record creation time |

**Constraints:**

- `PK_labels` PRIMARY KEY (id)
- `UQ_labels_name` UNIQUE (name)

---

### task_labels

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| task_id | UUID | No | - | FK to tasks.id |
| label_id | UUID | No | - | FK to labels.id |

**Constraints:**

- `PK_task_labels` PRIMARY KEY (task_id, label_id)
- `FK_task_labels_task` FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
- `FK_task_labels_label` FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE

---

### notifications

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | uuid_generate_v4() | Primary key |
| user_id | UUID | No | - | FK to users.id (notification recipient) |
| type | ENUM('task_assigned', 'due_reminder', 'status_change', 'comment_mention', 'new_comment', 'invitation') | No | - | Notification category |
| title | VARCHAR(255) | No | - | Short notification title |
| message | TEXT | No | - | Full notification message body |
| reference_id | UUID | Yes | NULL | Generic FK to related entity (task, project, comment, etc.) |
| is_read | BOOLEAN | No | false | Whether the user has read/dismissed the notification |
| created_at | TIMESTAMP | No | NOW() | Record creation time |

**Constraints:**

- `PK_notifications` PRIMARY KEY (id)
- `FK_notifications_user` FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

---

### activity_logs

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | uuid_generate_v4() | Primary key |
| project_id | UUID | No | - | FK to projects.id (project scope) |
| task_id | UUID | Yes | NULL | FK to tasks.id (if action relates to a specific task) |
| user_id | UUID | No | - | FK to users.id (who performed the action) |
| action | VARCHAR(100) | No | - | Action identifier (e.g., "task_created", "task_moved", "comment_added") |
| details | JSONB | Yes | NULL | Structured payload with action-specific data |
| created_at | TIMESTAMP | No | NOW() | Record creation time |

**Constraints:**

- `PK_activity_logs` PRIMARY KEY (id)
- `FK_activity_logs_project` FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
- `FK_activity_logs_task` FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
- `FK_activity_logs_user` FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL

**Example `details` JSONB payloads:**

```json
// task_moved
{
  "from_column": "To Do",
  "to_column": "In Progress",
  "from_position": 2,
  "to_position": 0
}

// task_assigned
{
  "assignee_name": "Jane Doe",
  "assignee_id": "uuid-here"
}

// comment_added
{
  "comment_id": "uuid-here",
  "comment_preview": "First 100 chars of comment..."
}
```

## Indexes

| Table | Index Name | Columns | Type | Purpose |
|-------|-----------|---------|------|---------|
| users | UQ_users_email | email | UNIQUE | Fast lookup by email during login |
| users | IDX_users_status | status | BTREE | Filter active/suspended users |
| projects | IDX_projects_owner_id | owner_id | BTREE | List projects by owner |
| projects | IDX_projects_status | status | BTREE | Filter projects by status |
| project_members | IDX_pm_user_id | user_id | BTREE | List projects for a user |
| columns | IDX_columns_project_position | project_id, position | BTREE (UNIQUE) | Ordered columns per project |
| tasks | IDX_tasks_column_position | column_id, position | BTREE | Ordered tasks within a column |
| tasks | IDX_tasks_project_id | project_id | BTREE | List all tasks in a project |
| tasks | IDX_tasks_assignee_id | assignee_id | BTREE | List tasks assigned to a user |
| tasks | IDX_tasks_creator_id | creator_id | BTREE | List tasks created by a user |
| tasks | IDX_tasks_priority | priority | BTREE | Filter tasks by priority |
| tasks | IDX_tasks_due_date | due_date | BTREE | Sort/filter tasks by due date |
| tasks | IDX_tasks_is_deleted | is_deleted | BTREE | Exclude soft-deleted tasks |
| sub_tasks | IDX_sub_tasks_task_id | task_id | BTREE | List subtasks for a task |
| comments | IDX_comments_task_id | task_id | BTREE | List comments on a task |
| comments | IDX_comments_parent_id | parent_id | BTREE | Fetch threaded replies |
| attachments | IDX_attachments_task_id | task_id | BTREE | List attachments on a task |
| time_entries | IDX_time_entries_task_id | task_id | BTREE | Sum time per task |
| time_entries | IDX_time_entries_user_id | user_id | BTREE | List time entries by user |
| task_labels | IDX_task_labels_label_id | label_id | BTREE | Find tasks with a specific label |
| notifications | IDX_notifications_user_read | user_id, is_read | BTREE | Fetch unread notifications for a user |
| notifications | IDX_notifications_created_at | created_at | BTREE | Order notifications chronologically |
| activity_logs | IDX_activity_logs_project | project_id, created_at | BTREE | Activity feed per project (newest first) |
| activity_logs | IDX_activity_logs_task | task_id | BTREE | Activity history for a task |
| activity_logs | IDX_activity_logs_user | user_id | BTREE | Activity history for a user |

## Migrations

```bash
# Generate migration after entity changes
npm run migration:generate -- -n MigrationName

# Run all pending migrations
npm run migration:run

# Revert the last executed migration
npm run migration:revert

# Show all migrations and their status
npm run migration:show
```

### Migration Naming Convention

Use descriptive names that reflect the change:

```text
CreateUsersTable
CreateProjectsTable
CreateColumnsTable
CreateTasksTable
CreateSubTasksTable
CreateCommentsTable
CreateAttachmentsTable
CreateTimeEntriesTable
CreateLabelsTable
CreateTaskLabelsTable
CreateNotificationsTable
CreateActivityLogsTable
CreateProjectMembersTable
AddIndexesToTasks
```

### Migration Order

Migrations must respect foreign key dependencies. Recommended creation order:

1. `CreateUsersTable` -- no dependencies
2. `CreateProjectsTable` -- depends on users
3. `CreateProjectMembersTable` -- depends on users, projects
4. `CreateColumnsTable` -- depends on projects
5. `CreateLabelsTable` -- no dependencies
6. `CreateTasksTable` -- depends on columns, projects, users
7. `CreateSubTasksTable` -- depends on tasks
8. `CreateCommentsTable` -- depends on tasks, users
9. `CreateAttachmentsTable` -- depends on tasks, users
10. `CreateTimeEntriesTable` -- depends on tasks, users
11. `CreateTaskLabelsTable` -- depends on tasks, labels
12. `CreateNotificationsTable` -- depends on users
13. `CreateActivityLogsTable` -- depends on projects, tasks, users
