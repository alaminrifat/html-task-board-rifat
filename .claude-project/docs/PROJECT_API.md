# API Reference: html-taskboard

> **Base URL**: `http://localhost:3000/api`
> **Auth**: JWT via httpOnly cookies (browser) or `Authorization: Bearer <token>` (mobile/API)
> **Content-Type**: `application/json` (unless file upload)

## Resource Overview

| # | Resource | Endpoints | Methods | Section |
|---|----------|-----------|---------|---------|
| 1 | Authentication | 12 | GET, POST | [1](#1-authentication) |
| 2 | Users (Profile) | 8 | GET, PATCH, POST, DELETE | [2](#2-users-profile) |
| 3 | Admin — User Management | 10 | GET, POST, PATCH, DELETE | [3](#3-admin--user-management) |
| 4 | Projects | 7 | GET, POST, PATCH, DELETE | [4](#4-projects) |
| 5 | Project Members & Invitations | 8 | GET, POST, DELETE | [5](#5-project-members) |
| 6 | Columns | 5 | GET, POST, PATCH, DELETE | [6](#6-columns) |
| 7 | Tasks | 10 | GET, POST, PATCH, DELETE | [7](#7-tasks) |
| 8 | Sub-Tasks | 5 | GET, POST, PATCH, DELETE | [8](#8-sub-tasks) |
| 9 | Comments | 4 | GET, POST, PATCH, DELETE | [9](#9-comments) |
| 10 | Attachments | 4 | GET, POST, DELETE | [10](#10-attachments) |
| 11 | Time Entries | 6 | GET, POST, PATCH, DELETE | [11](#11-time-entries) |
| 12 | Labels | 4 | GET, POST, PATCH, DELETE | [12](#12-labels) |
| 13 | Notifications | 4 | GET, PATCH, POST, DELETE | [13](#13-notifications) |
| 14 | Activity Logs | 1 | GET | [14](#14-activity-logs) |
| 15 | Admin — Dashboard | 3 | GET | [15](#15-admin--dashboard) |
| 16 | Admin — User Mgmt (ref) | — | *(see section 3)* | [16](#16-admin--user-management) |
| 17 | Admin — Project Management | 6 | GET, POST, DELETE | [17](#17-admin--project-management) |
| 18 | Admin — System Configuration | 7 | GET, PATCH, POST, DELETE | [18](#18-admin--system-configuration) |
| 19 | Admin — Export | 3 | GET | [19](#19-admin--export) |
| 20 | Project Dashboard & Calendar | 5 | GET, PATCH | [20](#20-project-dashboard--calendar) |
| 21 | WebSocket Events | 6+10 | WS | [21](#21-websocket-events) |
| | **Total** | **112 REST + 16 WS** | | |

---

## Authentication Flow

### Browser Clients (React Web / Admin Dashboard)

1. Client calls `POST /api/auth/login` or `POST /api/auth/social-login`
2. Backend sets `accessToken` and `refreshToken` as httpOnly cookies via `Set-Cookie` header
3. All subsequent requests automatically include cookies — no manual token handling
4. Frontend uses `withCredentials: true` in axios/fetch

**Cookie Configuration:**

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `HttpOnly` | `true` | Prevents JavaScript access (XSS protection) |
| `Secure` | `true` | HTTPS only (production) |
| `SameSite` | `Strict` | CSRF protection (production) |
| `Path` | `/` | Available on all routes |

**Token Lifetimes:**

| Token | Default | With `rememberMe` |
|-------|---------|-------------------|
| `accessToken` | 24 hours | 30 days |
| `refreshToken` | 7 days | 30 days |

### Mobile / API Clients (React Native)

```
Authorization: Bearer <accessToken>
```

Refresh tokens are sent/received in the request/response body instead of cookies.

---

## Common Conventions

### Pagination

All list endpoints accept:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-based) |
| `limit` | integer | 20 | Items per page (max 100) |

Response wrapper:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 142,
    "totalPages": 8
  }
}
```

### Sorting

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `sortBy` | string | `created_at` | Column name to sort by |
| `sortOrder` | `asc` \| `desc` | `desc` | Sort direction |

### Error Response Shape

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "email must be a valid email address" }
  ]
}
```

### Common Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request — validation failed |
| 401 | Unauthorized — missing or invalid token |
| 403 | Forbidden — insufficient permissions |
| 404 | Not Found — resource does not exist |
| 409 | Conflict — duplicate resource |
| 413 | Payload Too Large — file exceeds size limit |
| 422 | Unprocessable Entity — business rule violation |
| 429 | Too Many Requests — rate limit exceeded |
| 500 | Internal Server Error |

---

## Table of Contents

- [1. Authentication](#1-authentication)
  - [POST /api/users](#post-apiusers)
  - [POST /api/auth/login](#post-apiauthlogin)
  - [POST /api/auth/social-login](#post-apiauthsocial-login)
  - [GET /api/auth/refresh-access-token](#get-apiauthrefresh-access-token)
  - [POST /api/auth/forgot-password](#post-apiauthforgot-password)
  - [POST /api/auth/reset-password](#post-apiauthreset-password)
  - [GET /api/auth/logout](#get-apiauthlogout)
  - [POST /api/auth/admin-login](#post-apiauthadmin-login)
  - [POST /api/auth/change-password](#post-apiauthchange-password)
  - [POST /api/auth/change-user-password](#post-apiauthchange-user-password)
  - [GET /api/auth/check-login](#get-apiauthcheck-login)
  - [POST /api/auth/register-fcm-token](#post-apiauthregister-fcm-token)
- [2. Users (Profile)](#2-users-profile)
  - [GET /api/users/me](#get-apiusersme)
  - [PATCH /api/users/me](#patch-apiusersme)
  - [POST /api/users/me/avatar](#post-apiusersmeavatar)
  - [PATCH /api/users/me/password](#patch-apiusersmepassword)
  - [PATCH /api/users/me/notifications](#patch-apiusersmenotifications)
  - [POST /api/users/me/devices](#post-apiusersmedevices)
  - [DELETE /api/users/me/devices/:deviceId](#delete-apiusersmedevicesdeviceid)
  - [DELETE /api/users/me](#delete-apiusersme)
- [3. Admin — User Management](#3-admin--user-management)
  - [GET /api/admin/users](#get-apiadminusers)
  - [POST /api/admin/users](#post-apiadminusers)
  - [GET /api/admin/users/:id](#get-apiadminusersid)
  - [PATCH /api/admin/users/:id](#patch-apiadminusersid)
  - [PATCH /api/admin/users/:id/status](#patch-apiadminusersidstatus)
  - [PATCH /api/admin/users/:id/role](#patch-apiadminusersidrole)
  - [POST /api/admin/users/:id/reset-password](#post-apiadminusersidreset-password)
  - [DELETE /api/admin/users/:id](#delete-apiadminusersid)
  - [POST /api/admin/users/bulk](#post-apiadminusersbulk)
  - [GET /api/admin/users/export](#get-apiadminusersexport)
- [4. Projects](#4-projects)
  - [GET /api/projects](#get-apiprojects)
  - [POST /api/projects](#post-apiprojects)
  - [GET /api/projects/:projectId](#get-apiprojectsprojectid)
  - [GET /api/projects/:projectId/board](#get-apiprojectsprojectidboard)
  - [PATCH /api/projects/:projectId](#patch-apiprojectsprojectid)
  - [POST /api/projects/:projectId/archive](#post-apiprojectsprojectidarchive)
  - [DELETE /api/projects/:projectId](#delete-apiprojectsprojectid)
- [5. Project Members](#5-project-members)
  - [GET /api/projects/:projectId/members](#get-apiprojectsprojectidmembers)
  - [POST /api/projects/:projectId/members/invite](#post-apiprojectsprojectidmembersinvite)
  - [DELETE /api/projects/:projectId/members/:userId](#delete-apiprojectsprojectidmembersuserid)
  - [GET /api/projects/:projectId/invitations](#get-apiprojectsprojectidinvitations)
  - [POST /api/projects/:projectId/invitations/:invitationId/resend](#post-apiprojectsprojectidinvitationsinvitationidresend)
  - [DELETE /api/projects/:projectId/invitations/:invitationId](#delete-apiprojectsprojectidinvitationsinvitationid)
  - [POST /api/invitations/:token/accept](#post-apiinvitationstokenaccept)
  - [POST /api/invitations/:token/decline](#post-apiinvitationstokendecline)
- [6. Columns](#6-columns)
  - [GET /api/projects/:projectId/columns](#get-apiprojectsprojectidcolumns)
  - [POST /api/projects/:projectId/columns](#post-apiprojectsprojectidcolumns)
  - [PATCH /api/projects/:projectId/columns/:columnId](#patch-apiprojectsprojectidcolumnscolumnid)
  - [DELETE /api/projects/:projectId/columns/:columnId](#delete-apiprojectsprojectidcolumnscolumnid)
  - [PATCH /api/projects/:projectId/columns/reorder](#patch-apiprojectsprojectidcolumnsreorder)
- [7. Tasks](#7-tasks)
  - [GET /api/projects/:projectId/tasks](#get-apiprojectsprojectidtasks)
  - [POST /api/projects/:projectId/tasks](#post-apiprojectsprojectidtasks)
  - [GET /api/projects/:projectId/tasks/:taskId](#get-apiprojectsprojectidtaskstaskid)
  - [PATCH /api/projects/:projectId/tasks/:taskId](#patch-apiprojectsprojectidtaskstaskid)
  - [PATCH /api/projects/:projectId/tasks/:taskId/move](#patch-apiprojectsprojectidtaskstaskidmove)
  - [DELETE /api/projects/:projectId/tasks/:taskId](#delete-apiprojectsprojectidtaskstaskid)
  - [GET /api/projects/:projectId/tasks/trash](#get-apiprojectsprojectidtaskstrash)
  - [POST /api/projects/:projectId/tasks/:taskId/restore](#post-apiprojectsprojectidtaskstaskidrestore)
  - [DELETE /api/projects/:projectId/tasks/trash/:taskId](#delete-apiprojectsprojectidtaskstrashtaskid)
  - [GET /api/users/me/tasks](#get-apiusersmetasks)
- [8. Sub-Tasks](#8-sub-tasks)
  - [GET /api/projects/:projectId/tasks/:taskId/subtasks](#get-apiprojectsprojectidtaskstaskidsubtasks)
  - [POST /api/projects/:projectId/tasks/:taskId/subtasks](#post-apiprojectsprojectidtaskstaskidsubtasks)
  - [PATCH /api/projects/:projectId/tasks/:taskId/subtasks/:subTaskId](#patch-apiprojectsprojectidtaskstaskidsubtaskssubtaskid)
  - [DELETE /api/projects/:projectId/tasks/:taskId/subtasks/:subTaskId](#delete-apiprojectsprojectidtaskstaskidsubtaskssubtaskid)
  - [PATCH /api/projects/:projectId/tasks/:taskId/subtasks/reorder](#patch-apiprojectsprojectidtaskstaskidsubtasksreorder)
- [9. Comments](#9-comments)
  - [GET /api/projects/:projectId/tasks/:taskId/comments](#get-apiprojectsprojectidtaskstaskidcomments)
  - [POST /api/projects/:projectId/tasks/:taskId/comments](#post-apiprojectsprojectidtaskstaskidcomments)
  - [PATCH /api/projects/:projectId/tasks/:taskId/comments/:commentId](#patch-apiprojectsprojectidtaskstaskidcommentscommentid)
  - [DELETE /api/projects/:projectId/tasks/:taskId/comments/:commentId](#delete-apiprojectsprojectidtaskstaskidcommentscommentid)
- [10. Attachments](#10-attachments)
  - [GET /api/projects/:projectId/tasks/:taskId/attachments](#get-apiprojectsprojectidtaskstaskidattachments)
  - [POST /api/projects/:projectId/tasks/:taskId/attachments](#post-apiprojectsprojectidtaskstaskidattachments)
  - [GET /api/projects/:projectId/attachments/:attachmentId/download](#get-apiprojectsprojectidattachmentsattachmentiddownload)
  - [DELETE /api/projects/:projectId/attachments/:attachmentId](#delete-apiprojectsprojectidattachmentsattachmentid)
- [11. Time Entries](#11-time-entries)
  - [GET /api/projects/:projectId/tasks/:taskId/time-entries](#get-apiprojectsprojectidtaskstaskidtime-entries)
  - [POST /api/projects/:projectId/tasks/:taskId/time-entries](#post-apiprojectsprojectidtaskstaskidtime-entries)
  - [POST /api/projects/:projectId/tasks/:taskId/time-entries/start](#post-apiprojectsprojectidtaskstaskidtime-entriesstart)
  - [POST /api/time-entries/:timeEntryId/stop](#post-apitime-entriestimeentryidstop)
  - [PATCH /api/time-entries/:timeEntryId](#patch-apitime-entriestimeentryid)
  - [DELETE /api/time-entries/:timeEntryId](#delete-apitime-entriestimeentryid)
- [12. Labels](#12-labels)
  - [GET /api/projects/:projectId/labels](#get-apiprojectsprojectidlabels)
  - [POST /api/projects/:projectId/labels](#post-apiprojectsprojectidlabels)
  - [PATCH /api/projects/:projectId/labels/:labelId](#patch-apiprojectsprojectidlabelslabelid)
  - [DELETE /api/projects/:projectId/labels/:labelId](#delete-apiprojectsprojectidlabelslabelid)
- [13. Notifications](#13-notifications)
  - [GET /api/notifications](#get-apinotifications)
  - [PATCH /api/notifications/:notificationId/read](#patch-apinotificationsnotificationidread)
  - [POST /api/notifications/read-all](#post-apinotificationsread-all)
  - [DELETE /api/notifications/:notificationId](#delete-apinotificationsnotificationid)
- [14. Activity Logs](#14-activity-logs)
  - [GET /api/projects/:projectId/activity](#get-apiprojectsprojectidactivity)
- [15. Admin — Dashboard](#15-admin--dashboard)
  - [GET /api/admin/dashboard/stats](#get-apiadmindashboardstats)
  - [GET /api/admin/dashboard/charts](#get-apiadmindashboardcharts)
  - [GET /api/admin/dashboard/recent-activity](#get-apiadmindashboardrecent-activity)
- [16. Admin — User Management (Reference)](#16-admin--user-management)
- [17. Admin — Project Management](#17-admin--project-management)
  - [GET /api/admin/projects](#get-apiadminprojects)
  - [POST /api/admin/projects/:projectId/archive](#post-apiadminprojectsprojectidarchive)
  - [DELETE /api/admin/projects/:projectId](#delete-apiadminprojectsprojectid)
  - [GET /api/admin/projects/:projectId](#get-apiadminprojectsprojectid)
  - [POST /api/admin/projects/bulk](#post-apiadminprojectsbulk)
  - [GET /api/admin/projects/export](#get-apiadminprojectsexport)
- [18. Admin — System Configuration](#18-admin--system-configuration)
  - [GET /api/admin/settings](#get-apiadminsettings)
  - [PATCH /api/admin/settings/general](#patch-apiadminsettingsgeneral)
  - [PATCH /api/admin/settings/notifications](#patch-apiadminsettingsnotifications)
  - [GET /api/admin/settings/labels](#get-apiadminsettingslabels)
  - [POST /api/admin/settings/labels](#post-apiadminsettingslabels)
  - [PATCH /api/admin/settings/labels/:labelId](#patch-apiadminsettingslabelslabelid)
  - [DELETE /api/admin/settings/labels/:labelId](#delete-apiadminsettingslabelslabelid)
- [19. Admin — Export](#19-admin--export)
  - [GET /api/admin/export/users](#get-apiadminexportusers)
  - [GET /api/admin/export/projects](#get-apiadminexportprojects)
  - [GET /api/admin/export/tasks](#get-apiadminexporttasks)
- [20. Project Dashboard & Calendar](#20-project-dashboard--calendar)
  - [GET /api/projects/:projectId/dashboard/summary](#get-apiprojectsprojectiddashboardsummary)
  - [GET /api/projects/:projectId/dashboard/charts](#get-apiprojectsprojectiddashboardcharts)
  - [GET /api/projects/:projectId/export](#get-apiprojectsprojectidexport)
  - [GET /api/projects/:projectId/calendar](#get-apiprojectsprojectidcalendar)
  - [PATCH /api/projects/:projectId/calendar/tasks/:taskId/reschedule](#patch-apiprojectsprojectidcalendartaskstaskidreschedule)
- [21. WebSocket Events](#21-websocket-events)

---

## 1. Authentication

### POST /api/users

**Description**: Create a new user account. This is the registration endpoint.

**Auth**: Public, Rate limited (`@Throttle`: 3 requests per 60 seconds)

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | Yes | `@IsEmail()` — valid email format |
| `password` | string | Yes | `@IsString()`, `@MinLength(8)` |
| `firstName` | string | No | `@IsString()` |
| `lastName` | string | No | `@IsString()` |
| `role` | string | No | `@IsEnum(UserRole)` — one of `ADMIN`, `TEAM_MEMBER`, etc. Default `TEAM_MEMBER` |

```json
{
  "email": "jane@example.com",
  "password": "secureP@ss1",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "TEAM_MEMBER"
}
```

**Success Response** `201 Created`:

```json
{
  "id": "uuid",
  "email": "jane@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "TEAM_MEMBER",
  "createdAt": "2026-02-16T00:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `email must be an email` | Invalid email format |
| 400 | `password must be longer than or equal to 8 characters` | Password too short |
| 400 | `role must be a valid enum value` | Invalid role value |
| 409 | `User with this email already exists` | Email already registered |
| 429 | `Too many requests` | Rate limit exceeded (3 per minute) |

**Business Rules**:
- Password is hashed before storage
- Default role is `TEAM_MEMBER` if not specified
- The endpoint is public and rate-limited to prevent abuse (3 requests per 60-second window)
- No tokens/cookies are set on registration — user must log in separately after account creation

---

### POST /api/auth/login

**Description**: Authenticate with email and password. Issues JWT access and refresh tokens.

**Auth**: Public

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | Yes | Valid email format |
| `password` | string | Yes | Non-empty |
| `rememberMe` | boolean | No | Default `false`. Extends token lifetimes to 30 days |

```json
{
  "email": "jane@example.com",
  "password": "secureP@ss1",
  "rememberMe": true
}
```

**Success Response** `200 OK`:

Response body (tokens are in `Set-Cookie` headers for browser clients):

```json
{
  "user": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "team_member",
    "avatarUrl": null
  }
}
```

Response headers (browser flow):

```
Set-Cookie: accessToken=eyJ...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400
Set-Cookie: refreshToken=eyJ...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `email is required` | Missing email |
| 400 | `password is required` | Missing password |
| 401 | `Invalid email or password` | Email not found or password mismatch |
| 403 | `Account is suspended` | User `status` is `SUSPENDED` |
| 403 | `Email not verified. Check your inbox.` | `email_verified` is `false` |
| 429 | `Too many login attempts. Try again in {n} minutes.` | Rate limit exceeded (5 attempts per 15 minutes per email) |

**Business Rules**:
- Tokens are NOT returned in the response body — only via `Set-Cookie` headers (browser) or optionally in body for mobile clients
- `accessToken` lifetime: 24 hours (default) or 30 days (`rememberMe: true`)
- `refreshToken` lifetime: 7 days (default) or 30 days (`rememberMe: true`)
- A new `refresh_tokens` record is created in the database with the hashed token and `user_agent`
- `users.last_active_at` is updated on successful login
- Suspended users (`status = SUSPENDED`) receive 403 regardless of correct credentials
- Users with `email_verified = false` receive 403 with instructions to check inbox
- Login attempts are rate-limited: 5 failed attempts per email per 15-minute window

---

### POST /api/auth/social-login

**Description**: Authenticate or register via a social provider (e.g. Google). Creates a new account if the email does not exist. Supports multiple social login providers.

**Auth**: Public, Rate limited (`@Throttle`)

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `token` | string | Yes | `@IsString()` — the social provider's authentication token |
| `fullName` | string | Yes | `@IsString()` — user's full name from the social provider |
| `email` | string | Yes | `@IsEmail()` — user's email from the social provider |
| `socialLoginType` | string | Yes | `@IsEnum(SocialLoginType)` — e.g. `GOOGLE` |
| `rememberMe` | boolean | No | `@IsBoolean()` — extends token lifetimes |
| `termsAndConditionsAccepted` | boolean | No | `@IsBoolean()` — whether user accepted T&C |

```json
{
  "token": "eyJhbGciOiJSUzI1NiIs...",
  "fullName": "Jane Doe",
  "email": "jane@gmail.com",
  "socialLoginType": "GOOGLE",
  "rememberMe": true,
  "termsAndConditionsAccepted": true
}
```

**Success Response** `200 OK`:

Response body returns `LoginResponsePayloadDto`. Tokens are set via `Set-Cookie` headers using the `SetToken` interceptor.

```json
{
  "user": {
    "id": "uuid",
    "email": "jane@gmail.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "TEAM_MEMBER"
  }
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `token must be a string` | Missing or invalid token |
| 400 | `email must be an email` | Invalid email format |
| 400 | `socialLoginType must be a valid enum value` | Invalid provider type |
| 401 | `Invalid social login token` | Token verification failed with the social provider |
| 403 | `Account is suspended` | Existing user `status` is `SUSPENDED` |
| 429 | `Too many requests` | Rate limit exceeded |

**Business Rules**:
- Backend verifies the `token` with the corresponding social provider's API based on `socialLoginType`
- If no account exists with the provided email, a new user is created with the social provider's profile data
- If an account already exists with the same email, the social provider is linked and the user is logged in
- The `SetToken` interceptor sets JWT tokens in HTTP-only cookies on the response
- Supports extensible social login providers via the `SocialLoginType` enum (e.g. `GOOGLE`)
- `rememberMe` extends token lifetimes when set to `true`

---

### GET /api/auth/refresh-access-token

**Description**: Refresh an expired access token using a valid refresh token passed as a query parameter.

**Auth**: Public

**Query Parameters**:

| Parameter | Type | Required | Validation |
|-----------|------|----------|------------|
| `refreshToken` | string | Yes | Valid refresh token |

```
GET /api/auth/refresh-access-token?refreshToken=eyJ...
```

**Success Response** `200 OK`:

Response body returns `LoginResponsePayloadDto`. New tokens are set via `Set-Cookie` headers using the `SetToken` interceptor.

```json
{
  "user": {
    "id": "uuid",
    "email": "jane@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "TEAM_MEMBER"
  }
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Refresh token is required` | Missing `refreshToken` query parameter |
| 401 | `Invalid or expired refresh token` | Token not found in database, already used, or expired |
| 403 | `Account is suspended` | User associated with token is suspended |

**Business Rules**:
- The refresh token is passed as a query parameter (`@Query('refreshToken')`)
- The `SetToken` interceptor sets new JWT tokens in HTTP-only cookies on the response
- Implements token rotation: each refresh issues new tokens and invalidates the old refresh token
- If a previously invalidated refresh token is reused (replay attack), all refresh tokens for that user are revoked as a security measure

---

### POST /api/auth/forgot-password

**Description**: Request a password reset email. Always returns 200 to prevent email enumeration.

**Auth**: Public

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | Yes | Valid email format |

```json
{
  "email": "jane@example.com"
}
```

**Success Response** `200 OK`:

```json
{
  "message": "If an account exists with this email, a reset link has been sent."
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `email must be a valid email address` | Invalid email format |
| 429 | `Too many requests. Try again later.` | Rate limit exceeded (3 requests per email per hour) |

**Business Rules**:
- Always returns `200 OK` with the same message regardless of whether the email exists — prevents email enumeration attacks
- If the email exists and account is active, sends a password reset email via SendGrid containing a one-time reset token
- Reset token is valid for **1 hour** and is stored as a hashed value
- If a previous unexpired reset token exists for the user, it is invalidated before issuing a new one
- Google OAuth-only accounts (no password) also receive the email; resetting creates a password and enables email+password login alongside OAuth
- Rate limited to 3 requests per email address per hour

---

### POST /api/auth/reset-password

**Description**: Reset password using the email and a new password.

**Auth**: Public

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | Yes | `@IsEmail()` — valid email format |
| `password` | string | Yes | `@IsString()`, `@MinLength(8)`, `@MaxLength(17)` |

```json
{
  "email": "jane@example.com",
  "password": "newSecureP@ss1"
}
```

**Success Response** `200 OK`:

```json
{
  "message": "Password has been reset successfully."
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `email must be an email` | Invalid email format |
| 400 | `password must be longer than or equal to 8 characters` | Password too short |
| 400 | `password must be shorter than or equal to 17 characters` | Password too long |
| 404 | `User not found` | No account exists with the provided email |

**Business Rules**:
- The DTO contains only `email` and `password` fields (no token, no confirmPassword)
- Password must be between 8 and 17 characters
- New password is hashed before storage
- All existing refresh tokens for the user are **deleted** (invalidates all active sessions across all devices)
- User must log in again after password reset

---

### GET /api/auth/logout

**Description**: Log out the current user by clearing auth cookies.

**Auth**: Required (`JwtAuthGuard`)

**Request Body**: None

**Success Response** `200 OK`:

Response body returns `ResponsePayloadDto<string>`. Auth cookies are cleared using the `RemoveToken` interceptor.

```json
{
  "message": "Logged out successfully."
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | No valid access token provided |

**Business Rules**:
- Uses `@UseGuards(JwtAuthGuard)` — requires a valid JWT access token
- The `RemoveToken` interceptor clears `accessToken` and `refreshToken` HTTP-only cookies
- No request body is needed; the method is `GET`
- The endpoint is idempotent — calling it when already logged out still returns 200

---

### POST /api/auth/admin-login

**Description**: Authenticate as an admin user with email and password. Only users with the `ADMIN` role can log in through this endpoint.

**Auth**: Public, Rate limited (`@Throttle`: 5 requests per minute)

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | Yes | `@IsEmail()` — valid email format |
| `password` | string | Yes | `@IsString()` — non-empty |
| `rememberMe` | boolean | No | `@IsBoolean()` — extends token lifetimes |

```json
{
  "email": "admin@example.com",
  "password": "secureP@ss1",
  "rememberMe": false
}
```

**Success Response** `200 OK`:

Response body returns `LoginResponsePayloadDto`. Tokens are set via `Set-Cookie` headers using the `SetToken` interceptor.

```json
{
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  }
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `email must be an email` | Invalid email format |
| 400 | `password must be a string` | Missing password |
| 401 | `Invalid email or password` | Email not found or password mismatch |
| 403 | `Access denied. Admin role required.` | User does not have the `ADMIN` role |
| 429 | `Too many requests` | Rate limit exceeded (5 per minute) |

**Business Rules**:
- Uses the same `LoginDto` as the regular login endpoint
- After successful credential validation, checks that the user has the `ADMIN` role; returns 403 if not
- The `SetToken` interceptor sets JWT tokens in HTTP-only cookies on the response
- Rate limited to 5 requests per minute to prevent brute-force attacks

---

### POST /api/auth/change-password

**Description**: Change the current authenticated user's password by providing a new password and confirmation.

**Auth**: Required (`JwtAuthGuard`)

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `newPassword` | string | Yes | `@IsString()`, `@MinLength(8)`, `@MaxLength(17)` |
| `confirmNewPassword` | string | Yes | `@IsString()`, `@MinLength(8)`, `@MaxLength(17)` |

```json
{
  "newPassword": "newSecureP@ss1",
  "confirmNewPassword": "newSecureP@ss1"
}
```

**Success Response** `200 OK`:

Response body returns `LoginResponsePayloadDto`.

```json
{
  "user": {
    "id": "uuid",
    "email": "jane@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "TEAM_MEMBER"
  }
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `newPassword must be longer than or equal to 8 characters` | Password too short |
| 400 | `newPassword must be shorter than or equal to 17 characters` | Password too long |
| 400 | `Passwords do not match` | `newPassword` and `confirmNewPassword` differ |
| 401 | `Unauthorized` | No valid access token provided |

**Business Rules**:
- Validates that `newPassword` matches `confirmNewPassword`
- New password must be between 8 and 17 characters
- New password is hashed before storage
- Returns updated user data in `LoginResponsePayloadDto` format

---

### POST /api/auth/change-user-password

**Description**: Change another user's password by providing the current password and a new password. Intended for admin use.

**Auth**: Required (`JwtAuthGuard`)

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `currentPassword` | string | Yes | `@IsString()`, `@MinLength(8)`, `@MaxLength(17)` |
| `newPassword` | string | Yes | `@IsString()`, `@MinLength(8)`, `@MaxLength(17)` |

```json
{
  "currentPassword": "oldSecureP@ss1",
  "newPassword": "newSecureP@ss1"
}
```

**Success Response** `200 OK`:

Response body returns `LoginResponsePayloadDto`.

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "TEAM_MEMBER"
  }
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `currentPassword must be longer than or equal to 8 characters` | Current password too short |
| 400 | `newPassword must be longer than or equal to 8 characters` | New password too short |
| 400 | `newPassword must be shorter than or equal to 17 characters` | New password too long |
| 401 | `Unauthorized` | No valid access token provided |
| 401 | `Current password is incorrect` | Provided current password does not match |

**Business Rules**:
- Requires knowing the current password as verification before changing
- Both `currentPassword` and `newPassword` must be between 8 and 17 characters
- New password is hashed before storage
- Returns updated user data in `LoginResponsePayloadDto` format

---

### GET /api/auth/check-login

**Description**: Verify whether the current JWT token is valid. Used by the frontend on app startup to check authentication status.

**Auth**: Required (`JwtAuthGuard`)

**Request Body**: None

**Success Response** `200 OK`:

Response body returns `ResponsePayloadDto<IJwtPayload>` with the decoded JWT payload if authenticated.

```json
{
  "data": {
    "id": "uuid",
    "email": "jane@example.com",
    "role": "TEAM_MEMBER"
  }
}
```

If the token is invalid or missing, returns `null`.

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | No valid access token provided |

**Business Rules**:
- Returns the decoded JWT payload (`IJwtPayload`) if the token is valid
- Returns `null` if the token is invalid or missing
- No side effects — purely a validation/check endpoint
- Used by the frontend on application startup to determine if the user is already logged in

---

### POST /api/auth/register-fcm-token

**Description**: Register a Firebase Cloud Messaging (FCM) token for the current user's device to enable push notifications.

**Auth**: Required (`JwtAuthGuard`)

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `fcmToken` | string | Yes | `@IsString()` — the device's Firebase Cloud Messaging token |

```json
{
  "fcmToken": "fMd2:APA91bHun4MxP5egoKl0..."
}
```

**Success Response** `200 OK`:

Response body returns `ResponsePayloadDto<string>`.

```json
{
  "data": "FCM token registered successfully."
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `fcmToken must be a string` | Missing or invalid FCM token |
| 401 | `Unauthorized` | No valid access token provided |

**Business Rules**:
- Adds the FCM token to the user's device token array for push notifications
- If the token already exists in the user's array, it is not duplicated
- Each user can have multiple FCM tokens (one per device)
- Used by mobile and web clients after obtaining a FCM token from Firebase SDK

---

## 2. Users (Profile)

### GET /api/users/me

**Description**: Get the current authenticated user's full profile.

**Auth**: Required (any role)

**Success Response** `200 OK`:

```json
{
  "id": "uuid",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "project_owner",
  "jobTitle": "Product Manager",
  "avatarUrl": "https://s3.amazonaws.com/taskboard/avatars/uuid.jpg",
  "status": "active",
  "emailVerified": true,
  "googleLinked": true,
  "pushEnabled": true,
  "digestFrequency": "daily",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-02-10T00:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |

**Business Rules**:

- `password_hash` and `google_id` are never exposed in the response
- `googleLinked` is a computed boolean (`true` if `google_id` is not null)
- Updates `users.last_active_at` on each call

---

### PATCH /api/users/me

**Description**: Update the current user's profile fields.

**Auth**: Required (any role)

**Request Body** (all fields optional — only include fields to update):

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `firstName` | string | No | @IsString, max 100 characters |
| `lastName` | string | No | @IsString, max 100 characters |
| `jobTitle` | string | No | @IsString, max 255 characters |

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "jobTitle": "Senior Designer"
}
```

**Success Response** `200 OK`: Updated user object (same shape as `GET /api/users/me`).

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `firstName must be a string` | Invalid type for firstName |
| 400 | `firstName must be shorter than or equal to 100 characters` | firstName too long |
| 400 | `lastName must be a string` | Invalid type for lastName |
| 400 | `lastName must be shorter than or equal to 100 characters` | lastName too long |
| 401 | `Unauthorized` | Missing or invalid access token |

**Business Rules**:

- `email` cannot be changed through this endpoint
- `role` and `status` cannot be changed by the user; only admins can modify these via admin endpoints
- Avatar is handled separately via `POST /api/users/me/avatar`
- At least one field must be provided; an empty body returns 400
- Returns the full updated user object

---

### POST /api/users/me/avatar

**Description**: Upload or replace the current user's profile photo.

**Auth**: Required (any role)

**Request Body** (`multipart/form-data`):

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `avatar` | file | Yes | PNG, JPG, or JPEG. Max 5 MB (5,242,880 bytes) |

```
Content-Type: multipart/form-data; boundary=----FormBoundary
------FormBoundary
Content-Disposition: form-data; name="avatar"; filename="photo.jpg"
Content-Type: image/jpeg

<binary data>
------FormBoundary--
```

**Success Response** `200 OK`:

```json
{
  "avatarUrl": "https://s3.amazonaws.com/taskboard/avatars/uuid-1708041600.jpg"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `avatar file is required` | No file attached |
| 400 | `File type not allowed. Accepted: PNG, JPG, JPEG` | Invalid MIME type |
| 401 | `Unauthorized` | Missing or invalid access token |
| 413 | `File size exceeds 5 MB limit` | File larger than 5,242,880 bytes |

**Business Rules**:

- Accepted MIME types: `image/png`, `image/jpeg`
- Maximum file size: 5 MB (5,242,880 bytes)
- The file is uploaded to AWS S3 under the path `avatars/{userId}-{timestamp}.{ext}`
- If the user already has an avatar, the previous file is deleted from S3 before uploading the new one
- The `users.profile_photo_url` column is updated with the new S3 URL
- Returns only the new `avatarUrl`; the full user object can be fetched via `GET /api/users/me`
- Image is not resized server-side; frontend should crop/resize before uploading

---

### PATCH /api/users/me/password

**Description**: Change the current user's password. Requires the current password for verification.

**Auth**: Required (any role)

**Request Body**:

| Field              | Type   | Required | Validation                              |
|--------------------| -------|----------|-----------------------------------------|
| `currentPassword`  | string | Yes      | @IsString, must match existing password |
| `newPassword`      | string | Yes      | @IsString, min 8 characters             |

```json
{
  "currentPassword": "oldP@ss123",
  "newPassword": "newSecureP@ss1"
}
```

**Success Response** `200 OK`:

```json
{
  "message": "Password changed successfully."
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `currentPassword is required` | Missing field |
| 400 | `newPassword must be at least 8 characters` | Password too short |
| 400 | `newPassword must be different from currentPassword` | Same password reused |
| 401 | `Unauthorized` | Missing or invalid access token |
| 401 | `Current password is incorrect` | Wrong current password |
| 422 | `Account uses Google sign-in only. Set a password via forgot password.` | `password_hash` is null (OAuth-only) |

**Business Rules**:

- Verifies `currentPassword` against the stored `password_hash` using bcrypt
- New password is bcrypt-hashed (cost factor 10) before storage
- All other refresh tokens for this user are **deleted** (logs out other devices); the current session remains active
- Google OAuth-only users (`password_hash = null`) cannot use this endpoint — they must use the forgot-password flow to set an initial password
- Does not affect `accessToken` validity of the current session

---

### PATCH /api/users/me/notifications

**Description**: Update the current user's notification preferences.

**Auth**: Required (any role)

**Request Body** (all fields optional):

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `pushEnabled` | boolean | No | `true` or `false` |
| `digestFrequency` | string | No | One of: `off`, `daily`, `weekly` |
| `notifyTaskAssigned` | boolean | No | Toggle: task assignment notifications |
| `notifyDueDateReminder` | boolean | No | Toggle: due date reminder notifications |
| `notifyStatusChange` | boolean | No | Toggle: task status change notifications |
| `notifyCommentMention` | boolean | No | Toggle: @mention in comment notifications |
| `notifyNewComment` | boolean | No | Toggle: new comment on involved tasks |
| `notifyInvitation` | boolean | No | Toggle: project invitation notifications |

```json
{
  "pushEnabled": false,
  "digestFrequency": "weekly",
  "notifyTaskAssigned": true,
  "notifyDueDateReminder": true,
  "notifyStatusChange": false,
  "notifyCommentMention": true,
  "notifyNewComment": true,
  "notifyInvitation": true
}
```

**Success Response** `200 OK`: Updated user object (same shape as `GET /api/users/me`).

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `digestFrequency must be one of: off, daily, weekly` | Invalid enum value |
| 401 | `Unauthorized` | Missing or invalid access token |

**Business Rules**:

- `pushEnabled` controls mobile push notifications
- `digestFrequency` controls email summary frequency via SendGrid
- Per-type toggles (`notifyTaskAssigned`, `notifyDueDateReminder`, `notifyStatusChange`, `notifyCommentMention`, `notifyNewComment`, `notifyInvitation`) control whether each notification type is delivered to the user. When a toggle is `false`, the backend skips creating notifications of that type for the user.
- Changes take effect immediately for push; digest changes apply from the next scheduled cycle
- At least one field must be provided

---

### POST /api/users/me/devices

**Description**: Register a device for push notifications. Stores the device's FCM (Android) or APNs (iOS) token so the backend can send push notifications.

**Auth**: Required (any role)

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `token` | string | Yes | Non-empty, max 500 characters |
| `platform` | `ios` \| `android` | Yes | Device platform |
| `deviceName` | string | No | Max 100 characters (e.g., "iPhone 15 Pro") |

```json
{
  "token": "fMI-rGR8TZi7bwz...",
  "platform": "android",
  "deviceName": "Pixel 8"
}
```

**Success Response** `201 Created`:

```json
{
  "id": "uuid",
  "platform": "android",
  "deviceName": "Pixel 8",
  "createdAt": "2026-02-16T10:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `token is required` | Missing token |
| 400 | `platform must be one of: ios, android` | Invalid platform |
| 401 | `Unauthorized` | Missing or invalid access token |
| 409 | `Device already registered` | Token already exists for this user (returns existing device) |

**Business Rules**:

- Each user can register multiple devices (phone + tablet, etc.)
- If the same `token` already exists for this user, returns 409 with the existing device record (idempotent — client can safely retry)
- If the same `token` exists for a different user (e.g., shared device), the old registration is replaced with the new user
- The `token` is stored in the `user_devices` table alongside `user_id`, `platform`, and `device_name`
- Push notifications are only sent if `pushEnabled = true` in user notification preferences AND at least one device is registered
- Tokens that repeatedly fail delivery (e.g., FCM returns `NotRegistered`) are automatically removed by a background cleanup job

---

### DELETE /api/users/me/devices/:deviceId

**Description**: Unregister a device from push notifications. Typically called on logout from a mobile device.

**Auth**: Required (device owner only)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `deviceId` | uuid | Device registration ID |

**Success Response** `200 OK`:

```json
{
  "message": "Device unregistered."
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You can only manage your own devices` | Device belongs to a different user |
| 404 | `Device not found` | ID does not exist |

**Business Rules**:

- Hard-deletes the device registration record from `user_devices`
- Only the user who registered the device can unregister it
- Mobile clients should call this endpoint during logout to stop receiving push notifications on that device
- If all devices are removed, the user will no longer receive push notifications even if `pushEnabled = true`

---

### DELETE /api/users/me

**Description**: Delete the current user's own account (soft delete).

**Auth**: Required (PROJECT_OWNER, TEAM_MEMBER only)

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `password` | string | Yes | Must match current password for confirmation |

```json
{
  "password": "currentP@ss1"
}
```

**Success Response** `200 OK`:

```json
{
  "message": "Account deleted successfully."
}
```

(Clears auth cookies via `Set-Cookie` with `Max-Age=0`.)

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `password is required` | Missing confirmation password |
| 401 | `Unauthorized` | Missing or invalid access token |
| 401 | `Password is incorrect` | Wrong password |
| 403 | `Admin accounts cannot be self-deleted` | User role is `ADMIN` |
| 422 | `Transfer project ownership before deleting account` | User owns active projects with members |

**Business Rules**:

- Soft-deletes the user: sets `users.deleted_at` to now and `users.status` to `DELETED`
- All refresh tokens for the user are deleted (invalidates all sessions)
- Auth cookies are cleared
- If the user is a project owner with active (non-archived) projects that have other members, deletion is blocked — they must transfer ownership or archive projects first
- Projects where the user is the sole owner with no other members are archived automatically
- The user's project memberships (`project_members`) are removed
- Task `assignee_id` references are set to `NULL` (tasks remain on the board, unassigned)
- Admin users cannot delete themselves via this endpoint

---

## 3. Admin — User Management

> All endpoints in this section require **Admin** role authentication.
> Non-admin users receive `403 Forbidden`.

### GET /api/admin/users

**Description**: List all users with search, filtering, sorting, and pagination.

**Auth**: Required (ADMIN only)

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-based) |
| `limit` | integer | 20 | Items per page (10, 25, 50, 100) |
| `search` | string | — | Search by name or email (case-insensitive partial match) |
| `role` | string | — | Filter by role: `project_owner`, `team_member`, `admin` |
| `status` | string | — | Filter by status: `active`, `suspended`, `deleted` |
| `dateFrom` | string (ISO date) | — | Registration date from (inclusive) |
| `dateTo` | string (ISO date) | — | Registration date to (inclusive) |
| `sortBy` | string | `created_at` | One of: `full_name`, `email`, `role`, `status`, `created_at`, `last_active_at` |
| `sortOrder` | `asc` \| `desc` | `desc` | Sort direction |

**Example**: `GET /api/admin/users?search=jane&role=team_member&status=active&page=1&limit=25&sortBy=created_at&sortOrder=desc`

**Success Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "team_member",
      "status": "active",
      "avatarUrl": "https://s3.amazonaws.com/...",
      "projectsCount": 5,
      "tasksCount": 23,
      "createdAt": "2026-01-15T08:30:00.000Z",
      "lastActiveAt": "2026-02-16T14:22:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 25,
    "totalItems": 142,
    "totalPages": 6
  }
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `Invalid role filter` | Unrecognized role value |
| 400 | `Invalid status filter` | Unrecognized status value |
| 400 | `Invalid sortBy field` | Column not in allowed list |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |

**Business Rules**:

- `projectsCount` is the number of projects the user is a member of (via `project_members`)
- `tasksCount` is the number of tasks assigned to the user (`tasks.assignee_id`)
- `search` matches against both `full_name` and `email` using case-insensitive `ILIKE %term%`
- Soft-deleted users (`status = deleted`) are only returned when explicitly filtered with `status=deleted`; default listing excludes them
- Results are scoped: does not return `password_hash`, `google_id`, or other sensitive fields

---

### POST /api/admin/users

**Description**: Create a new user account from the admin panel. Sends an invitation email.

**Auth**: Required (ADMIN only)

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | Yes | 1-100 characters |
| `email` | string | Yes | Valid email format, max 255 characters |
| `role` | string | Yes | One of: `project_owner`, `team_member` |

```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "role": "project_owner"
}
```

**Success Response** `201 Created`:

```json
{
  "id": "uuid",
  "name": "John Smith",
  "email": "john@example.com",
  "role": "project_owner",
  "status": "active",
  "emailVerified": false,
  "createdAt": "2026-02-16T10:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `name must be between 1 and 100 characters` | Name missing or too long |
| 400 | `email must be a valid email address` | Invalid email format |
| 400 | `role must be one of: project_owner, team_member` | Invalid role (cannot create admin via this endpoint) |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |
| 409 | `User with this email already exists` | Email already registered |

**Business Rules**:

- Admin cannot create other admin accounts via this endpoint (admin accounts are seeded or created via direct DB access)
- No password is set; the system sends an invitation email via SendGrid with a link to set a password
- The invitation email contains a one-time setup token valid for **72 hours**
- `email_verified` is `false` until the user completes the setup flow
- `status` is set to `active` immediately

---

### GET /api/admin/users/:id

**Description**: Get detailed profile of a specific user, including project and task statistics.

**Auth**: Required (ADMIN only)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | User ID |

**Success Response** `200 OK`:

```json
{
  "id": "uuid",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "team_member",
  "status": "active",
  "jobTitle": "Designer",
  "avatarUrl": "https://s3.amazonaws.com/...",
  "emailVerified": true,
  "googleLinked": true,
  "pushEnabled": true,
  "digestFrequency": "daily",
  "lastActiveAt": "2026-02-16T14:22:00.000Z",
  "createdAt": "2026-01-15T08:30:00.000Z",
  "updatedAt": "2026-02-10T12:00:00.000Z",
  "projects": [
    {
      "id": "uuid",
      "title": "Website Redesign",
      "projectRole": "member",
      "status": "active"
    }
  ],
  "recentTasks": [
    {
      "id": "uuid",
      "title": "Design homepage mockup",
      "projectTitle": "Website Redesign",
      "status": "In Progress",
      "priority": "high",
      "dueDate": "2026-02-20"
    }
  ],
  "stats": {
    "projectsCount": 5,
    "tasksAssigned": 23,
    "tasksCompleted": 18,
    "totalTimeLoggedMinutes": 4520
  }
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |
| 404 | `User not found` | ID does not exist |

**Business Rules**:

- `projects` includes all projects the user belongs to (via `project_members`), with their role in each
- `recentTasks` returns the 5 most recently updated tasks assigned to the user
- `stats.tasksCompleted` counts tasks in the last (rightmost) column of each board (conventionally "Done")
- Soft-deleted users are accessible via this endpoint (admin may need to review before permanent deletion)

---

### PATCH /api/admin/users/:id

**Description**: Update a user's profile fields as an admin.

**Auth**: Required (ADMIN only)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | User ID |

**Request Body** (all fields optional):

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | No | 1-100 characters |
| `jobTitle` | string | No | Max 100 characters, or `null` to clear |
| `avatarUrl` | string | No | Valid URL max 500 characters, or `null` to clear |

```json
{
  "name": "Jane Smith-Doe",
  "jobTitle": "Lead Designer"
}
```

**Success Response** `200 OK`: Updated user object (same shape as `GET /api/admin/users/:id`, without nested `projects`/`recentTasks`/`stats`).

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `name must be between 1 and 100 characters` | Name empty or too long |
| 400 | `avatarUrl must be a valid URL` | Malformed URL |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |
| 404 | `User not found` | ID does not exist |

**Business Rules**:

- Admin cannot change `email`, `role`, or `status` through this endpoint — use the dedicated role/status endpoints
- At least one field must be provided
- Admin can edit any user including soft-deleted users

---

### PATCH /api/admin/users/:id/status

**Description**: Activate or suspend a user account.

**Auth**: Required (ADMIN only)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | User ID |

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `status` | string | Yes | One of: `active`, `suspended` |

```json
{
  "status": "suspended"
}
```

**Success Response** `200 OK`:

```json
{
  "id": "uuid",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "team_member",
  "status": "suspended",
  "updatedAt": "2026-02-16T15:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `status must be one of: active, suspended` | Invalid status value |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |
| 403 | `Cannot suspend your own account` | Admin targeting themselves |
| 404 | `User not found` | ID does not exist |
| 422 | `Cannot change status of a deleted account` | User `status` is `DELETED` |

**Business Rules**:

- **Suspending** a user (`active → suspended`):
  - All refresh tokens for the user are deleted (immediately logs them out of all devices)
  - The user cannot log in until reactivated
  - Their tasks, comments, and project memberships remain intact
  - Other users see them as inactive/greyed-out in member lists
- **Activating** a user (`suspended → active`):
  - The user can log in again immediately
  - No notification is sent; user discovers on next login attempt
- Admin cannot suspend themselves
- Cannot transition a `deleted` user via this endpoint — use restore flow if implemented

---

### PATCH /api/admin/users/:id/role

**Description**: Change a user's platform-level role.

**Auth**: Required (ADMIN only)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | User ID |

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `role` | string | Yes | One of: `project_owner`, `team_member` |

```json
{
  "role": "project_owner"
}
```

**Success Response** `200 OK`:

```json
{
  "id": "uuid",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "project_owner",
  "updatedAt": "2026-02-16T15:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `role must be one of: project_owner, team_member` | Invalid role value |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |
| 403 | `Cannot change role of an admin account` | Target user is admin |
| 404 | `User not found` | ID does not exist |

**Business Rules**:

- Cannot promote a user to `admin` or demote an `admin` via this endpoint (admin role is system-level only)
- **Upgrading** `team_member → project_owner`:
  - User gains ability to create projects, manage columns, invite members, etc.
  - Existing project memberships and task assignments are unaffected
- **Downgrading** `project_owner → team_member`:
  - User loses project management capabilities
  - Projects they own remain; they stay as owner on those projects (ownership is per-project in `project_members`, not derived from platform role)
  - They can no longer create new projects
- Role change takes effect on next API request (no token refresh needed; role is checked per-request from DB)

---

### POST /api/admin/users/:id/reset-password

**Description**: Admin-initiated password reset. Sends a reset email to the user.

**Auth**: Required (ADMIN only)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | User ID |

**Request Body**: None

**Success Response** `200 OK`:

```json
{
  "message": "Password reset email sent to jane@example.com."
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |
| 404 | `User not found` | ID does not exist |
| 422 | `Cannot reset password for a deleted account` | User `status` is `DELETED` |

**Business Rules**:

- Sends a password reset email via SendGrid (same flow as `POST /api/auth/forgot-password`)
- Reset token is valid for **1 hour**
- Any existing unexpired reset token for the user is invalidated first
- Does NOT immediately invalidate user sessions — that only happens when the user actually resets the password
- Works for both email+password and Google OAuth-only accounts

---

### DELETE /api/admin/users/:id

**Description**: Soft-delete a user account.

**Auth**: Required (ADMIN only)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | User ID |

**Request Body**: None

**Success Response** `200 OK`:

```json
{
  "message": "User deleted successfully."
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |
| 403 | `Cannot delete your own account` | Admin targeting themselves |
| 403 | `Cannot delete another admin account` | Target user is admin |
| 404 | `User not found` | ID does not exist or already deleted |
| 422 | `User owns active projects with members. Transfer or archive projects first.` | User owns projects that have other members |

**Business Rules**:

- Soft-deletes the user: sets `users.deleted_at` to now and `users.status` to `DELETED`
- All refresh tokens for the user are deleted (immediately logs out all sessions)
- Admin cannot delete themselves or other admin accounts
- If the user owns active projects with other members, deletion is blocked — admin must archive those projects or transfer ownership first
- Projects where the user is the sole owner with no other members are archived automatically
- The user's `project_members` records are removed
- Task `assignee_id` references are set to `NULL` (tasks remain unassigned)
- The user's data (comments, activity logs, time entries) is preserved for audit purposes

---

### POST /api/admin/users/bulk

**Description**: Perform bulk actions on multiple users.

**Auth**: Required (ADMIN only)

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `userIds` | string[] | Yes | Array of user UUIDs, 1-100 items |
| `action` | string | Yes | One of: `activate`, `suspend`, `delete` |

```json
{
  "userIds": ["uuid-1", "uuid-2", "uuid-3"],
  "action": "suspend"
}
```

**Success Response** `200 OK`:

```json
{
  "message": "Bulk action completed.",
  "results": {
    "success": 2,
    "failed": 1,
    "errors": [
      {
        "userId": "uuid-3",
        "message": "Cannot suspend your own account"
      }
    ]
  }
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `userIds must contain 1 to 100 items` | Empty array or exceeds limit |
| 400 | `action must be one of: activate, suspend, delete` | Invalid action |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |

**Business Rules**:

- Processes each user independently; failures on individual users do not roll back others
- Each user is validated against the same rules as the individual endpoint (`PATCH .../status` or `DELETE`):
  - Cannot suspend/delete the requesting admin
  - Cannot modify other admin accounts
  - Cannot delete users who own active projects with members
- `activate` sets `status = ACTIVE` for suspended users; skips already-active users
- `suspend` sets `status = SUSPENDED` and revokes all refresh tokens; skips already-suspended users
- `delete` performs soft-delete with same rules as `DELETE /api/admin/users/:id`
- Response always returns 200 with per-user success/failure breakdown
- Maximum 100 users per bulk request to prevent abuse

---

### GET /api/admin/users/export

**Description**: Export user data as CSV based on current filters.

**Auth**: Required (ADMIN only)

**Query Parameters**: Same filters as `GET /api/admin/users` (search, role, status, dateFrom, dateTo, sortBy, sortOrder). Pagination is ignored — all matching records are exported.

**Example**: `GET /api/admin/users/export?role=team_member&status=active&dateFrom=2026-01-01`

**Success Response** `200 OK`:

Response headers:

```
Content-Type: text/csv
Content-Disposition: attachment; filename="users-export-2026-02-16.csv"
```

CSV columns:

```
Name,Email,Role,Status,Job Title,Projects Count,Tasks Count,Registration Date,Last Active
"Jane Doe","jane@example.com","Team Member","Active","Designer",5,23,"2026-01-15","2026-02-16"
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |

**Business Rules**:

- Applies the same filters as the list endpoint but exports all matching rows (no pagination)
- Maximum export limit of **10,000 rows** to prevent memory issues; returns 422 if exceeded
- CSV file is generated server-side and streamed to the client
- Filename includes the export date
- Sensitive fields (`password_hash`, `google_id`, `refresh_tokens`) are never included
- Date columns are formatted as `YYYY-MM-DD`; datetime columns as `YYYY-MM-DD HH:mm`

---

## 4. Projects

### GET /api/projects

**Description**: List projects the current user belongs to, with search, filtering, sorting, and pagination.

**Auth**: Required (PROJECT_OWNER, TEAM_MEMBER)

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-based) |
| `limit` | integer | 20 | Items per page (max 100) |
| `search` | string | — | Search by project title (case-insensitive partial match) |
| `status` | `active` \| `completed` \| `archived` | — | Filter by project status. Default listing returns `active` and `completed` (excludes `archived`) |
| `sortBy` | `created_at` \| `deadline` \| `title` | `created_at` | Sort field |
| `sortOrder` | `asc` \| `desc` | `desc` | Sort direction |

**Example**: `GET /api/projects?search=website&status=active&sortBy=deadline&sortOrder=asc&page=1&limit=20`

**Success Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Website Redesign",
      "description": "Redesign the company website...",
      "status": "active",
      "template": "default",
      "deadline": "2026-03-15",
      "owner": {
        "id": "uuid",
        "name": "Jane Doe",
        "avatarUrl": "https://s3.amazonaws.com/..."
      },
      "memberCount": 5,
      "taskCount": 23,
      "completedTaskCount": 12,
      "completionPercent": 52,
      "createdAt": "2026-01-15T08:30:00.000Z",
      "updatedAt": "2026-02-10T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 8,
    "totalPages": 1
  }
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `Invalid status filter` | Unrecognized status value |
| 400 | `Invalid sortBy field` | Column not in allowed list |
| 401 | `Unauthorized` | Missing or invalid access token |

**Business Rules**:

- Returns only projects where the user is a member (via `project_members`) — not all projects in the system
- Default listing excludes `archived` projects; pass `status=archived` to see them
- `completionPercent` is computed: `completedTaskCount / taskCount * 100` (0 if no tasks)
- `completedTaskCount` counts tasks in the last (rightmost) column of the board (conventionally "Done")
- `taskCount` excludes soft-deleted tasks

---

### POST /api/projects

**Description**: Create a new project with a Kanban board and optional team invitations.

**Auth**: Required (PROJECT_OWNER only)

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `title` | string | Yes | 1-255 characters |
| `description` | string | No | Rich text / markdown |
| `deadline` | string (date) | No | ISO 8601 date, must be today or future |
| `template` | `default` \| `minimal` \| `custom` | No | Default: `default` |
| `columns` | object[] | Conditional | Required only when `template = custom`. Array of `{ title, wipLimit? }` |
| `inviteEmails` | string[] | No | Array of email addresses to invite |

```json
{
  "title": "Website Redesign",
  "description": "Complete redesign of the company website",
  "deadline": "2026-06-30",
  "template": "default",
  "inviteEmails": ["john@example.com", "alice@example.com"]
}
```

Custom columns example:

```json
{
  "title": "Sprint 1",
  "template": "custom",
  "columns": [
    { "title": "Backlog" },
    { "title": "In Progress", "wipLimit": 5 },
    { "title": "Testing", "wipLimit": 3 },
    { "title": "Done" }
  ]
}
```

**Success Response** `201 Created`:

```json
{
  "id": "uuid",
  "title": "Website Redesign",
  "description": "Complete redesign of the company website",
  "status": "active",
  "template": "default",
  "deadline": "2026-06-30",
  "owner": {
    "id": "uuid",
    "name": "Jane Doe",
    "avatarUrl": "..."
  },
  "columns": [
    { "id": "uuid", "title": "To Do", "position": 0, "wipLimit": null },
    { "id": "uuid", "title": "In Progress", "position": 1, "wipLimit": null },
    { "id": "uuid", "title": "Review", "position": 2, "wipLimit": null },
    { "id": "uuid", "title": "Done", "position": 3, "wipLimit": null }
  ],
  "memberCount": 1,
  "taskCount": 0,
  "completedTaskCount": 0,
  "completionPercent": 0,
  "createdAt": "2026-02-16T10:00:00.000Z",
  "updatedAt": "2026-02-16T10:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `title is required` | Missing title |
| 400 | `title must be between 1 and 255 characters` | Title too long |
| 400 | `deadline must be today or a future date` | Past date |
| 400 | `template must be one of: default, minimal, custom` | Invalid template |
| 400 | `columns are required when template is custom` | Custom template with no columns |
| 400 | `columns must contain at least 2 items` | Fewer than 2 custom columns |
| 400 | `columns must contain at most 10 items` | More than 10 custom columns |
| 400 | `Column title must be between 1 and 100 characters` | Invalid column title |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Only project owners can create projects` | User role is `TEAM_MEMBER` |

**Business Rules**:

- The creating user is automatically added to `project_members` with `project_role = OWNER`
- Board columns are created based on the selected template:
  - `default`: To Do, In Progress, Review, Done
  - `minimal`: To Do, Done
  - `custom`: User-provided columns array
- Default labels (Bug, Feature, Design, Documentation, Improvement) are copied from system labels to the new project
- If `inviteEmails` is provided, an invitation is created for each email (status `PENDING`) and invitation emails are sent via SendGrid
  - Existing users receive an invitation notification
  - Non-existing emails receive a sign-up link with the invitation token
- Activity log is not created for project creation (the project itself serves as the audit trail via `created_at`)

---

### GET /api/projects/:projectId

**Description**: Get full details of a single project, including columns and member summary.

**Auth**: Required (project member)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | UUID | Project ID |

**Success Response** `200 OK`:

```json
{
  "id": "uuid",
  "title": "Website Redesign",
  "description": "Complete redesign of the company website",
  "status": "active",
  "template": "default",
  "deadline": "2026-06-30",
  "owner": {
    "id": "uuid",
    "name": "Jane Doe",
    "avatarUrl": "..."
  },
  "columns": [
    { "id": "uuid", "title": "To Do", "position": 0, "wipLimit": null, "taskCount": 5 },
    { "id": "uuid", "title": "In Progress", "position": 1, "wipLimit": null, "taskCount": 8 },
    { "id": "uuid", "title": "Review", "position": 2, "wipLimit": 3, "taskCount": 2 },
    { "id": "uuid", "title": "Done", "position": 3, "wipLimit": null, "taskCount": 12 }
  ],
  "members": [
    { "id": "uuid", "name": "Jane Doe", "avatarUrl": "...", "projectRole": "owner" },
    { "id": "uuid", "name": "John Smith", "avatarUrl": "...", "projectRole": "member" }
  ],
  "memberCount": 5,
  "taskCount": 27,
  "completedTaskCount": 12,
  "completionPercent": 44,
  "overdueTaskCount": 3,
  "createdAt": "2026-01-15T08:30:00.000Z",
  "updatedAt": "2026-02-10T12:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You are not a member of this project` | Non-member access |
| 404 | `Project not found` | ID does not exist or soft-deleted |

**Business Rules**:

- Only accessible by project members (verified via `project_members`)
- `columns` includes per-column `taskCount` (excluding soft-deleted tasks)
- `members` returns all members with their project role; limited to first 10 for the summary — use `GET /api/projects/:projectId/members` for the full list
- `overdueTaskCount` counts tasks where `due_date < today` and the task is not in the last column

---

### GET /api/projects/:projectId/board

**Description**: Get the complete board state for a project — columns with their tasks, suitable for rendering the full Kanban board in a single request.

**Auth**: Required (project member — any role)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | UUID | Project ID |

**Success Response** `200 OK`:

```json
{
  "projectId": "uuid",
  "projectTitle": "Website Redesign",
  "columns": [
    {
      "id": "uuid",
      "title": "To Do",
      "position": 0,
      "wipLimit": null,
      "tasks": [
        {
          "id": "uuid",
          "title": "Design homepage mockup",
          "description": "Create the initial mockup based on brand guidelines",
          "priority": "high",
          "position": 0,
          "dueDate": "2026-02-20",
          "assignee": {
            "id": "uuid",
            "name": "John Smith",
            "avatarUrl": null
          },
          "labels": [
            { "id": "uuid", "name": "Design", "color": "#9B59B6" }
          ],
          "subTasksCount": 3,
          "subTasksCompleted": 1,
          "commentsCount": 5,
          "attachmentsCount": 2,
          "createdAt": "2026-01-25T10:00:00.000Z"
        }
      ]
    },
    {
      "id": "uuid",
      "title": "In Progress",
      "position": 1,
      "wipLimit": 5,
      "tasks": []
    },
    {
      "id": "uuid",
      "title": "Review",
      "position": 2,
      "wipLimit": 3,
      "tasks": []
    },
    {
      "id": "uuid",
      "title": "Done",
      "position": 3,
      "wipLimit": null,
      "tasks": []
    }
  ],
  "members": [
    {
      "id": "uuid",
      "name": "Jane Doe",
      "avatarUrl": "https://s3.amazonaws.com/taskboard/avatars/uuid.jpg",
      "projectRole": "owner"
    },
    {
      "id": "uuid",
      "name": "John Smith",
      "avatarUrl": null,
      "projectRole": "member"
    }
  ]
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You are not a member of this project` | Non-member access |
| 404 | `Project not found` | ID does not exist or soft-deleted |

**Business Rules**:

- Returns columns ordered by `position ASC`, each containing its tasks ordered by `position ASC`
- Only non-deleted tasks are included (`deleted_at IS NULL`)
- Task cards include aggregate counts (`subTasksCount`, `subTasksCompleted`, `commentsCount`, `attachmentsCount`) for badge display
- `members` returns all project members for the assignee dropdown and avatar display
- This endpoint is optimized for the initial board render; subsequent updates are received via WebSocket events
- Clients should call this endpoint when receiving a `boardRefresh` WebSocket event

---

### PATCH /api/projects/:projectId

**Description**: Update project settings (title, description, deadline).

**Auth**: Required (project owner)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | UUID | Project ID |

**Request Body** (all fields optional):

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `title` | string | No | 1-255 characters |
| `description` | string \| null | No | Rich text / markdown, or `null` to clear |
| `deadline` | string (date) \| null | No | ISO 8601 date (today or future), or `null` to clear |

```json
{
  "title": "Website Redesign v2",
  "deadline": "2026-09-30"
}
```

**Success Response** `200 OK`: Updated project object (same shape as `GET /api/projects/:projectId`, without nested `columns` and `members`).

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `title must be between 1 and 255 characters` | Title empty or too long |
| 400 | `deadline must be today or a future date` | Past date |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Only the project owner can edit project settings` | Non-owner member |
| 404 | `Project not found` | ID does not exist or soft-deleted |
| 422 | `Cannot edit an archived project` | Project status is `ARCHIVED` |

**Business Rules**:

- Only the project owner (verified via `project_members.project_role = OWNER`) can update settings
- `status` and `template` cannot be changed through this endpoint — use archive/delete for status changes
- Archived projects cannot be edited; they must be unarchived first
- At least one field must be provided
- Activity log entry created: `PROJECT_UPDATED` with `details.changes` containing old/new values
- Broadcasts update via WebSocket to all connected board viewers

---

### POST /api/projects/:projectId/archive

**Description**: Archive or unarchive a project. Archived projects are read-only and hidden from the default project list.

**Auth**: Required (project owner)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | UUID | Project ID |

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `archived` | boolean | Yes | `true` to archive, `false` to unarchive |

```json
{
  "archived": true
}
```

**Success Response** `200 OK`:

```json
{
  "id": "uuid",
  "title": "Website Redesign",
  "status": "archived",
  "updatedAt": "2026-02-16T15:00:00.000Z"
}
```

Unarchive response:

```json
{
  "id": "uuid",
  "title": "Website Redesign",
  "status": "active",
  "updatedAt": "2026-02-16T15:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `archived is required` | Missing field |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Only the project owner can archive/unarchive projects` | Non-owner member |
| 404 | `Project not found` | ID does not exist or soft-deleted |
| 422 | `Project is already archived` | `archived: true` on an already-archived project |
| 422 | `Project is not archived` | `archived: false` on a non-archived project |

**Business Rules**:

- **Archiving** (`archived: true`):
  - Sets `projects.status` to `ARCHIVED`
  - The project becomes read-only: no new tasks, comments, or membership changes are allowed
  - The project is hidden from the default project list (only visible with `status=archived` filter)
  - All project members retain access for viewing
  - Activity log entry created: `PROJECT_ARCHIVED`
- **Unarchiving** (`archived: false`):
  - Sets `projects.status` back to `ACTIVE`
  - Full editing capabilities are restored
  - The project reappears in the default project list
- Completed projects (`status = completed`) can also be archived

---

### DELETE /api/projects/:projectId

**Description**: Permanently delete a project and all its data.

**Auth**: Required (project owner)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | UUID | Project ID |

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `confirmTitle` | string | Yes | Must exactly match the project title (confirmation safeguard) |

```json
{
  "confirmTitle": "Website Redesign"
}
```

**Success Response** `200 OK`:

```json
{
  "message": "Project 'Website Redesign' has been permanently deleted."
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `confirmTitle is required` | Missing field |
| 400 | `confirmTitle does not match project title` | Mismatched confirmation |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Only the project owner can delete projects` | Non-owner member |
| 404 | `Project not found` | ID does not exist |

**Business Rules**:

- This is a **hard delete** — the project and all related data are permanently removed:
  - All columns, tasks (including trashed), sub-tasks, comments, attachments, time entries, labels, task_labels, activity logs, and invitations
  - All `project_members` records
  - Attachments are deleted from AWS S3
- Requires the exact project title as confirmation to prevent accidental deletion
- Notifications referencing this project have their `project_id` set to `NULL`
- Broadcasts project deletion via WebSocket; all connected clients are redirected to the project list

---

## 5. Project Members

### GET /api/projects/:projectId/members

**Description**: List all members of a project.

**Auth**: Required (project member)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | UUID | Project ID |

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | — | Search by member name or email (case-insensitive partial match) |

**Success Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "avatarUrl": "https://s3.amazonaws.com/...",
      "projectRole": "owner",
      "jobTitle": "Product Manager",
      "joinedAt": "2026-01-15T08:30:00.000Z"
    },
    {
      "id": "uuid",
      "name": "John Smith",
      "email": "john@example.com",
      "avatarUrl": null,
      "projectRole": "member",
      "jobTitle": "Developer",
      "joinedAt": "2026-01-20T10:00:00.000Z"
    }
  ]
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You are not a member of this project` | Non-member access |
| 404 | `Project not found` | ID does not exist |

**Business Rules**:

- Returns all members (no pagination — member lists are typically small)
- Results are sorted by `project_role` (owner first) then by `joined_at` ascending
- The `search` parameter matches against `full_name` and `email`
- Does not include pending invitations — use `GET /api/projects/:projectId/invitations` for those

---

### POST /api/projects/:projectId/members/invite

**Description**: Invite one or more users to join the project by email.

**Auth**: Required (project owner)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | UUID | Project ID |

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `emails` | string[] | Yes | Array of valid email addresses, 1-20 items |

```json
{
  "emails": ["alice@example.com", "bob@example.com"]
}
```

**Success Response** `201 Created`:

```json
{
  "message": "Invitations sent.",
  "results": {
    "invited": 1,
    "alreadyMember": 1,
    "alreadyInvited": 0,
    "details": [
      { "email": "alice@example.com", "status": "invited" },
      { "email": "bob@example.com", "status": "already_member" }
    ]
  }
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `emails must contain 1 to 20 items` | Empty array or exceeds limit |
| 400 | `Each email must be a valid email address` | Invalid email format in array |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Only the project owner can invite members` | Non-owner member |
| 404 | `Project not found` | ID does not exist |
| 422 | `Cannot invite members to an archived project` | Project status is `ARCHIVED` |

**Business Rules**:

- Processes each email independently; per-email status is returned in the response
- For each email:
  - If the user is already a project member → skipped (`already_member`)
  - If a pending invitation already exists → skipped (`already_invited`)
  - Otherwise → creates an `invitations` record with a unique token (expires in 7 days) and sends an email via SendGrid
- Existing registered users receive an in-app `INVITATION` notification in addition to the email
- Non-registered emails receive a sign-up link with the invitation token embedded
- The invitation email contains a one-click link: `{FRONTEND_URL}/invitations/{token}/accept`
- Maximum 20 invitations per request to prevent abuse

---

### DELETE /api/projects/:projectId/members/:userId

**Description**: Remove a member from the project.

**Auth**: Required (project owner)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | UUID | Project ID |
| `userId` | UUID | User ID of the member to remove |

**Success Response** `200 OK`:

```json
{
  "message": "Member removed from project."
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Only the project owner can remove members` | Non-owner member |
| 404 | `Project not found` | ID does not exist |
| 404 | `User is not a member of this project` | User not in `project_members` |
| 422 | `Cannot remove the project owner` | Target is the owner |

**Business Rules**:

- The project owner cannot remove themselves (they must delete or transfer the project instead)
- The `project_members` record is deleted
- Task `assignee_id` for this user's tasks in this project are set to `NULL` (tasks remain on the board, unassigned)
- Activity log entry created: `MEMBER_REMOVED`
- The removed user loses access immediately; if they are viewing the board, the WebSocket connection is terminated

---

### GET /api/projects/:projectId/invitations

**Description**: List pending and recent invitations for a project.

**Auth**: Required (project owner)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | UUID | Project ID |

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | `pending` \| `accepted` \| `expired` \| `cancelled` | — | Filter by invitation status. Default returns all statuses |

**Success Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "uuid",
      "email": "alice@example.com",
      "status": "pending",
      "invitedBy": { "id": "uuid", "name": "Jane Doe" },
      "expiresAt": "2026-02-23T10:00:00.000Z",
      "createdAt": "2026-02-16T10:00:00.000Z"
    },
    {
      "id": "uuid",
      "email": "bob@example.com",
      "status": "accepted",
      "invitedBy": { "id": "uuid", "name": "Jane Doe" },
      "acceptedAt": "2026-02-17T14:00:00.000Z",
      "createdAt": "2026-02-16T10:00:00.000Z"
    }
  ]
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Only the project owner can view invitations` | Non-owner member |
| 404 | `Project not found` | ID does not exist |

**Business Rules**:

- Returns invitations sorted by `created_at` descending (newest first)
- No pagination — invitation lists are typically small
- `acceptedAt` is derived from `updated_at` when `status = ACCEPTED`

---

### POST /api/projects/:projectId/invitations/:invitationId/resend

**Description**: Resend an invitation email for a pending invitation.

**Auth**: Required (project owner)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | UUID | Project ID |
| `invitationId` | UUID | Invitation ID |

**Request Body**: None

**Success Response** `200 OK`:

```json
{
  "message": "Invitation resent to alice@example.com."
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Only the project owner can resend invitations` | Non-owner member |
| 404 | `Invitation not found` | ID does not exist |
| 422 | `Can only resend pending invitations` | Invitation status is not `PENDING` |

**Business Rules**:

- Generates a new token and extends the expiration to 7 days from now
- The old token is invalidated
- A new invitation email is sent via SendGrid
- Rate limited: maximum 3 resends per invitation

---

### DELETE /api/projects/:projectId/invitations/:invitationId

**Description**: Cancel a pending invitation.

**Auth**: Required (project owner)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | UUID | Project ID |
| `invitationId` | UUID | Invitation ID |

**Success Response** `200 OK`:

```json
{
  "message": "Invitation cancelled."
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Only the project owner can cancel invitations` | Non-owner member |
| 404 | `Invitation not found` | ID does not exist |
| 422 | `Can only cancel pending invitations` | Invitation status is not `PENDING` |

**Business Rules**:

- Sets `invitations.status` to `CANCELLED`
- The invitation token becomes invalid; if the invitee clicks the link, they see an error
- Does not send any notification to the invitee

---

### POST /api/invitations/:token/accept

**Description**: Accept a project invitation using the token from the invitation email.

**Auth**: Required (any authenticated user)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `token` | string | Invitation token from the email link |

**Success Response** `200 OK`:

```json
{
  "message": "You have joined the project.",
  "project": {
    "id": "uuid",
    "title": "Website Redesign"
  }
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `Invalid or expired invitation token` | Token not found, expired, or not pending |
| 401 | `Unauthorized` | Not logged in |
| 409 | `You are already a member of this project` | User already in `project_members` |
| 422 | `Invitation email does not match your account email` | Logged-in user's email differs from invitation email |

**Business Rules**:

- The authenticated user's email must match the invitation's email
- Sets `invitations.status` to `ACCEPTED`
- Creates a `project_members` record with `project_role = MEMBER`
- Activity log entry created: `MEMBER_ADDED`
- A notification is sent to the project owner confirming the new member
- Broadcasts member addition via WebSocket to all connected board viewers

---

### POST /api/invitations/:token/decline

**Description**: Decline a project invitation.

**Auth**: Required (any authenticated user)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `token` | string | Invitation token from the email link |

**Success Response** `200 OK`:

```json
{
  "message": "Invitation declined."
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `Invalid or expired invitation token` | Token not found, expired, or not pending |
| 401 | `Unauthorized` | Not logged in |
| 422 | `Invitation email does not match your account email` | Email mismatch |

**Business Rules**:

- Sets `invitations.status` to `CANCELLED` (reuses the cancelled status)
- Does not create any project membership
- No notification is sent to the project owner

---

## 6. Columns

> All column endpoints require the user to be a member of the specified project.
> Column management (create, update, delete, reorder) is restricted to the **project owner**.

### GET /api/projects/:projectId/columns

**Description**: List all columns for a project board, ordered by position.

**Auth**: Required (project member)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | UUID | Project ID |

**Success Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "To Do",
      "position": 0,
      "wipLimit": null,
      "taskCount": 5
    },
    {
      "id": "uuid",
      "title": "In Progress",
      "position": 1,
      "wipLimit": null,
      "taskCount": 8
    },
    {
      "id": "uuid",
      "title": "Review",
      "position": 2,
      "wipLimit": 3,
      "taskCount": 2
    },
    {
      "id": "uuid",
      "title": "Done",
      "position": 3,
      "wipLimit": null,
      "taskCount": 12
    }
  ]
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You are not a member of this project` | Non-member access |
| 404 | `Project not found` | ID does not exist |

**Business Rules**:

- Returns all columns sorted by `position` ascending (left to right)
- No pagination — column counts are small (max 10)
- `taskCount` excludes soft-deleted tasks

---

### POST /api/projects/:projectId/columns

**Description**: Add a new column to the board.

**Auth**: Required (project owner)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | UUID | Project ID |

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `title` | string | Yes | 1-100 characters |
| `wipLimit` | integer \| null | No | Positive integer, or `null` for unlimited |
| `position` | integer | No | 0-based; defaults to the end (rightmost) |

```json
{
  "title": "QA Testing",
  "wipLimit": 5,
  "position": 2
}
```

**Success Response** `201 Created`:

```json
{
  "id": "uuid",
  "title": "QA Testing",
  "position": 2,
  "wipLimit": 5,
  "taskCount": 0
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `title is required` | Missing title |
| 400 | `title must be between 1 and 100 characters` | Title too long |
| 400 | `wipLimit must be a positive integer` | Zero or negative WIP limit |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Only the project owner can manage columns` | Non-owner member |
| 404 | `Project not found` | ID does not exist |
| 422 | `Cannot add columns to an archived project` | Project is archived |
| 422 | `Maximum of 10 columns per project` | Column limit reached |

**Business Rules**:

- Maximum **10 columns** per project
- Existing columns at and after the specified position are shifted right
- If `position` is omitted, the column is appended to the right end
- Activity log entry created: `COLUMN_CREATED`
- Broadcasts column addition via WebSocket

---

### PATCH /api/projects/:projectId/columns/:columnId

**Description**: Update a column's title or WIP limit.

**Auth**: Required (project owner)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | UUID | Project ID |
| `columnId` | UUID | Column ID |

**Request Body** (all fields optional):

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `title` | string | No | 1-100 characters |
| `wipLimit` | integer \| null | No | Positive integer, or `null` to remove limit |

```json
{
  "title": "In Review",
  "wipLimit": 3
}
```

**Success Response** `200 OK`:

```json
{
  "id": "uuid",
  "title": "In Review",
  "position": 2,
  "wipLimit": 3,
  "taskCount": 2
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `title must be between 1 and 100 characters` | Title empty or too long |
| 400 | `wipLimit must be a positive integer` | Zero or negative WIP limit |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Only the project owner can manage columns` | Non-owner member |
| 404 | `Column not found` | ID does not exist or does not belong to project |
| 422 | `WIP limit (3) is less than current task count (5). Remove tasks first.` | New WIP limit lower than current tasks |

**Business Rules**:

- Setting a `wipLimit` lower than the current number of tasks in the column is rejected
- Setting `wipLimit` to `null` removes the limit
- At least one field must be provided
- Activity log entry created: `COLUMN_UPDATED` with `details.changes`
- Broadcasts column update via WebSocket

---

### DELETE /api/projects/:projectId/columns/:columnId

**Description**: Delete a column from the board. Tasks must be moved out first.

**Auth**: Required (project owner)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | UUID | Project ID |
| `columnId` | UUID | Column ID |

**Success Response** `200 OK`:

```json
{
  "message": "Column deleted."
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Only the project owner can manage columns` | Non-owner member |
| 404 | `Column not found` | ID does not exist or does not belong to project |
| 422 | `Cannot delete a column that contains tasks. Move all tasks first.` | Column has tasks (including soft-deleted) |
| 422 | `A project must have at least 2 columns` | Deleting would leave fewer than 2 columns |

**Business Rules**:

- Column must be **empty** (zero tasks, including soft-deleted) before deletion
- A project must retain at least **2 columns** at all times
- Positions of remaining columns are recalculated to close the gap
- Activity log entry created: `COLUMN_DELETED`
- Broadcasts column removal via WebSocket

---

### PATCH /api/projects/:projectId/columns/reorder

**Description**: Reorder all columns on the board in a single operation.

**Auth**: Required (project owner)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | UUID | Project ID |

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `columnIds` | UUID[] | Yes | Ordered array of all column IDs in the project |

```json
{
  "columnIds": ["col-uuid-3", "col-uuid-1", "col-uuid-2", "col-uuid-4"]
}
```

**Success Response** `200 OK`:

```json
{
  "data": [
    { "id": "col-uuid-3", "title": "Review", "position": 0, "wipLimit": 3, "taskCount": 2 },
    { "id": "col-uuid-1", "title": "To Do", "position": 1, "wipLimit": null, "taskCount": 5 },
    { "id": "col-uuid-2", "title": "In Progress", "position": 2, "wipLimit": null, "taskCount": 8 },
    { "id": "col-uuid-4", "title": "Done", "position": 3, "wipLimit": null, "taskCount": 12 }
  ]
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `columnIds is required` | Missing field |
| 400 | `columnIds must include all columns in the project` | Array length mismatch or missing column IDs |
| 400 | `columnIds contains unknown column ID` | ID not found in project |
| 400 | `columnIds contains duplicates` | Repeated column ID |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Only the project owner can manage columns` | Non-owner member |
| 404 | `Project not found` | ID does not exist |

**Business Rules**:

- The array must contain **exactly all column IDs** for the project — no more, no fewer
- Column positions are reassigned based on array order (index 0 = position 0, etc.)
- This is an atomic operation; all positions update in a single transaction
- Broadcasts column reorder via WebSocket to all connected board viewers

---

## 7. Tasks

### GET /api/projects/:projectId/tasks

**Description**: List all tasks in a project (excludes soft-deleted by default).

**Auth**: Required (project member)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | UUID | Project ID |

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 50 | Items per page (max 100) |
| `search` | string | — | Search in title and description (case-insensitive, partial match) |
| `columnId` | UUID | — | Filter by column |
| `assigneeId` | UUID | — | Filter by assignee |
| `priority` | `low` \| `medium` \| `high` \| `urgent` | — | Filter by priority |
| `labelId` | UUID | — | Filter by label |
| `dueDateFrom` | date | — | Due date range start (inclusive) |
| `dueDateTo` | date | — | Due date range end (inclusive) |
| `isOverdue` | boolean | — | Filter overdue tasks (`due_date < today` and not in last column) |
| `sortBy` | `position` \| `priority` \| `due_date` \| `created_at` \| `title` | `position` | Sort field |
| `sortOrder` | `asc` \| `desc` | `asc` | Sort direction |

**Success Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Design homepage mockup",
      "description": "Create the initial design...",
      "priority": "high",
      "dueDate": "2026-02-20",
      "position": 0,
      "column": { "id": "uuid", "name": "In Progress" },
      "assignee": { "id": "uuid", "name": "John Smith", "avatarUrl": "..." },
      "creator": { "id": "uuid", "name": "Jane Doe" },
      "labels": [
        { "id": "uuid", "name": "Design", "color": "#9B59B6" }
      ],
      "subTaskCount": 4,
      "completedSubTaskCount": 2,
      "commentCount": 3,
      "attachmentCount": 1,
      "totalTimeMinutes": 120,
      "createdAt": "2026-02-01T00:00:00.000Z",
      "updatedAt": "2026-02-15T00:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 50, "totalItems": 23, "totalPages": 1 }
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 403 | `You are not a member of this project` | Non-member access |
| 404 | `Project not found` | Invalid project ID |

---

### POST /api/projects/:projectId/tasks

**Description**: Create a new task card on the board.

**Auth**: Required (project member — owner or team_member)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | UUID | Project ID |

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `title` | string | Yes | 1–500 characters |
| `description` | string | No | Markdown text |
| `columnId` | UUID | Yes | Must belong to the project |
| `priority` | `low` \| `medium` \| `high` \| `urgent` | No | Default: `medium` |
| `dueDate` | string (date) | No | ISO 8601 date |
| `assigneeId` | UUID | No | Must be a project member |
| `labelIds` | UUID[] | No | Array of valid label IDs belonging to the project |
| `position` | integer | No | Position within column; defaults to top (0) |

```json
{
  "title": "Design homepage mockup",
  "description": "Create the initial wireframe and high-fidelity mockup",
  "columnId": "column-uuid",
  "priority": "high",
  "dueDate": "2026-02-20",
  "assigneeId": "user-uuid",
  "labelIds": ["label-uuid-1"],
  "position": 0
}
```

**Success Response** `201 Created`:

```json
{
  "id": "uuid",
  "title": "Design homepage mockup",
  "description": "Create the initial wireframe and high-fidelity mockup",
  "priority": "high",
  "dueDate": "2026-02-20",
  "position": 0,
  "column": { "id": "uuid", "name": "To Do" },
  "assignee": { "id": "uuid", "name": "John Smith", "avatarUrl": "..." },
  "creator": { "id": "uuid", "name": "Jane Doe" },
  "labels": [
    { "id": "uuid", "name": "Design", "color": "#9B59B6" }
  ],
  "subTaskCount": 0,
  "completedSubTaskCount": 0,
  "commentCount": 0,
  "attachmentCount": 0,
  "totalTimeMinutes": 0,
  "createdAt": "2026-02-16T00:00:00.000Z",
  "updatedAt": "2026-02-16T00:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `title is required` | Missing title |
| 400 | `title must be between 1 and 500 characters` | Title too long |
| 400 | `columnId is required` | Missing column |
| 400 | `columnId must belong to this project` | Column not in project |
| 400 | `assigneeId must be a member of this project` | Non-member assignee |
| 400 | `Invalid labelIds` | Label not found or not in project |
| 403 | `You are not a member of this project` | Non-member access |
| 404 | `Project not found` | Invalid project ID |
| 422 | `Column WIP limit reached (3/3). Move a task out first.` | Target column at WIP limit |

**Business Rules**:
- Both `project_owner` and `team_member` roles can create tasks
- `creator_id` is automatically set to the authenticated user
- If `assigneeId` is provided and differs from the creator, a `TASK_ASSIGNED` notification is sent to the assignee
- Existing tasks in the column are shifted down to accommodate the new position
- Activity log entry created: `TASK_CREATED`
- Broadcasts task creation via WebSocket to all connected board viewers

---

### GET /api/projects/:projectId/tasks/:taskId

**Description**: Get full task detail including sub-tasks, time summary, and counts.

**Auth**: Required (project member)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | UUID | Project ID |
| `taskId` | UUID | Task ID |

**Success Response** `200 OK`:

```json
{
  "id": "uuid",
  "title": "Design homepage mockup",
  "description": "Full markdown description...",
  "priority": "high",
  "dueDate": "2026-02-20",
  "position": 0,
  "column": { "id": "uuid", "name": "In Progress" },
  "project": { "id": "uuid", "title": "Website Redesign" },
  "assignee": { "id": "uuid", "name": "John Smith", "avatarUrl": "..." },
  "creator": { "id": "uuid", "name": "Jane Doe", "avatarUrl": "..." },
  "labels": [
    { "id": "uuid", "name": "Design", "color": "#9B59B6" }
  ],
  "subTasks": [
    { "id": "uuid", "title": "Wireframe layout", "isCompleted": true, "position": 0 },
    { "id": "uuid", "title": "Color scheme", "isCompleted": false, "position": 1 }
  ],
  "subTaskCount": 4,
  "completedSubTaskCount": 2,
  "commentCount": 3,
  "attachmentCount": 1,
  "totalTimeMinutes": 120,
  "createdAt": "2026-02-01T00:00:00.000Z",
  "updatedAt": "2026-02-15T00:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 403 | `You are not a member of this project` | Non-member access |
| 404 | `Task not found` | Invalid ID or soft-deleted |

---

### PATCH /api/projects/:projectId/tasks/:taskId

**Description**: Update task details.

**Auth**: Required (project owner — any field; team_member — own tasks only)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | UUID | Project ID |
| `taskId` | UUID | Task ID |

**Request Body** (all fields optional):

| Field | Type | Validation |
|-------|------|------------|
| `title` | string | 1–500 characters |
| `description` | string \| null | Markdown text, or null to clear |
| `priority` | `low` \| `medium` \| `high` \| `urgent` | — |
| `dueDate` | string (date) \| null | ISO 8601 date, or null to clear |
| `assigneeId` | UUID \| null | Must be a project member, or null to unassign |
| `labelIds` | UUID[] | Replaces all existing labels |

```json
{
  "title": "Updated task title",
  "priority": "urgent",
  "assigneeId": "user-uuid",
  "labelIds": ["label-uuid-1", "label-uuid-2"]
}
```

**Success Response** `200 OK`: Updated task object (same shape as GET single task, without `subTasks` array).

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `title must be between 1 and 500 characters` | Invalid title |
| 400 | `assigneeId must be a member of this project` | Non-member assignee |
| 400 | `Invalid labelIds` | Label not found or not in project |
| 403 | `Team members can only edit their own tasks` | Non-owner editing another user's task |
| 404 | `Task not found` | Invalid ID or soft-deleted |

**Business Rules**:
- Team members can only edit tasks where `creator_id` matches their own user ID
- Project owners can edit any task in the project
- If `assigneeId` changes to a different user, a `TASK_ASSIGNED` notification is sent to the new assignee
- `labelIds` is a full replacement — omitting it leaves labels unchanged; sending `[]` removes all labels
- Activity log entry created: `TASK_UPDATED` with `details.changes` containing old/new values
- Broadcasts update via WebSocket

---

### PATCH /api/projects/:projectId/tasks/:taskId/move

**Description**: Move a task to a different column and/or position (drag-and-drop). This is the primary mechanism for changing task status on the Kanban board.

**Auth**: Required (project member — owner or team_member)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | UUID | Project ID |
| `taskId` | UUID | Task ID |

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `columnId` | UUID | Yes | Target column ID |
| `position` | integer | Yes | Target position within the column (0-based) |

```json
{
  "columnId": "done-column-uuid",
  "position": 0
}
```

**Success Response** `200 OK`:

```json
{
  "id": "uuid",
  "title": "Design homepage mockup",
  "column": { "id": "uuid", "name": "Done" },
  "position": 0,
  "updatedAt": "2026-02-16T12:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `columnId is required` | Missing target column |
| 400 | `position is required` | Missing target position |
| 400 | `columnId must belong to this project` | Column not in project |
| 403 | `You are not a member of this project` | Non-member access |
| 404 | `Task not found` | Invalid ID or soft-deleted |
| 422 | `Column WIP limit reached (3/3). Move a task out first.` | Target column at WIP limit |

**Business Rules**:
- Both project owners and team members can move tasks (drag-and-drop)
- WIP limit is enforced: if target column is at capacity, move is rejected — **unless** moving within the same column (reordering)
- Positions of other tasks in the source and target columns are recalculated automatically
- Activity log entry created: `TASK_MOVED` with `details` containing `from_column`, `to_column`, `from_position`, `to_position`
- Broadcasts column updates via WebSocket to all connected board viewers
- If the task has an assignee, a `STATUS_CHANGE` notification is sent to the assignee

---

### DELETE /api/projects/:projectId/tasks/:taskId

**Description**: Soft-delete a task (move to trash). Task remains recoverable for 30 days.

**Auth**: Required (project owner)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | UUID | Project ID |
| `taskId` | UUID | Task ID |

**Success Response** `200 OK`:

```json
{
  "message": "Task moved to trash.",
  "task": {
    "id": "uuid",
    "deletedAt": "2026-02-16T00:00:00.000Z",
    "deletedBy": { "id": "uuid", "name": "Jane Doe" }
  }
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 403 | `Only the project owner can delete tasks` | Non-owner attempting delete |
| 404 | `Task not found` | Invalid ID |
| 422 | `Task is already in trash` | Already soft-deleted |

**Business Rules**:
- Sets `deleted_at = NOW()` and `deleted_by_id = current user`
- Task is excluded from board view and all task listing endpoints
- Task remains in database for 30 days, then permanently deleted by the scheduled trash auto-purge job (daily at 2:00 AM)
- Positions of remaining tasks in the column are recalculated
- Activity log entry created: `TASK_DELETED`
- Broadcasts removal via WebSocket

---

### GET /api/projects/:projectId/tasks/trash

**Description**: List soft-deleted tasks in the project trash.

**Auth**: Required (project owner)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | UUID | Project ID |

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page (max 100) |
| `search` | string | — | Search trashed tasks by title |
| `sortBy` | `deleted_at` \| `title` | `deleted_at` | Sort field |
| `sortOrder` | `asc` \| `desc` | `desc` | Sort direction |

**Success Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Old task",
      "priority": "medium",
      "column": { "id": "uuid", "name": "To Do" },
      "deletedAt": "2026-02-10T00:00:00.000Z",
      "deletedBy": { "id": "uuid", "name": "Jane Doe" },
      "daysUntilPermanentDelete": 24
    }
  ],
  "meta": { "page": 1, "limit": 20, "totalItems": 2, "totalPages": 1 }
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 403 | `Only the project owner can view trash` | Non-owner access |
| 404 | `Project not found` | Invalid project ID |

---

### POST /api/projects/:projectId/tasks/:taskId/restore

**Description**: Restore a soft-deleted task from trash back to the board.

**Auth**: Required (project owner)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | UUID | Project ID |
| `taskId` | UUID | Task ID (must be in trash) |

**Success Response** `200 OK`:

```json
{
  "message": "Task restored successfully.",
  "task": {
    "id": "uuid",
    "title": "Restored task",
    "column": { "id": "uuid", "name": "To Do" },
    "position": 0,
    "restoredAt": "2026-02-16T00:00:00.000Z"
  }
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 403 | `Only the project owner can restore tasks` | Non-owner access |
| 404 | `Task not found in trash` | Task does not exist or is not soft-deleted |

**Business Rules**:
- Task is restored to its original column; if the original column has been deleted, the task is placed in the first column of the project
- `deleted_at` and `deleted_by_id` are set to `NULL`
- Task is positioned at the top of the target column (position 0); existing tasks shift down
- WIP limit is checked on the target column; if at capacity, restore is still allowed (override)
- Activity log entry created: `TASK_RESTORED`
- Broadcasts restoration via WebSocket

---

### DELETE /api/projects/:projectId/tasks/trash/:taskId

**Description**: Permanently delete a task from trash. This action is irreversible.

**Auth**: Required (project OWNER only)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | UUID | Project ID |
| `taskId` | UUID | Task ID (must be in trash) |

**Success Response** `200 OK`:

```json
{
  "message": "Task permanently deleted."
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Only the project owner can permanently delete tasks` | Non-owner access |
| 404 | `Project not found` | Project ID does not exist |
| 404 | `Task not found in trash` | Task does not exist or `deleted_at IS NULL` (not in trash) |

**Business Rules**:

- Task must already be soft-deleted (`deleted_at IS NOT NULL`); active tasks cannot be permanently deleted through this endpoint — use `DELETE /api/projects/:projectId/tasks/:taskId` to soft-delete first
- Hard-deletes the task and all associated data via cascade:
  - `sub_tasks` — cascade deleted
  - `comments` — cascade deleted
  - `attachments` — cascade deleted (S3 files are also removed asynchronously)
  - `time_entries` — cascade deleted
  - `task_labels` — cascade deleted
  - `activity_logs` referencing this task — `task_id` set to `NULL`
  - `notifications` referencing this task — `task_id` set to `NULL`
- This action is not logged in `activity_logs` since the task record itself is destroyed
- The system also runs an automatic trash purge job daily at 2:00 AM UTC that permanently deletes tasks where `deleted_at < NOW() - INTERVAL '30 days'`

---

### GET /api/users/me/tasks

**Description**: List all tasks assigned to the current user across all projects ("My Tasks" view).

**Auth**: Required (project_owner, team_member)

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page (max 100) |
| `search` | string | — | Search by task title |
| `filter` | `all` \| `overdue` \| `due_today` \| `due_this_week` | `all` | Quick date filter |
| `priority` | `low` \| `medium` \| `high` \| `urgent` | — | Filter by priority |
| `projectId` | UUID | — | Filter by specific project |
| `sortBy` | `due_date` \| `priority` \| `project` \| `created_at` | `due_date` | Sort field |
| `sortOrder` | `asc` \| `desc` | `asc` | Sort direction |

**Success Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Design homepage mockup",
      "priority": "high",
      "dueDate": "2026-02-20",
      "isOverdue": false,
      "column": { "id": "uuid", "name": "In Progress" },
      "project": { "id": "uuid", "title": "Website Redesign" },
      "labels": [
        { "id": "uuid", "name": "Design", "color": "#9B59B6" }
      ],
      "subTaskCount": 4,
      "completedSubTaskCount": 2,
      "createdAt": "2026-02-01T00:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "totalItems": 15, "totalPages": 1 }
}
```

**Business Rules**:
- Only returns tasks from projects where the user is an active member
- Excludes soft-deleted tasks
- `isOverdue` is computed: `true` when `due_date < today` and the task is not in the last column (Done)
- `filter=due_today` returns tasks with `due_date = today`
- `filter=due_this_week` returns tasks with `due_date` between today and end of current week (Sunday)
- Sorting by `project` sorts alphabetically by project title

---

## 8. Sub-Tasks

### GET /api/projects/:projectId/tasks/:taskId/subtasks

**Description**: List all subtasks (checklist items) for a task, ordered by position.

**Auth**: Required (project member or ADMIN)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |
| `taskId` | uuid | Task ID |

**Success Response** `200 OK`:

```json
{
  "data": [
    { "id": "uuid", "title": "Research competitors", "isCompleted": true, "position": 0, "createdAt": "2026-02-10T08:00:00.000Z" },
    { "id": "uuid", "title": "Create wireframe", "isCompleted": true, "position": 1, "createdAt": "2026-02-10T08:05:00.000Z" },
    { "id": "uuid", "title": "High-fidelity mockup", "isCompleted": false, "position": 2, "createdAt": "2026-02-11T09:00:00.000Z" },
    { "id": "uuid", "title": "Get stakeholder approval", "isCompleted": false, "position": 3, "createdAt": "2026-02-11T09:05:00.000Z" }
  ],
  "progress": {
    "total": 4,
    "completed": 2,
    "percent": 50.0
  }
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You are not a member of this project` | User not in `project_members` and not admin |
| 404 | `Project not found` | Project ID does not exist |
| 404 | `Task not found` | Task ID does not exist or is soft-deleted |

**Business Rules**:

- Subtasks are ordered by `position` ascending
- `progress.percent` is `(completed / total) * 100`, rounded to one decimal; `0` if no subtasks
- All project members can view subtasks

---

### POST /api/projects/:projectId/tasks/:taskId/subtasks

**Description**: Add a new subtask (checklist item) to a task.

**Auth**: Required (project member)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |
| `taskId` | uuid | Task ID |

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `title` | string | Yes | 1-500 characters |

```json
{
  "title": "Review design with stakeholders"
}
```

**Success Response** `201 Created`:

```json
{
  "id": "uuid",
  "title": "Review design with stakeholders",
  "isCompleted": false,
  "position": 4,
  "createdAt": "2026-02-16T10:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `title is required` | Missing title |
| 400 | `title must be between 1 and 500 characters` | Title too long |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You are not a member of this project` | User not in `project_members` |
| 404 | `Project not found` | Project ID does not exist |
| 404 | `Task not found` | Task ID does not exist or is soft-deleted |
| 422 | `Cannot modify tasks in an archived project` | Project status is `ARCHIVED` |

**Business Rules**:

- Both project owners and team members can add subtasks
- New subtask is appended at the end (highest `position` + 1)
- `isCompleted` defaults to `false`
- An `activity_logs` entry with action `SUB_TASK_ADDED` is created
- WebSocket event `subtask:created` is broadcast to connected project members

---

### PATCH /api/projects/:projectId/tasks/:taskId/subtasks/:subTaskId

**Description**: Update a subtask (title, completion status, or position).

**Auth**: Required (project member)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |
| `taskId` | uuid | Task ID |
| `subTaskId` | uuid | Sub-task ID |

**Request Body** (all fields optional):

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `title` | string | No | 1-500 characters |
| `isCompleted` | boolean | No | `true` or `false` |
| `position` | integer | No | Non-negative integer |

```json
{
  "isCompleted": true
}
```

**Success Response** `200 OK`:

```json
{
  "id": "uuid",
  "title": "Research competitors",
  "isCompleted": true,
  "position": 0,
  "updatedAt": "2026-02-16T10:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `title must be between 1 and 500 characters` | Title empty or too long |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You are not a member of this project` | User not in `project_members` |
| 404 | `Project not found` | Project ID does not exist |
| 404 | `Task not found` | Task ID does not exist or is soft-deleted |
| 404 | `Sub-task not found` | Sub-task ID does not exist or does not belong to this task |
| 422 | `Cannot modify tasks in an archived project` | Project status is `ARCHIVED` |

**Business Rules**:

- Both project owners and team members can update subtasks
- At least one field must be provided
- When `isCompleted` changes to `true`, an `activity_logs` entry with action `SUB_TASK_COMPLETED` is created
- WebSocket event `subtask:updated` is broadcast to connected project members

---

### DELETE /api/projects/:projectId/tasks/:taskId/subtasks/:subTaskId

**Description**: Delete a subtask permanently.

**Auth**: Required (project member)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |
| `taskId` | uuid | Task ID |
| `subTaskId` | uuid | Sub-task ID |

**Success Response** `200 OK`:

```json
{
  "message": "Sub-task deleted."
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You are not a member of this project` | User not in `project_members` |
| 404 | `Project not found` | Project ID does not exist |
| 404 | `Task not found` | Task ID does not exist or is soft-deleted |
| 404 | `Sub-task not found` | Sub-task ID does not exist or does not belong to this task |
| 422 | `Cannot modify tasks in an archived project` | Project status is `ARCHIVED` |

**Business Rules**:

- Both project owners and team members can delete subtasks
- Subtask is hard-deleted (no trash/restore)
- Remaining subtasks' positions are recalculated to be contiguous
- WebSocket event `subtask:deleted` is broadcast to connected project members

---

### PATCH /api/projects/:projectId/tasks/:taskId/subtasks/reorder

**Description**: Reorder subtasks within a task.

**Auth**: Required (project member)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |
| `taskId` | uuid | Task ID |

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `subtasks` | array | Yes | Array of `{ id, position }` objects. Must include ALL subtasks for this task |

```json
{
  "subtasks": [
    { "id": "uuid-1", "position": 0 },
    { "id": "uuid-2", "position": 1 },
    { "id": "uuid-3", "position": 2 }
  ]
}
```

**Success Response** `200 OK`:

```json
{
  "data": [
    { "id": "uuid-1", "title": "First item", "isCompleted": false, "position": 0 },
    { "id": "uuid-2", "title": "Second item", "isCompleted": true, "position": 1 },
    { "id": "uuid-3", "title": "Third item", "isCompleted": false, "position": 2 }
  ]
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `subtasks array is required` | Missing or empty array |
| 400 | `All subtasks must be included in the reorder request` | Count mismatch with actual subtask count |
| 400 | `Positions must be contiguous starting from 0` | Gaps or duplicates in position values |
| 400 | `Invalid sub-task ID: {id}` | Sub-task does not belong to this task |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You are not a member of this project` | User not in `project_members` |
| 404 | `Project not found` | Project ID does not exist |
| 404 | `Task not found` | Task ID does not exist or is soft-deleted |
| 422 | `Cannot modify tasks in an archived project` | Project status is `ARCHIVED` |

**Business Rules**:

- All subtasks for the task must be included; partial reorders are not allowed
- Positions must be a contiguous sequence starting from 0
- The operation is performed in a database transaction to ensure atomicity
- WebSocket event `subtasks:reordered` is broadcast to connected project members

---

## 9. Comments

### GET /api/projects/:projectId/tasks/:taskId/comments

**Description**: List all comments on a task in chronological order, with threaded replies nested by parent_id.

**Auth**: Required (project member or ADMIN)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |
| `taskId` | uuid | Task ID |

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-based, applies to top-level comments only) |
| `limit` | integer | 20 | Items per page (max 100) |

**Success Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "uuid",
      "content": "Great progress on the mockup! @Alice can you review the color palette?",
      "author": {
        "id": "uuid",
        "name": "Jane Doe",
        "avatarUrl": "https://s3.amazonaws.com/taskboard/avatars/uuid.jpg"
      },
      "parentId": null,
      "replies": [
        {
          "id": "uuid",
          "content": "Sure, I'll take a look today!",
          "author": {
            "id": "uuid",
            "name": "Alice Smith",
            "avatarUrl": null
          },
          "parentId": "uuid",
          "replies": [],
          "createdAt": "2026-02-15T15:00:00.000Z",
          "updatedAt": "2026-02-15T15:00:00.000Z"
        }
      ],
      "createdAt": "2026-02-15T14:30:00.000Z",
      "updatedAt": "2026-02-15T14:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 5,
    "totalPages": 1
  }
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You are not a member of this project` | User not in `project_members` and not admin |
| 404 | `Project not found` | Project ID does not exist |
| 404 | `Task not found` | Task ID does not exist or is soft-deleted |

**Business Rules**:

- Top-level comments (`parent_id IS NULL`) are ordered by `created_at` ascending (oldest first)
- Replies are nested within their parent comment, also ordered by `created_at` ascending
- Pagination applies to top-level comments only; all replies for a page's comments are included
- `totalItems` in `meta` counts top-level comments only
- Deleted users' comments are still shown with `author.name` set to `"[Deleted User]"` and `author.avatarUrl` set to `null`

---

### POST /api/projects/:projectId/tasks/:taskId/comments

**Description**: Add a comment to a task. Supports @mentions and threaded replies.

**Auth**: Required (project member)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |
| `taskId` | uuid | Task ID |

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `content` | string | Yes | 1-5000 characters |
| `parentId` | uuid | No | Must be an existing comment ID on the same task (for threaded replies) |

```json
{
  "content": "Great progress! @Alice can you review the color palette?",
  "parentId": null
}
```

**Success Response** `201 Created`:

```json
{
  "id": "uuid",
  "content": "Great progress! @Alice can you review the color palette?",
  "author": {
    "id": "uuid",
    "name": "Jane Doe",
    "avatarUrl": "https://s3.amazonaws.com/taskboard/avatars/uuid.jpg"
  },
  "parentId": null,
  "mentions": [
    { "id": "uuid", "name": "Alice Smith" }
  ],
  "createdAt": "2026-02-16T10:00:00.000Z",
  "updatedAt": "2026-02-16T10:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `content is required` | Missing content |
| 400 | `content must be between 1 and 5000 characters` | Content too long |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You are not a member of this project` | User not in `project_members` |
| 404 | `Project not found` | Project ID does not exist |
| 404 | `Task not found` | Task ID does not exist or is soft-deleted |
| 404 | `Parent comment not found` | `parentId` does not reference a valid comment on this task |
| 422 | `Cannot add comments to tasks in an archived project` | Project status is `ARCHIVED` |

**Business Rules**:

- Both project owners and team members can add comments
- @mentions are detected by parsing `@{username}` patterns in the content; matched users must be project members
- For each valid @mention, a notification of type `COMMENT_MENTION` is created for the mentioned user
- A notification of type `NEW_COMMENT` is created for the task assignee and task creator (if different from the comment author)
- An `activity_logs` entry with action `COMMENT_ADDED` is created with a `details` payload containing `comment_id` and `comment_preview` (first 100 characters)
- WebSocket event `comment:created` is broadcast to connected project members

---

### PATCH /api/projects/:projectId/tasks/:taskId/comments/:commentId

**Description**: Edit an existing comment. Only the original author can edit their own comments.

**Auth**: Required (comment author only)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |
| `taskId` | uuid | Task ID |
| `commentId` | uuid | Comment ID |

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `content` | string | Yes | 1-5000 characters |

```json
{
  "content": "Updated comment: @Alice please also check the typography."
}
```

**Success Response** `200 OK`:

```json
{
  "id": "uuid",
  "content": "Updated comment: @Alice please also check the typography.",
  "author": {
    "id": "uuid",
    "name": "Jane Doe",
    "avatarUrl": "https://s3.amazonaws.com/taskboard/avatars/uuid.jpg"
  },
  "parentId": null,
  "createdAt": "2026-02-15T14:30:00.000Z",
  "updatedAt": "2026-02-16T10:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `content is required` | Missing content |
| 400 | `content must be between 1 and 5000 characters` | Content too long |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You can only edit your own comments` | User is not the comment author |
| 404 | `Project not found` | Project ID does not exist |
| 404 | `Task not found` | Task ID does not exist or is soft-deleted |
| 404 | `Comment not found` | Comment ID does not exist or does not belong to this task |

**Business Rules**:

- Only the original comment author can edit the comment
- New @mentions added during editing trigger new `COMMENT_MENTION` notifications for newly mentioned users
- The `updated_at` timestamp is refreshed; the `created_at` remains unchanged
- WebSocket event `comment:updated` is broadcast to connected project members

---

### DELETE /api/projects/:projectId/tasks/:taskId/comments/:commentId

**Description**: Delete a comment. The comment author or the project owner can delete.

**Auth**: Required (comment author or project OWNER)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |
| `taskId` | uuid | Task ID |
| `commentId` | uuid | Comment ID |

**Success Response** `200 OK`:

```json
{
  "message": "Comment deleted."
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You do not have permission to delete this comment` | User is neither the author nor the project owner |
| 404 | `Project not found` | Project ID does not exist |
| 404 | `Task not found` | Task ID does not exist or is soft-deleted |
| 404 | `Comment not found` | Comment ID does not exist or does not belong to this task |

**Business Rules**:

- Comment author can delete their own comments
- Project owner can delete any comment on tasks in their project
- Deleting a parent comment cascade-deletes all its replies (`ON DELETE CASCADE` on `parent_id` foreign key)
- Comment is hard-deleted (no soft-delete for comments)
- WebSocket event `comment:deleted` is broadcast to connected project members

---

## 10. Attachments

### GET /api/projects/:projectId/tasks/:taskId/attachments

**Description**: List all file attachments on a task.

**Auth**: Required (project member or ADMIN)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |
| `taskId` | uuid | Task ID |

**Success Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "uuid",
      "fileName": "homepage-mockup-v2.png",
      "fileType": "image/png",
      "fileSize": 2458624,
      "uploader": {
        "id": "uuid",
        "name": "Alice Smith",
        "avatarUrl": null
      },
      "createdAt": "2026-02-14T11:00:00.000Z"
    },
    {
      "id": "uuid",
      "fileName": "design-spec.pdf",
      "fileType": "application/pdf",
      "fileSize": 1048576,
      "uploader": {
        "id": "uuid",
        "name": "Jane Doe",
        "avatarUrl": "https://s3.amazonaws.com/taskboard/avatars/uuid.jpg"
      },
      "createdAt": "2026-02-13T09:30:00.000Z"
    }
  ]
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You are not a member of this project` | User not in `project_members` and not admin |
| 404 | `Project not found` | Project ID does not exist |
| 404 | `Task not found` | Task ID does not exist or is soft-deleted |

**Business Rules**:

- Attachments are ordered by `created_at` descending (most recent first)
- `fileSize` is in bytes
- Attachment list is not paginated (task attachment counts are typically small)
- All project members can view attachments

---

### POST /api/projects/:projectId/tasks/:taskId/attachments

**Description**: Upload a file attachment to a task.

**Auth**: Required (project member)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |
| `taskId` | uuid | Task ID |

**Request Body** (`multipart/form-data`):

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `file` | file | Yes | Max 10 MB (10,485,760 bytes). Allowed types: PDF, PNG, JPG, JPEG, DOCX, XLSX |

```
Content-Type: multipart/form-data; boundary=----FormBoundary
------FormBoundary
Content-Disposition: form-data; name="file"; filename="design-spec.pdf"
Content-Type: application/pdf

<binary data>
------FormBoundary--
```

**Success Response** `201 Created`:

```json
{
  "id": "uuid",
  "fileName": "design-spec.pdf",
  "fileType": "application/pdf",
  "fileSize": 1048576,
  "uploader": {
    "id": "uuid",
    "name": "Jane Doe",
    "avatarUrl": "https://s3.amazonaws.com/taskboard/avatars/uuid.jpg"
  },
  "createdAt": "2026-02-16T10:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `file is required` | No file attached |
| 400 | `File type not allowed. Accepted: PDF, PNG, JPG, JPEG, DOCX, XLSX` | Invalid MIME type |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You are not a member of this project` | User not in `project_members` |
| 404 | `Project not found` | Project ID does not exist |
| 404 | `Task not found` | Task ID does not exist or is soft-deleted |
| 413 | `File size exceeds 10 MB limit` | File larger than 10,485,760 bytes |
| 422 | `Cannot add attachments to tasks in an archived project` | Project status is `ARCHIVED` |

**Business Rules**:

- Both project owners and team members can upload attachments
- Allowed MIME types: `application/pdf`, `image/png`, `image/jpeg`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX), `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (XLSX)
- Maximum file size: 10 MB (10,485,760 bytes)
- Files are uploaded to AWS S3 under the path `projects/{projectId}/tasks/{taskId}/{uuid}-{originalFileName}`
- `uploader_id` is set to the current user
- An `activity_logs` entry with action `ATTACHMENT_ADDED` is created
- WebSocket event `attachment:created` is broadcast to connected project members

---

### GET /api/projects/:projectId/attachments/:attachmentId/download

**Description**: Get a download URL for an attachment. Returns a presigned S3 URL.

**Auth**: Required (project member or ADMIN)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |
| `attachmentId` | uuid | Attachment ID |

**Success Response** `200 OK`:

```json
{
  "downloadUrl": "https://s3.amazonaws.com/taskboard/projects/uuid/tasks/uuid/file.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&...",
  "fileName": "design-spec.pdf",
  "fileType": "application/pdf",
  "fileSize": 1048576,
  "expiresIn": 3600
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You are not a member of this project` | User not in `project_members` and not admin |
| 404 | `Project not found` | Project ID does not exist |
| 404 | `Attachment not found` | Attachment ID does not exist |

**Business Rules**:

- Returns a presigned S3 URL that is valid for **1 hour** (3600 seconds)
- The `expiresIn` field indicates the URL validity period in seconds
- The presigned URL allows direct download from S3 without going through the backend
- Download does not require additional authentication (the presigned URL is self-contained)

---

### DELETE /api/projects/:projectId/attachments/:attachmentId

**Description**: Delete a file attachment. The uploader or the project owner can delete.

**Auth**: Required (uploader or project OWNER)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |
| `attachmentId` | uuid | Attachment ID |

**Success Response** `200 OK`:

```json
{
  "message": "Attachment deleted."
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You do not have permission to delete this attachment` | User is neither the uploader nor the project owner |
| 404 | `Project not found` | Project ID does not exist |
| 404 | `Attachment not found` | Attachment ID does not exist |

**Business Rules**:

- The original uploader can delete their own attachments
- The project owner can delete any attachment on tasks in their project
- The file is deleted from both the database (`attachments` table) and AWS S3
- S3 deletion is performed asynchronously; if S3 deletion fails, it is retried via a background job
- An `activity_logs` entry with action `ATTACHMENT_REMOVED` is created
- WebSocket event `attachment:deleted` is broadcast to connected project members

---

## 11. Time Entries

### GET /api/projects/:projectId/tasks/:taskId/time-entries

**Description**: List all time entries for a task, including a total duration summary.

**Auth**: Required (project member or ADMIN)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |
| `taskId` | uuid | Task ID |

**Success Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "uuid",
      "entryType": "timer",
      "durationMinutes": 45,
      "description": "Working on wireframes",
      "startedAt": "2026-02-15T09:00:00.000Z",
      "endedAt": "2026-02-15T09:45:00.000Z",
      "user": {
        "id": "uuid",
        "name": "Alice Smith",
        "avatarUrl": null
      },
      "createdAt": "2026-02-15T09:00:00.000Z"
    },
    {
      "id": "uuid",
      "entryType": "manual",
      "durationMinutes": 60,
      "description": "Research and planning",
      "startedAt": null,
      "endedAt": null,
      "user": {
        "id": "uuid",
        "name": "Jane Doe",
        "avatarUrl": "https://s3.amazonaws.com/taskboard/avatars/uuid.jpg"
      },
      "createdAt": "2026-02-14T16:00:00.000Z"
    }
  ],
  "summary": {
    "totalMinutes": 105,
    "totalFormatted": "1h 45m",
    "byUser": [
      { "userId": "uuid", "name": "Alice Smith", "totalMinutes": 45 },
      { "userId": "uuid", "name": "Jane Doe", "totalMinutes": 60 }
    ]
  }
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You are not a member of this project` | User not in `project_members` and not admin |
| 404 | `Project not found` | Project ID does not exist |
| 404 | `Task not found` | Task ID does not exist or is soft-deleted |

**Business Rules**:

- Time entries are ordered by `created_at` descending (most recent first)
- `summary.totalMinutes` sums only completed entries (excludes active/running timers)
- `summary.totalFormatted` provides a human-readable format (e.g., "1h 45m", "2h 0m", "30m")
- `summary.byUser` breaks down total time per user who has logged time
- Active timers (entries with `started_at` but no `ended_at`) are included in the list with `durationMinutes: 0` and `endedAt: null`

---

### POST /api/projects/:projectId/tasks/:taskId/time-entries

**Description**: Log a manual time entry for a task.

**Auth**: Required (project member)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |
| `taskId` | uuid | Task ID |

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `durationMinutes` | integer | Yes | Positive integer, 1-1440 (max 24 hours) |
| `description` | string | No | Max 500 characters |

```json
{
  "durationMinutes": 60,
  "description": "Research and planning"
}
```

**Success Response** `201 Created`:

```json
{
  "id": "uuid",
  "entryType": "manual",
  "durationMinutes": 60,
  "description": "Research and planning",
  "startedAt": null,
  "endedAt": null,
  "user": {
    "id": "uuid",
    "name": "Jane Doe",
    "avatarUrl": "https://s3.amazonaws.com/taskboard/avatars/uuid.jpg"
  },
  "createdAt": "2026-02-16T10:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `durationMinutes is required` | Missing duration |
| 400 | `durationMinutes must be between 1 and 1440` | Zero, negative, or exceeds 24 hours |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You are not a member of this project` | User not in `project_members` |
| 404 | `Project not found` | Project ID does not exist |
| 404 | `Task not found` | Task ID does not exist or is soft-deleted |
| 422 | `Cannot log time on tasks in an archived project` | Project status is `ARCHIVED` |

**Business Rules**:

- Both project owners and team members can log manual time
- `entry_type` is set to `MANUAL`
- `started_at` and `ended_at` are both `NULL` for manual entries
- `user_id` is set to the current user
- An `activity_logs` entry with action `TIME_LOGGED` is created
- WebSocket event `time-entry:created` is broadcast to connected project members

---

### POST /api/projects/:projectId/tasks/:taskId/time-entries/start

**Description**: Start a time tracking timer on a task.

**Auth**: Required (project member)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |
| `taskId` | uuid | Task ID |

**Request Body**: None

**Success Response** `201 Created`:

```json
{
  "id": "uuid",
  "entryType": "timer",
  "durationMinutes": 0,
  "startedAt": "2026-02-16T10:00:00.000Z",
  "endedAt": null,
  "user": {
    "id": "uuid",
    "name": "Jane Doe",
    "avatarUrl": "https://s3.amazonaws.com/taskboard/avatars/uuid.jpg"
  },
  "createdAt": "2026-02-16T10:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You are not a member of this project` | User not in `project_members` |
| 404 | `Project not found` | Project ID does not exist |
| 404 | `Task not found` | Task ID does not exist or is soft-deleted |
| 409 | `You already have an active timer. Stop it before starting a new one.` | User has a running timer on any task across all projects |
| 422 | `Cannot start timer on tasks in an archived project` | Project status is `ARCHIVED` |

**Business Rules**:

- Only one active timer per user across all tasks and all projects
- `entry_type` is set to `TIMER`
- `started_at` is set to the current server timestamp
- `ended_at` is `NULL` (indicates running)
- `duration_minutes` is `0` until the timer is stopped
- If the user already has an active timer on another task (in any project), the request is rejected with 409
- WebSocket event `timer:started` is broadcast to connected project members

---

### POST /api/time-entries/:timeEntryId/stop

**Description**: Stop a running timer and calculate the duration.

**Auth**: Required (timer owner only)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `timeEntryId` | uuid | Time entry ID |

**Request Body**: None

**Success Response** `200 OK`:

```json
{
  "id": "uuid",
  "entryType": "timer",
  "durationMinutes": 45,
  "startedAt": "2026-02-16T09:00:00.000Z",
  "endedAt": "2026-02-16T09:45:00.000Z",
  "user": {
    "id": "uuid",
    "name": "Jane Doe",
    "avatarUrl": "https://s3.amazonaws.com/taskboard/avatars/uuid.jpg"
  },
  "createdAt": "2026-02-16T09:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You can only stop your own timer` | User is not the timer owner |
| 404 | `Time entry not found` | Time entry ID does not exist |
| 422 | `Timer is not running` | Time entry already has `ended_at` set (already stopped) |

**Business Rules**:

- Only the user who started the timer can stop it
- `ended_at` is set to the current server timestamp
- `duration_minutes` is calculated as `ROUND((ended_at - started_at) / 60)` in minutes
- Minimum recorded duration is 1 minute; if less than 1 minute has elapsed, `duration_minutes` is set to 1
- An `activity_logs` entry with action `TIME_LOGGED` is created
- WebSocket event `timer:stopped` is broadcast to connected project members

---

### PATCH /api/time-entries/:timeEntryId

**Description**: Update a manual time entry's description or duration. Cannot update timer-based entries that are still running.

**Auth**: Required (entry owner only)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `timeEntryId` | uuid | Time entry ID |

**Request Body** (all fields optional):

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `description` | string \| null | No | Max 500 characters, or `null` to clear |
| `durationMinutes` | integer | No | 1-1440 (1 minute to 24 hours) |
| `startedAt` | string (ISO 8601) | No | Must be in the past |

```json
{
  "description": "Updated description of work done",
  "durationMinutes": 90
}
```

**Success Response** `200 OK`:

```json
{
  "id": "uuid",
  "userId": "uuid",
  "description": "Updated description of work done",
  "durationMinutes": 90,
  "startedAt": "2026-02-16T09:00:00.000Z",
  "endedAt": "2026-02-16T10:30:00.000Z",
  "isRunning": false,
  "updatedAt": "2026-02-16T15:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `durationMinutes must be between 1 and 1440` | Duration out of range |
| 400 | `description must not exceed 500 characters` | Description too long |
| 400 | `startedAt must be in the past` | Future date provided |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You can only edit your own time entries` | User is not the entry owner |
| 404 | `Time entry not found` | Time entry ID does not exist |
| 422 | `Cannot edit a running timer. Stop it first.` | Time entry has `started_at` but no `ended_at` |

**Business Rules**:

- Only the user who created the time entry can edit it (project owners cannot edit other users' entries, only delete them)
- Timer-based entries that are still running (`ended_at IS NULL`) cannot be edited — stop the timer first
- If `durationMinutes` is updated, `ended_at` is recalculated as `started_at + durationMinutes`
- If `startedAt` is updated, `ended_at` is recalculated as `startedAt + durationMinutes`
- At least one field must be provided; an empty body returns 400

---

### DELETE /api/time-entries/:timeEntryId

**Description**: Delete a time entry. The entry owner or the project owner can delete.

**Auth**: Required (entry owner or project OWNER)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `timeEntryId` | uuid | Time entry ID |

**Success Response** `200 OK`:

```json
{
  "message": "Time entry deleted."
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You do not have permission to delete this time entry` | User is neither the entry owner nor the project owner |
| 404 | `Time entry not found` | Time entry ID does not exist |

**Business Rules**:

- The user who created the time entry can delete it
- The project owner can delete any time entry on tasks in their project
- If the time entry has an active timer (no `ended_at`), the timer is stopped and the entry is deleted
- Time entry is hard-deleted (no trash/restore)
- WebSocket event `time-entry:deleted` is broadcast to connected project members

---

## 12. Labels

### GET /api/projects/:projectId/labels

**Description**: List all labels available for a project, including project-scoped labels and system-wide defaults.

**Auth**: Required (project member or ADMIN)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |

**Success Response** `200 OK`:

```json
{
  "data": [
    { "id": "uuid", "name": "Bug", "color": "#E74C3C", "isDefault": true, "taskCount": 5 },
    { "id": "uuid", "name": "Feature", "color": "#3498DB", "isDefault": true, "taskCount": 8 },
    { "id": "uuid", "name": "Design", "color": "#9B59B6", "isDefault": true, "taskCount": 3 },
    { "id": "uuid", "name": "Documentation", "color": "#F39C12", "isDefault": true, "taskCount": 1 },
    { "id": "uuid", "name": "Improvement", "color": "#2ECC71", "isDefault": true, "taskCount": 4 },
    { "id": "uuid", "name": "Urgent Fix", "color": "#C0392B", "isDefault": false, "taskCount": 2 }
  ]
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You are not a member of this project` | User not in `project_members` and not admin |
| 404 | `Project not found` | ID does not exist or is soft-deleted |

**Business Rules**:

- Returns labels where `project_id` equals the current project (project-scoped labels copied from system defaults at creation, plus user-created labels)
- `isDefault` is `true` for labels that were seeded from system defaults when the project was created
- `taskCount` is the number of non-deleted tasks tagged with this label (via `task_labels` join table)
- Labels are ordered alphabetically by `name`
- All project members can view labels

---

### POST /api/projects/:projectId/labels

**Description**: Create a new label for the project.

**Auth**: Required (project OWNER only)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | Yes | 1-100 characters |
| `color` | string | Yes | Valid hex color code (e.g., `#FF5733`), exactly 7 characters including `#` |

```json
{
  "name": "Urgent Fix",
  "color": "#C0392B"
}
```

**Success Response** `201 Created`:

```json
{
  "id": "uuid",
  "name": "Urgent Fix",
  "color": "#C0392B",
  "isDefault": false,
  "taskCount": 0,
  "createdAt": "2026-02-16T10:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `name is required` | Missing name |
| 400 | `name must be between 1 and 100 characters` | Name too long |
| 400 | `color is required` | Missing color |
| 400 | `color must be a valid hex color code (e.g., #FF5733)` | Invalid hex format |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Only the project owner can manage labels` | User is not project owner |
| 404 | `Project not found` | ID does not exist |
| 409 | `A label with this name already exists in this project` | Duplicate `name` within the project (violates `UQ_labels_project_name`) |
| 422 | `Maximum of 20 labels per project` | Label count would exceed 20 |

**Business Rules**:

- Only the project owner can create labels
- Maximum 20 labels per project (including default labels seeded at creation)
- Label names must be unique within a project (case-sensitive match)
- `color` must be a valid 7-character hex code including the `#` prefix (e.g., `#FF5733`)
- `isDefault` is set to `false` for user-created labels

---

### PATCH /api/projects/:projectId/labels/:labelId

**Description**: Update a label's name or color.

**Auth**: Required (project OWNER only)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |
| `labelId` | uuid | Label ID |

**Request Body** (all fields optional):

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | No | 1-100 characters |
| `color` | string | No | Valid hex color code (e.g., `#FF5733`) |

```json
{
  "name": "Critical Bug",
  "color": "#E74C3C"
}
```

**Success Response** `200 OK`:

```json
{
  "id": "uuid",
  "name": "Critical Bug",
  "color": "#E74C3C",
  "isDefault": false,
  "taskCount": 2,
  "updatedAt": "2026-02-16T15:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `name must be between 1 and 100 characters` | Name empty or too long |
| 400 | `color must be a valid hex color code (e.g., #FF5733)` | Invalid hex format |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Only the project owner can manage labels` | User is not project owner |
| 404 | `Project not found` | Project ID does not exist |
| 404 | `Label not found` | Label ID does not exist or does not belong to this project |
| 409 | `A label with this name already exists in this project` | Duplicate name within project |

**Business Rules**:

- At least one field must be provided
- Name uniqueness is enforced within the project
- Renaming a label updates it everywhere; all `task_labels` associations remain intact
- Both default and user-created labels can be updated

---

### DELETE /api/projects/:projectId/labels/:labelId

**Description**: Delete a label and remove it from all tasks.

**Auth**: Required (project OWNER only)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |
| `labelId` | uuid | Label ID |

**Success Response** `200 OK`:

```json
{
  "message": "Label deleted.",
  "tasksAffected": 5
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Only the project owner can manage labels` | User is not project owner |
| 404 | `Project not found` | Project ID does not exist |
| 404 | `Label not found` | Label ID does not exist or does not belong to this project |

**Business Rules**:

- Deleting a label removes all associated `task_labels` records (`ON DELETE CASCADE`)
- `tasksAffected` indicates how many tasks had this label removed
- Both default and user-created labels can be deleted
- The label is hard-deleted (no soft-delete)
- Tasks that had this label are not otherwise affected; they remain on the board with the label simply removed

---

## 13. Notifications

### GET /api/notifications

**Description**: List the current user's notifications with pagination and filtering.

**Auth**: Required (any role)

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-based) |
| `limit` | integer | 20 | Items per page (max 100) |
| `type` | string | — | Filter by type: `task_assigned`, `due_reminder`, `status_change`, `comment_mention`, `new_comment`, `invitation` |
| `isRead` | boolean | — | Filter by read status: `true` or `false` |

**Example**: `GET /api/notifications?type=task_assigned&isRead=false&page=1&limit=10`

**Success Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "task_assigned",
      "title": "New Task Assigned",
      "message": "Jane Doe assigned you to 'Design homepage mockup' in Website Redesign.",
      "isRead": false,
      "task": {
        "id": "uuid",
        "title": "Design homepage mockup"
      },
      "project": {
        "id": "uuid",
        "title": "Website Redesign"
      },
      "createdAt": "2026-02-16T10:00:00.000Z"
    },
    {
      "id": "uuid",
      "type": "due_reminder",
      "title": "Task Due Tomorrow",
      "message": "'Create wireframes' in Website Redesign is due tomorrow.",
      "isRead": false,
      "task": {
        "id": "uuid",
        "title": "Create wireframes"
      },
      "project": {
        "id": "uuid",
        "title": "Website Redesign"
      },
      "createdAt": "2026-02-15T08:00:00.000Z"
    },
    {
      "id": "uuid",
      "type": "comment_mention",
      "title": "You were mentioned",
      "message": "Jane Doe mentioned you in a comment on 'Design homepage mockup'.",
      "isRead": true,
      "task": {
        "id": "uuid",
        "title": "Design homepage mockup"
      },
      "project": {
        "id": "uuid",
        "title": "Website Redesign"
      },
      "createdAt": "2026-02-14T14:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 25,
    "totalPages": 3
  },
  "unreadCount": 12
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `type must be one of: task_assigned, due_reminder, status_change, comment_mention, new_comment, invitation` | Invalid type filter |
| 401 | `Unauthorized` | Missing or invalid access token |

**Business Rules**:

- Returns only notifications belonging to the current user (`user_id = current user`)
- Notifications are ordered by `created_at` descending (most recent first)
- `unreadCount` is the total number of unread notifications across all pages (not just the current page)
- `task` and `project` may be `null` if the referenced entity has been deleted
- Notifications are not soft-deleted; they are permanently removed via the DELETE endpoint
- Notifications older than 90 days may be automatically cleaned up by a scheduled background job

---

### PATCH /api/notifications/:notificationId/read

**Description**: Mark a single notification as read.

**Auth**: Required (notification owner only)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `notificationId` | uuid | Notification ID |

**Success Response** `200 OK`:

```json
{
  "id": "uuid",
  "isRead": true,
  "readAt": "2026-02-16T10:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You can only manage your own notifications` | Notification belongs to a different user |
| 404 | `Notification not found` | ID does not exist |

**Business Rules**:

- Sets `notifications.is_read` to `true`
- If the notification is already read, the request is idempotent (returns 200 without error)
- `readAt` is a computed timestamp reflecting when the notification was marked as read

---

### POST /api/notifications/read-all

**Description**: Mark all of the current user's unread notifications as read.

**Auth**: Required (any role)

**Request Body**: None

**Success Response** `200 OK`:

```json
{
  "message": "All notifications marked as read.",
  "updatedCount": 12
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |

**Business Rules**:

- Updates all notifications where `user_id = current user` AND `is_read = false`
- `updatedCount` reflects the number of notifications that were actually changed from unread to read
- If all notifications are already read, `updatedCount` is `0` and no error is returned

---

### DELETE /api/notifications/:notificationId

**Description**: Dismiss and permanently delete a notification.

**Auth**: Required (notification owner only)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `notificationId` | uuid | Notification ID |

**Success Response** `200 OK`:

```json
{
  "message": "Notification deleted."
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `You can only manage your own notifications` | Notification belongs to a different user |
| 404 | `Notification not found` | ID does not exist |

**Business Rules**:

- Notification is hard-deleted (no trash/restore)
- Only the notification recipient can delete their own notifications
- Deleting a notification does not affect the underlying entity (task, project, comment, etc.)

---

## 14. Activity Logs

### GET /api/projects/:projectId/activity

**Description**: Get the activity feed for a project, showing all tracked actions in reverse chronological order.

**Auth**: Required (project member — any role)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-based) |
| `limit` | integer | 20 | Items per page (max 100) |
| `action` | string | — | Filter by action type (one of `activity_action` enum values, e.g., `TASK_CREATED`, `TASK_MOVED`) |
| `userId` | uuid | — | Filter by user who performed the action |
| `taskId` | uuid | — | Filter by task ID — returns only activity related to a specific task (used for Task Detail activity log) |

**Example**: `GET /api/projects/uuid/activity?page=1&limit=25&action=TASK_MOVED&userId=uuid`
**Example (task-level)**: `GET /api/projects/uuid/activity?taskId=uuid&page=1&limit=10`

**Success Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "uuid",
      "action": "TASK_MOVED",
      "user": {
        "id": "uuid",
        "name": "Jane Doe",
        "avatarUrl": "https://s3.amazonaws.com/taskboard/avatars/uuid.jpg"
      },
      "taskId": "uuid",
      "taskTitle": "Design homepage mockup",
      "details": {
        "from_column": "To Do",
        "to_column": "In Progress",
        "from_position": 2,
        "to_position": 0
      },
      "createdAt": "2026-02-16T14:30:00.000Z"
    },
    {
      "id": "uuid",
      "action": "COMMENT_ADDED",
      "user": {
        "id": "uuid",
        "name": "John Smith",
        "avatarUrl": null
      },
      "taskId": "uuid",
      "taskTitle": "Fix navigation bug",
      "details": {
        "comment_id": "uuid",
        "comment_preview": "I think we should approach this differently..."
      },
      "createdAt": "2026-02-16T14:22:00.000Z"
    },
    {
      "id": "uuid",
      "action": "MEMBER_ADDED",
      "user": {
        "id": "uuid",
        "name": "Jane Doe",
        "avatarUrl": "https://s3.amazonaws.com/taskboard/avatars/uuid.jpg"
      },
      "taskId": null,
      "taskTitle": null,
      "details": {
        "member_name": "Alice Williams",
        "member_email": "alice@example.com"
      },
      "createdAt": "2026-02-16T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 25,
    "totalItems": 312,
    "totalPages": 13
  }
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `Invalid action filter` | Unrecognized action type value |
| 400 | `Invalid userId format` | Malformed UUID |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | User is not a member of the project |
| 404 | `Project not found` | Project ID does not exist |

**Business Rules**:

- Results are always sorted by `created_at DESC` (most recent first)
- The `action` filter accepts any value from the `activity_action` enum: `TASK_CREATED`, `TASK_UPDATED`, `TASK_MOVED`, `TASK_DELETED`, `TASK_RESTORED`, `COMMENT_ADDED`, `ATTACHMENT_ADDED`, `ATTACHMENT_REMOVED`, `MEMBER_ADDED`, `MEMBER_REMOVED`, `COLUMN_CREATED`, `COLUMN_UPDATED`, `COLUMN_DELETED`, `PROJECT_UPDATED`, `PROJECT_ARCHIVED`, `SUB_TASK_ADDED`, `SUB_TASK_COMPLETED`, `TIME_LOGGED`
- `taskId` and `taskTitle` are `null` for non-task actions (e.g., `MEMBER_ADDED`, `COLUMN_CREATED`, `PROJECT_UPDATED`)
- `taskTitle` is resolved at query time; if the task has been hard-deleted (after 30-day trash purge), it returns `null`
- `user` object is always populated; if the user has been soft-deleted, their name and avatar at the time of deletion are still shown
- `details` is the raw JSONB payload from `activity_logs.details` — structure varies by action type (see DATABASE docs section 4.13)
- Activity logs are append-only and never modified or deleted
- Only project members can view the activity feed; non-members receive 403

---

## 15. Admin — Dashboard

> All endpoints in this section require **Admin** role authentication.
> Non-admin users receive `403 Forbidden`.

### GET /api/admin/dashboard/stats

**Description**: Get summary statistics for the admin dashboard overview cards.

**Auth**: Required (ADMIN only)

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | string | `7d` | One of: `today`, `7d`, `30d`, `custom` |
| `dateFrom` | string (ISO date) | — | Required when `period=custom`. Start date (inclusive) |
| `dateTo` | string (ISO date) | — | Required when `period=custom`. End date (inclusive) |

**Example**: `GET /api/admin/dashboard/stats?period=30d`

**Success Response** `200 OK`:

```json
{
  "totalUsers": 142,
  "totalProjects": 38,
  "totalTasks": 1247,
  "activeUsersToday": 23,
  "period": {
    "type": "30d",
    "from": "2026-01-17",
    "to": "2026-02-16"
  }
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `period must be one of: today, 7d, 30d, custom` | Invalid period value |
| 400 | `dateFrom and dateTo are required when period is custom` | Missing date range for custom period |
| 400 | `dateFrom must be before dateTo` | Invalid date range |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |

**Business Rules**:

- `totalUsers` counts all users with `status != DELETED` (includes suspended users)
- `totalProjects` counts all projects with `status != ARCHIVED` and `deleted_at IS NULL`
- `totalTasks` counts all tasks with `deleted_at IS NULL` across all projects
- `activeUsersToday` counts users with `last_active_at >= start of today (UTC)`
- The `period` filter applies to `activeUsersToday` calculation (e.g., `7d` counts unique active users in the last 7 days)
- `totalUsers`, `totalProjects`, and `totalTasks` are always current totals regardless of the period filter
- `today` uses UTC midnight as the boundary

---

### GET /api/admin/dashboard/charts

**Description**: Get chart data for the admin dashboard visualizations.

**Auth**: Required (ADMIN only)

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | string | `30d` | One of: `today`, `7d`, `30d`, `custom` |
| `dateFrom` | string (ISO date) | — | Required when `period=custom`. Start date (inclusive) |
| `dateTo` | string (ISO date) | — | Required when `period=custom`. End date (inclusive) |

**Example**: `GET /api/admin/dashboard/charts?period=30d`

**Success Response** `200 OK`:

```json
{
  "userRegistrationTrend": [
    { "date": "2026-01-17", "count": 3 },
    { "date": "2026-01-18", "count": 1 },
    { "date": "2026-01-19", "count": 0 },
    { "date": "2026-01-20", "count": 5 }
  ],
  "projectCreationTrend": [
    { "date": "2026-01-17", "count": 1 },
    { "date": "2026-01-18", "count": 0 },
    { "date": "2026-01-19", "count": 2 },
    { "date": "2026-01-20", "count": 0 }
  ],
  "taskCompletionRate": [
    { "date": "2026-01-17", "completed": 12, "total": 45, "rate": 26.67 },
    { "date": "2026-01-18", "completed": 15, "total": 48, "rate": 31.25 },
    { "date": "2026-01-19", "completed": 18, "total": 50, "rate": 36.00 },
    { "date": "2026-01-20", "completed": 20, "total": 52, "rate": 38.46 }
  ],
  "top5ActiveProjects": [
    {
      "projectId": "uuid",
      "title": "Website Redesign",
      "taskCount": 45,
      "completedCount": 28,
      "activityCount": 132
    },
    {
      "projectId": "uuid",
      "title": "Mobile App v2",
      "taskCount": 38,
      "completedCount": 15,
      "activityCount": 98
    }
  ],
  "period": {
    "type": "30d",
    "from": "2026-01-17",
    "to": "2026-02-16"
  }
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `period must be one of: today, 7d, 30d, custom` | Invalid period value |
| 400 | `dateFrom and dateTo are required when period is custom` | Missing date range for custom period |
| 400 | `dateFrom must be before dateTo` | Invalid date range |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |

**Business Rules**:

- `userRegistrationTrend` returns one data point per day within the period; `count` is the number of new users registered on that date (based on `users.created_at`)
- `projectCreationTrend` returns one data point per day; `count` is projects created on that date (based on `projects.created_at`)
- `taskCompletionRate` returns one data point per day; `completed` is cumulative count of tasks in the last (rightmost) column of their boards, `total` is cumulative total tasks, `rate` is `(completed / total) * 100` rounded to 2 decimal places
- `top5ActiveProjects` ranks projects by `activityCount` (number of `activity_logs` entries) within the period, limited to 5 results
- For `today` period, a single data point is returned for trend arrays
- For `7d` and `30d` periods, one data point per day is returned for each day in the range (including days with zero counts)
- Soft-deleted entities (tasks, projects, users) are excluded from all counts

---

### GET /api/admin/dashboard/recent-activity

**Description**: Get the latest activity events across all projects for the admin dashboard.

**Auth**: Required (ADMIN only)

**Success Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "uuid",
      "action": "TASK_CREATED",
      "user": {
        "id": "uuid",
        "name": "Jane Doe",
        "avatarUrl": "https://s3.amazonaws.com/taskboard/avatars/uuid.jpg"
      },
      "project": {
        "id": "uuid",
        "title": "Website Redesign"
      },
      "taskId": "uuid",
      "taskTitle": "Design new landing page",
      "details": {
        "column": "To Do",
        "priority": "HIGH"
      },
      "createdAt": "2026-02-16T15:30:00.000Z"
    },
    {
      "id": "uuid",
      "action": "MEMBER_ADDED",
      "user": {
        "id": "uuid",
        "name": "John Smith",
        "avatarUrl": null
      },
      "project": {
        "id": "uuid",
        "title": "Mobile App v2"
      },
      "taskId": null,
      "taskTitle": null,
      "details": {
        "member_name": "Alice Williams",
        "member_email": "alice@example.com"
      },
      "createdAt": "2026-02-16T15:22:00.000Z"
    }
  ]
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |

**Business Rules**:

- Returns the latest **10** activity events across all projects, sorted by `created_at DESC`
- Not paginated — always returns exactly up to 10 items
- Includes the `project` object with `id` and `title` so the admin can identify which project the activity belongs to
- Covers all action types from the `activity_action` enum
- Soft-deleted projects are excluded; activities from archived projects are included

---

## 16. Admin — User Management

> All endpoints in this section require **Admin** role authentication.
> Non-admin users receive `403 Forbidden`.
>
> **Note**: These endpoints are documented in [Section 3](#3-admin--user-management) with full request/response details.
> This section provides the section number reference for the Table of Contents. The endpoints are:
>
> - `GET /api/admin/users` — List all users
> - `POST /api/admin/users` — Create user
> - `GET /api/admin/users/:userId` — User detail
> - `PATCH /api/admin/users/:userId` — Update user
> - `PATCH /api/admin/users/:userId/status` — Change user status
> - `PATCH /api/admin/users/:userId/role` — Change user role
> - `POST /api/admin/users/:userId/reset-password` — Admin-initiated password reset
> - `DELETE /api/admin/users/:userId` — Delete user
> - `POST /api/admin/users/bulk` — Bulk actions
> - `GET /api/admin/users/export` — Export users as CSV
>
> See [Section 3](#3-admin--user-management) for complete documentation.

---

## 17. Admin — Project Management

> All endpoints in this section require **Admin** role authentication.
> Non-admin users receive `403 Forbidden`.

### GET /api/admin/projects

**Description**: List all projects with search, filtering, sorting, and pagination.

**Auth**: Required (ADMIN only)

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-based) |
| `limit` | integer | 20 | Items per page (10, 25, 50, 100) |
| `search` | string | — | Search by project name or owner name (case-insensitive partial match) |
| `status` | string | — | Filter by status: `active`, `completed`, `archived` |
| `dateFrom` | string (ISO date) | — | Creation date from (inclusive) |
| `dateTo` | string (ISO date) | — | Creation date to (inclusive) |
| `membersMin` | integer | — | Minimum member count (inclusive) |
| `membersMax` | integer | — | Maximum member count (inclusive) |
| `sortBy` | string | `created_at` | One of: `title`, `owner_name`, `status`, `members_count`, `tasks_count`, `completion_percent`, `created_at`, `deadline` |
| `sortOrder` | `asc` \| `desc` | `desc` | Sort direction |

**Example**: `GET /api/admin/projects?search=website&status=active&membersMin=3&page=1&limit=25&sortBy=created_at&sortOrder=desc`

**Success Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Website Redesign",
      "owner": {
        "id": "uuid",
        "name": "Jane Doe",
        "email": "jane@example.com"
      },
      "status": "active",
      "membersCount": 8,
      "tasksCount": 45,
      "completionPercent": 62.22,
      "createdAt": "2026-01-15T08:30:00.000Z",
      "deadline": "2026-03-31"
    },
    {
      "id": "uuid",
      "title": "Mobile App v2",
      "owner": {
        "id": "uuid",
        "name": "John Smith",
        "email": "john@example.com"
      },
      "status": "active",
      "membersCount": 5,
      "tasksCount": 38,
      "completionPercent": 39.47,
      "createdAt": "2026-01-20T10:00:00.000Z",
      "deadline": "2026-04-15"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 25,
    "totalItems": 38,
    "totalPages": 2
  }
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `Invalid status filter` | Unrecognized status value |
| 400 | `Invalid sortBy field` | Column not in allowed list |
| 400 | `membersMin must be a non-negative integer` | Invalid member count filter |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |

**Business Rules**:

- `search` matches against both `projects.title` and `users.full_name` (owner) using case-insensitive `ILIKE %term%`
- `membersCount` is computed from `project_members` table (count of members including owner)
- `tasksCount` counts non-deleted tasks (`tasks.deleted_at IS NULL`) in the project
- `completionPercent` is calculated as `(tasks in last column / total non-deleted tasks) * 100`, rounded to 2 decimal places; returns `0.00` if there are no tasks
- `deadline` is `null` if no deadline was set on the project
- Soft-deleted projects (`deleted_at IS NOT NULL`) are excluded unless explicitly queried; default listing shows non-deleted projects
- `owner` object includes the owner's `id`, `name`, and `email` for quick identification

---

### GET /api/admin/projects/:projectId

**Description**: Get detailed information about a specific project, including members, task summary, and recent activity.

**Auth**: Required (ADMIN only)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |

**Success Response** `200 OK`:

```json
{
  "id": "uuid",
  "title": "Website Redesign",
  "description": "Complete redesign of the company website with new branding.",
  "status": "active",
  "template": "DEFAULT",
  "deadline": "2026-03-31",
  "createdAt": "2026-01-15T08:30:00.000Z",
  "updatedAt": "2026-02-10T12:00:00.000Z",
  "owner": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "avatarUrl": "https://s3.amazonaws.com/taskboard/avatars/uuid.jpg"
  },
  "members": [
    {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "avatarUrl": "https://s3.amazonaws.com/taskboard/avatars/uuid.jpg",
      "projectRole": "owner",
      "joinedAt": "2026-01-15T08:30:00.000Z"
    },
    {
      "id": "uuid",
      "name": "John Smith",
      "email": "john@example.com",
      "avatarUrl": null,
      "projectRole": "member",
      "joinedAt": "2026-01-16T10:00:00.000Z"
    }
  ],
  "taskSummary": {
    "total": 45,
    "byStatus": [
      { "column": "To Do", "count": 10 },
      { "column": "In Progress", "count": 15 },
      { "column": "Review", "count": 8 },
      { "column": "Done", "count": 12 }
    ],
    "overdueCount": 3
  },
  "recentActivity": [
    {
      "id": "uuid",
      "action": "TASK_MOVED",
      "user": {
        "id": "uuid",
        "name": "John Smith"
      },
      "taskTitle": "Design homepage mockup",
      "details": {
        "from_column": "In Progress",
        "to_column": "Review"
      },
      "createdAt": "2026-02-16T14:30:00.000Z"
    }
  ]
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |
| 404 | `Project not found` | Project ID does not exist |

**Business Rules**:

- `members` includes all members from `project_members` with their project-level role
- `taskSummary.byStatus` lists each column in the project with a count of non-deleted tasks in that column, ordered by column `position`
- `taskSummary.overdueCount` counts non-deleted tasks with `due_date < today` that are NOT in the last (rightmost) column (i.e., not "Done")
- `recentActivity` returns the latest 5 activity log entries for this project, sorted by `created_at DESC`
- Soft-deleted projects are accessible via this endpoint (admin may need to review)
- Archived projects are also accessible with `status: "archived"`

---

### POST /api/admin/projects/:projectId/archive

**Description**: Archive a project. Archived projects are hidden from default listings but data is preserved.

**Auth**: Required (ADMIN only)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |

**Request Body**: None

**Success Response** `200 OK`:

```json
{
  "id": "uuid",
  "title": "Website Redesign",
  "status": "archived",
  "updatedAt": "2026-02-16T16:00:00.000Z",
  "message": "Project archived successfully."
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |
| 404 | `Project not found` | Project ID does not exist |
| 422 | `Project is already archived` | `status` is already `ARCHIVED` |

**Business Rules**:

- Sets `projects.status` to `ARCHIVED`
- All tasks, columns, members, and data within the project are preserved
- Archived projects no longer appear in the project owner's or members' default project list (filtered by `status = ACTIVE`)
- An `activity_log` entry with action `PROJECT_ARCHIVED` is created
- Members are notified via the notification system

---

### DELETE /api/admin/projects/:projectId

**Description**: Permanently delete a project and all associated data.

**Auth**: Required (ADMIN only)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |

**Request Body**: None

**Success Response** `200 OK`:

```json
{
  "message": "Project deleted permanently."
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |
| 404 | `Project not found` | Project ID does not exist |

**Business Rules**:

- Soft-deletes the project: sets `projects.deleted_at` to now
- All associated data is cascade-deleted or orphaned per foreign key constraints:
  - `columns` — cascade deleted
  - `tasks` — cascade deleted (along with their sub-tasks, comments, attachments, time entries, task labels)
  - `project_members` — cascade deleted
  - `labels` (project-scoped) — cascade deleted
  - `invitations` — cascade deleted
  - `activity_logs` — cascade deleted
  - `notifications` referencing this project — `project_id` set to `NULL`
- This is a destructive action; admin should archive first if data preservation is needed
- No confirmation step in the API — the frontend should present a confirmation dialog before calling

---

### POST /api/admin/projects/bulk

**Description**: Perform bulk actions on multiple projects.

**Auth**: Required (ADMIN only)

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `projectIds` | string[] | Yes | Array of project UUIDs, 1-100 items |
| `action` | string | Yes | One of: `archive`, `delete` |

```json
{
  "projectIds": ["uuid-1", "uuid-2", "uuid-3"],
  "action": "archive"
}
```

**Success Response** `200 OK`:

```json
{
  "message": "Bulk action completed.",
  "results": {
    "success": 2,
    "failed": 1,
    "errors": [
      {
        "projectId": "uuid-3",
        "message": "Project is already archived"
      }
    ]
  }
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `projectIds must contain 1 to 100 items` | Empty array or exceeds limit |
| 400 | `action must be one of: archive, delete` | Invalid action |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |

**Business Rules**:

- Processes each project independently; failures on individual projects do not roll back others
- `archive` sets `status = ARCHIVED` for active/completed projects; skips already-archived projects (reported as errors)
- `delete` performs soft-delete with same rules as `DELETE /api/admin/projects/:projectId`
- Response always returns 200 with per-project success/failure breakdown
- Maximum 100 projects per bulk request to prevent abuse

---

### GET /api/admin/projects/export

**Description**: Export project data as CSV based on current filters.

**Auth**: Required (ADMIN only)

**Query Parameters**: Same filters as `GET /api/admin/projects` (search, status, dateFrom, dateTo, membersMin, membersMax, sortBy, sortOrder). Pagination is ignored — all matching records are exported.

**Example**: `GET /api/admin/projects/export?status=active&dateFrom=2026-01-01`

**Success Response** `200 OK`:

Response headers:

```
Content-Type: text/csv
Content-Disposition: attachment; filename="projects-export-2026-02-16.csv"
```

CSV columns:

```
Title,Owner,Owner Email,Status,Members,Tasks,Completion %,Created,Deadline
"Website Redesign","Jane Doe","jane@example.com","Active",8,45,62.22,"2026-01-15","2026-03-31"
"Mobile App v2","John Smith","john@example.com","Active",5,38,39.47,"2026-01-20","2026-04-15"
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |
| 422 | `Export limit exceeded. Maximum 10,000 rows.` | Too many matching records |

**Business Rules**:

- Applies the same filters as the list endpoint but exports all matching rows (no pagination)
- Maximum export limit of **10,000 rows** to prevent memory issues; returns 422 if exceeded
- CSV file is generated server-side and streamed to the client
- Filename includes the export date
- Date columns are formatted as `YYYY-MM-DD`
- `Completion %` is rounded to 2 decimal places
- `Deadline` is empty string if no deadline was set

---

## 18. Admin — System Configuration

> All endpoints in this section require **Admin** role authentication.
> Non-admin users receive `403 Forbidden`.

### GET /api/admin/settings

**Description**: Get all system settings as key-value pairs.

**Auth**: Required (ADMIN only)

**Success Response** `200 OK`:

```json
{
  "data": [
    {
      "key": "app_name",
      "value": "TaskBoard",
      "description": "Application display name",
      "updatedBy": {
        "id": "uuid",
        "name": "Admin User"
      },
      "updatedAt": "2026-02-10T12:00:00.000Z"
    },
    {
      "key": "default_template_columns",
      "value": ["To Do", "In Progress", "Review", "Done"],
      "description": "Default board columns for new projects",
      "updatedBy": null,
      "updatedAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "key": "max_file_upload_size",
      "value": 10485760,
      "description": "Max upload size in bytes (10 MB)",
      "updatedBy": null,
      "updatedAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "key": "allowed_file_types",
      "value": ["pdf", "png", "jpg", "jpeg", "docx", "xlsx"],
      "description": "Allowed attachment file extensions",
      "updatedBy": null,
      "updatedAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "key": "global_email_enabled",
      "value": true,
      "description": "Master email notification toggle",
      "updatedBy": null,
      "updatedAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "key": "default_digest_frequency",
      "value": "OFF",
      "description": "Default digest setting for new users",
      "updatedBy": null,
      "updatedAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "key": "deadline_reminder_hours",
      "value": 24,
      "description": "Hours before deadline to send reminder",
      "updatedBy": null,
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |

**Business Rules**:

- Returns all entries from the `system_settings` table
- `value` is JSONB — can be a string, number, boolean, or array depending on the setting
- `updatedBy` is `null` for settings that have never been modified from the seed defaults
- Settings are not paginated — the full list is always returned (expected to be a small set)

---

### PATCH /api/admin/settings/general

**Description**: Update general system settings (app name, board defaults, file upload configuration).

**Auth**: Required (ADMIN only)

**Request Body** (all fields optional — only include fields to update):

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `appName` | string | No | 1-100 characters |
| `defaultTemplateColumns` | string[] | No | 1-10 items, each 1-100 characters |
| `maxFileUploadSize` | integer | No | 1,048,576 (1 MB) to 52,428,800 (50 MB) |
| `allowedFileTypes` | string[] | No | 1-20 items, each a valid file extension (e.g., `pdf`, `png`) |

```json
{
  "appName": "TaskBoard Pro",
  "defaultTemplateColumns": ["Backlog", "To Do", "In Progress", "QA", "Done"],
  "maxFileUploadSize": 20971520,
  "allowedFileTypes": ["pdf", "png", "jpg", "jpeg", "docx", "xlsx", "pptx"]
}
```

**Success Response** `200 OK`:

```json
{
  "message": "General settings updated successfully.",
  "updated": {
    "app_name": "TaskBoard Pro",
    "default_template_columns": ["Backlog", "To Do", "In Progress", "QA", "Done"],
    "max_file_upload_size": 20971520,
    "allowed_file_types": ["pdf", "png", "jpg", "jpeg", "docx", "xlsx", "pptx"]
  }
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `appName must be between 1 and 100 characters` | Name empty or too long |
| 400 | `defaultTemplateColumns must contain 1 to 10 items` | Empty or too many columns |
| 400 | `maxFileUploadSize must be between 1048576 and 52428800` | Size out of range |
| 400 | `allowedFileTypes must contain 1 to 20 items` | Empty or too many types |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |

**Business Rules**:

- Each field maps to a key in the `system_settings` table: `app_name`, `default_template_columns`, `max_file_upload_size`, `allowed_file_types`
- `updated_by_id` is set to the admin's user ID for each updated setting
- `defaultTemplateColumns` changes only affect newly created projects; existing projects retain their current columns
- `maxFileUploadSize` changes take effect immediately for all future uploads
- `allowedFileTypes` changes take effect immediately; existing attachments with now-disallowed types are not affected
- At least one field must be provided; an empty body returns 400

---

### PATCH /api/admin/settings/notifications

**Description**: Update notification-related system settings.

**Auth**: Required (ADMIN only)

**Request Body** (all fields optional — only include fields to update):

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `globalEmailEnabled` | boolean | No | `true` or `false` |
| `defaultDigestFrequency` | string | No | One of: `OFF`, `DAILY`, `WEEKLY` |
| `deadlineReminderHours` | integer | No | 1-168 (1 hour to 7 days) |

```json
{
  "globalEmailEnabled": true,
  "defaultDigestFrequency": "DAILY",
  "deadlineReminderHours": 48
}
```

**Success Response** `200 OK`:

```json
{
  "message": "Notification settings updated successfully.",
  "updated": {
    "global_email_enabled": true,
    "default_digest_frequency": "DAILY",
    "deadline_reminder_hours": 48
  }
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `defaultDigestFrequency must be one of: OFF, DAILY, WEEKLY` | Invalid enum value |
| 400 | `deadlineReminderHours must be between 1 and 168` | Value out of range |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |

**Business Rules**:

- `globalEmailEnabled` is a master toggle: when `false`, ALL email sending is suppressed (invitations, password resets, digests, reminders)
- `defaultDigestFrequency` changes only affect newly created users; existing users retain their current preference
- `deadlineReminderHours` changes take effect on the next scheduled reminder job run
- At least one field must be provided; an empty body returns 400

---

### GET /api/admin/settings/labels

**Description**: List all global default labels (labels with `project_id = NULL`).

**Auth**: Required (ADMIN only)

**Success Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Bug",
      "color": "#E74C3C",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": "uuid",
      "name": "Feature",
      "color": "#3498DB",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": "uuid",
      "name": "Design",
      "color": "#9B59B6",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": "uuid",
      "name": "Documentation",
      "color": "#F39C12",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": "uuid",
      "name": "Improvement",
      "color": "#2ECC71",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |

**Business Rules**:

- Returns labels where `project_id IS NULL` (system-wide default labels)
- These labels are copied to each newly created project as initial labels
- Changes to global default labels do NOT retroactively affect labels already copied to existing projects
- Results are sorted by `name ASC`

---

### POST /api/admin/settings/labels

**Description**: Create a new global default label.

**Auth**: Required (ADMIN only)

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | Yes | 1-100 characters |
| `color` | string | Yes | Valid hex color code (e.g., `#FF5733`) |

```json
{
  "name": "Urgent",
  "color": "#E91E63"
}
```

**Success Response** `201 Created`:

```json
{
  "id": "uuid",
  "name": "Urgent",
  "color": "#E91E63",
  "createdAt": "2026-02-16T16:00:00.000Z",
  "updatedAt": "2026-02-16T16:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `name must be between 1 and 100 characters` | Name missing or too long |
| 400 | `color must be a valid hex color code` | Invalid hex format |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |
| 409 | `A global label with this name already exists` | Duplicate name where `project_id IS NULL` |

**Business Rules**:

- Creates a label with `project_id = NULL` (global scope)
- Label name must be unique among global labels (enforced by `UQ_labels_project_name` index)
- New global labels are only added to projects created after this change; existing projects are not modified
- Color must be a 7-character hex code starting with `#` (e.g., `#E91E63`)

---

### PATCH /api/admin/settings/labels/:labelId

**Description**: Update a global default label's name or color.

**Auth**: Required (ADMIN only)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `labelId` | uuid | Label ID |

**Request Body** (all fields optional):

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | No | 1-100 characters |
| `color` | string | No | Valid hex color code (e.g., `#FF5733`) |

```json
{
  "name": "Critical Bug",
  "color": "#D32F2F"
}
```

**Success Response** `200 OK`:

```json
{
  "id": "uuid",
  "name": "Critical Bug",
  "color": "#D32F2F",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-02-16T16:30:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `name must be between 1 and 100 characters` | Name empty or too long |
| 400 | `color must be a valid hex color code` | Invalid hex format |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |
| 404 | `Label not found` | Label ID does not exist or is not a global label |
| 409 | `A global label with this name already exists` | Duplicate name |

**Business Rules**:

- Only global labels (`project_id IS NULL`) can be modified through this endpoint
- If the target label has a `project_id`, the endpoint returns 404 (it is a project-scoped label, not a global default)
- Changes do NOT retroactively affect labels already copied to existing projects
- At least one field must be provided; an empty body returns 400

---

### DELETE /api/admin/settings/labels/:labelId

**Description**: Delete a global default label.

**Auth**: Required (ADMIN only)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `labelId` | uuid | Label ID |

**Request Body**: None

**Success Response** `200 OK`:

```json
{
  "message": "Label deleted successfully."
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |
| 404 | `Label not found` | Label ID does not exist or is not a global label |

**Business Rules**:

- Only global labels (`project_id IS NULL`) can be deleted through this endpoint
- Deleting a global label does NOT affect labels already copied to existing projects
- The label is hard-deleted (not soft-deleted) since it is a configuration item
- If any `task_labels` reference this label ID (which should not happen for global labels since they are copied with new IDs), those references are cascade-deleted

---

## 19. Admin — Export

> All endpoints in this section require **Admin** role authentication.
> Non-admin users receive `403 Forbidden`.

### GET /api/admin/export/users

**Description**: Export user report as CSV with optional filters.

**Auth**: Required (ADMIN only)

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `dateFrom` | string (ISO date) | — | Registration date from (inclusive) |
| `dateTo` | string (ISO date) | — | Registration date to (inclusive) |
| `role` | string | — | Filter by role: `project_owner`, `team_member`, `admin` |
| `status` | string | — | Filter by status: `active`, `suspended` |

**Example**: `GET /api/admin/export/users?dateFrom=2026-01-01&dateTo=2026-02-16&status=active`

**Success Response** `200 OK`:

Response headers:

```
Content-Type: text/csv
Content-Disposition: attachment; filename="user-report-2026-02-16.csv"
```

CSV columns:

```
Name,Email,Role,Status,Projects Count,Tasks Count,Registration Date,Last Active
"Jane Doe","jane@example.com","Project Owner","Active",5,23,"2026-01-15","2026-02-16 14:22"
"John Smith","john@example.com","Team Member","Active",3,15,"2026-01-20","2026-02-16 10:30"
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `Invalid role filter` | Unrecognized role value |
| 400 | `Invalid status filter` | Unrecognized status value |
| 400 | `dateFrom must be before dateTo` | Invalid date range |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |
| 422 | `Export limit exceeded. Maximum 10,000 rows.` | Too many matching records |

**Business Rules**:

- Exports all matching rows (no pagination)
- Maximum export limit of **10,000 rows** to prevent memory issues
- CSV is generated server-side and streamed to the client
- Filename includes the export date
- `Projects Count` is the number of projects the user is a member of (via `project_members`)
- `Tasks Count` is the number of non-deleted tasks assigned to the user
- `Registration Date` is formatted as `YYYY-MM-DD`
- `Last Active` is formatted as `YYYY-MM-DD HH:mm`; empty if user has never been active
- Soft-deleted users are excluded unless explicitly filtered
- Sensitive fields (`password_hash`, `google_id`) are never included

---

### GET /api/admin/export/projects

**Description**: Export project report as CSV with optional filters.

**Auth**: Required (ADMIN only)

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `dateFrom` | string (ISO date) | — | Creation date from (inclusive) |
| `dateTo` | string (ISO date) | — | Creation date to (inclusive) |
| `status` | string | — | Filter by status: `active`, `completed`, `archived` |

**Example**: `GET /api/admin/export/projects?status=active&dateFrom=2026-01-01`

**Success Response** `200 OK`:

Response headers:

```
Content-Type: text/csv
Content-Disposition: attachment; filename="project-report-2026-02-16.csv"
```

CSV columns:

```
Title,Owner,Owner Email,Status,Members Count,Tasks Count,Completion %,Created,Deadline
"Website Redesign","Jane Doe","jane@example.com","Active",8,45,62.22,"2026-01-15","2026-03-31"
"Mobile App v2","John Smith","john@example.com","Active",5,38,39.47,"2026-01-20","2026-04-15"
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `Invalid status filter` | Unrecognized status value |
| 400 | `dateFrom must be before dateTo` | Invalid date range |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |
| 422 | `Export limit exceeded. Maximum 10,000 rows.` | Too many matching records |

**Business Rules**:

- Exports all matching rows (no pagination)
- Maximum export limit of **10,000 rows** to prevent memory issues
- CSV is generated server-side and streamed to the client
- `Members Count` is from `project_members` table
- `Tasks Count` is non-deleted tasks only
- `Completion %` is `(tasks in last column / total tasks) * 100`, rounded to 2 decimals
- `Deadline` is empty if no deadline was set
- Date columns formatted as `YYYY-MM-DD`
- Soft-deleted projects are excluded

---

### GET /api/admin/export/tasks

**Description**: Export task report as CSV with optional filters.

**Auth**: Required (ADMIN only)

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `dateFrom` | string (ISO date) | — | Task creation date from (inclusive) |
| `dateTo` | string (ISO date) | — | Task creation date to (inclusive) |
| `projectId` | uuid | — | Filter by specific project |
| `status` | string | — | Filter by column name (e.g., `To Do`, `In Progress`, `Done`) |
| `priority` | string | — | Filter by priority: `low`, `medium`, `high`, `urgent` |

**Example**: `GET /api/admin/export/tasks?projectId=uuid&priority=high&dateFrom=2026-01-01`

**Success Response** `200 OK`:

Response headers:

```
Content-Type: text/csv
Content-Disposition: attachment; filename="task-report-2026-02-16.csv"
```

CSV columns:

```
Title,Project,Column,Assignee,Assignee Email,Priority,Due Date,Time Logged (minutes),Created
"Design homepage mockup","Website Redesign","In Progress","John Smith","john@example.com","High","2026-02-20",120,"2026-01-25"
"Fix navigation bug","Mobile App v2","To Do","","","Urgent","2026-02-18",0,"2026-02-01"
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `Invalid priority filter` | Unrecognized priority value |
| 400 | `dateFrom must be before dateTo` | Invalid date range |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | Non-admin user |
| 422 | `Export limit exceeded. Maximum 10,000 rows.` | Too many matching records |

**Business Rules**:

- Exports all matching rows (no pagination)
- Maximum export limit of **10,000 rows** to prevent memory issues
- CSV is generated server-side and streamed to the client
- `Column` is the title of the column the task currently resides in (i.e., the task's current status)
- `Assignee` and `Assignee Email` are empty strings if the task is unassigned
- `Time Logged (minutes)` is the sum of `time_entries.duration_minutes` for the task
- `Due Date` is empty if no due date was set
- Only non-deleted tasks (`deleted_at IS NULL`) are included
- If `projectId` is provided, only tasks from that project are exported
- Date columns formatted as `YYYY-MM-DD`

---

## 20. Project Dashboard & Calendar

### GET /api/projects/:projectId/dashboard/summary

**Description**: Get dashboard summary cards for a project (total tasks, completed tasks, overdue tasks, completion percentage, total time logged).

**Auth**: Required (project member — any role)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `dateFrom` | string (ISO date) | — | Filter tasks created from (inclusive) |
| `dateTo` | string (ISO date) | — | Filter tasks created to (inclusive) |

**Example**: `GET /api/projects/uuid/dashboard/summary?dateFrom=2026-01-01&dateTo=2026-02-16`

**Success Response** `200 OK`:

```json
{
  "totalTasks": 45,
  "completedTasks": 28,
  "overdueTasks": 3,
  "completionPercent": 62.22,
  "totalTimeLoggedMinutes": 4520
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `dateFrom must be before dateTo` | Invalid date range |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | User is not a member of the project |
| 404 | `Project not found` | Project ID does not exist |

**Business Rules**:

- `totalTasks` counts all non-deleted tasks in the project (with optional date range filter on `tasks.created_at`)
- `completedTasks` counts tasks in the last (rightmost) column of the board (conventionally "Done")
- `overdueTasks` counts tasks where `due_date < today` AND the task is NOT in the last column
- `completionPercent` is `(completedTasks / totalTasks) * 100`, rounded to 2 decimal places; returns `0.00` if there are no tasks
- `totalTimeLoggedMinutes` is the sum of all `time_entries.duration_minutes` for non-deleted tasks in the project
- When `dateFrom`/`dateTo` are provided, all metrics are scoped to tasks created within that range
- Both owners and members can access the dashboard

---

### GET /api/projects/:projectId/dashboard/charts

**Description**: Get chart data for the project dashboard visualizations (tasks per status, tasks per priority, member workload, completion trend).

**Auth**: Required (project member — any role)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `dateFrom` | string (ISO date) | — | Filter tasks created from (inclusive) |
| `dateTo` | string (ISO date) | — | Filter tasks created to (inclusive) |
| `assigneeId` | uuid | — | Filter by assigned user |
| `priority` | string | — | Filter by priority: `low`, `medium`, `high`, `urgent` |

**Example**: `GET /api/projects/uuid/dashboard/charts?dateFrom=2026-01-01&dateTo=2026-02-16`

**Success Response** `200 OK`:

```json
{
  "tasksPerStatus": [
    { "column": "To Do", "count": 10 },
    { "column": "In Progress", "count": 15 },
    { "column": "Review", "count": 8 },
    { "column": "Done", "count": 12 }
  ],
  "tasksPerPriority": [
    { "priority": "low", "count": 8 },
    { "priority": "medium", "count": 20 },
    { "priority": "high", "count": 12 },
    { "priority": "urgent", "count": 5 }
  ],
  "memberWorkload": [
    {
      "userId": "uuid",
      "name": "Jane Doe",
      "avatarUrl": "https://s3.amazonaws.com/taskboard/avatars/uuid.jpg",
      "assignedTasks": 12,
      "completedTasks": 8
    },
    {
      "userId": "uuid",
      "name": "John Smith",
      "avatarUrl": null,
      "assignedTasks": 9,
      "completedTasks": 5
    },
    {
      "userId": null,
      "name": "Unassigned",
      "avatarUrl": null,
      "assignedTasks": 7,
      "completedTasks": 0
    }
  ],
  "completionTrend": [
    { "date": "2026-01-17", "completed": 5, "total": 20, "rate": 25.00 },
    { "date": "2026-01-24", "completed": 10, "total": 28, "rate": 35.71 },
    { "date": "2026-01-31", "completed": 18, "total": 35, "rate": 51.43 },
    { "date": "2026-02-07", "completed": 22, "total": 40, "rate": 55.00 },
    { "date": "2026-02-14", "completed": 28, "total": 45, "rate": 62.22 }
  ]
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `Invalid priority filter` | Unrecognized priority value |
| 400 | `dateFrom must be before dateTo` | Invalid date range |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | User is not a member of the project |
| 404 | `Project not found` | Project ID does not exist |

**Business Rules**:

- `tasksPerStatus` returns one entry per column, ordered by column `position` (left to right), counting non-deleted tasks; used for a bar chart
- `tasksPerPriority` returns one entry per priority level, counting non-deleted tasks; used for a pie chart
- `memberWorkload` returns one entry per project member plus an "Unassigned" entry (where `assignee_id IS NULL`); `completedTasks` counts tasks in the last column; used for a horizontal bar chart
- `completionTrend` returns weekly data points showing cumulative completed vs. total tasks over time; used for a line chart
- The `completionTrend` period defaults to the last 8 weeks if no `dateFrom`/`dateTo` is provided; data points are weekly (one per 7 days)
- All counts exclude soft-deleted tasks
- When `assigneeId` is provided, `tasksPerStatus`, `tasksPerPriority`, and `completionTrend` are filtered to only that assignee's tasks; `memberWorkload` still shows all members
- When `priority` is provided, all chart data is filtered to only tasks with that priority level

---

### GET /api/projects/:projectId/export

**Description**: Export all project tasks and details as CSV.

**Auth**: Required (project OWNER only)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |

**Success Response** `200 OK`:

Response headers:

```
Content-Type: text/csv
Content-Disposition: attachment; filename="project-website-redesign-export-2026-02-16.csv"
```

CSV columns:

```
Title,Column,Assignee,Priority,Due Date,Labels,Sub-Tasks (completed/total),Time Logged (minutes),Comments Count,Attachments Count,Created
"Design homepage mockup","In Progress","John Smith","High","2026-02-20","Design, Feature","2/3",120,5,2,"2026-01-25"
"Fix navigation bug","To Do","","Urgent","2026-02-18","Bug","0/1",0,1,0,"2026-02-01"
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | User is not the project owner |
| 404 | `Project not found` | Project ID does not exist |

**Business Rules**:

- Only project owners can export (team members receive 403, per PRD permissions)
- Exports all non-deleted tasks in the project
- `Column` is the column title the task resides in
- `Labels` is a comma-separated list of label names attached to the task
- `Sub-Tasks` is formatted as `completed/total` (e.g., `2/3`)
- `Time Logged (minutes)` is the sum of time entries for that task
- `Comments Count` and `Attachments Count` are integer counts
- Filename includes a slugified version of the project title and the export date
- CSV is generated server-side and streamed to the client

---

### GET /api/projects/:projectId/calendar

**Description**: Get tasks with due dates for the calendar view, filtered by month and year.

**Auth**: Required (project member — any role)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `month` | integer | Current month | Month number (1-12) |
| `year` | integer | Current year | Four-digit year |

**Example**: `GET /api/projects/uuid/calendar?month=2&year=2026`

**Success Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Design homepage mockup",
      "dueDate": "2026-02-20",
      "priority": "high",
      "assignee": {
        "id": "uuid",
        "name": "John Smith",
        "avatarUrl": null
      },
      "columnTitle": "In Progress",
      "labels": [
        { "id": "uuid", "name": "Design", "color": "#9B59B6" }
      ]
    },
    {
      "id": "uuid",
      "title": "Fix navigation bug",
      "dueDate": "2026-02-18",
      "priority": "urgent",
      "assignee": null,
      "columnTitle": "To Do",
      "labels": [
        { "id": "uuid", "name": "Bug", "color": "#E74C3C" }
      ]
    },
    {
      "id": "uuid",
      "title": "Write API documentation",
      "dueDate": "2026-02-28",
      "priority": "medium",
      "assignee": {
        "id": "uuid",
        "name": "Jane Doe",
        "avatarUrl": "https://s3.amazonaws.com/taskboard/avatars/uuid.jpg"
      },
      "columnTitle": "To Do",
      "labels": [
        { "id": "uuid", "name": "Documentation", "color": "#F39C12" }
      ]
    }
  ],
  "month": 2,
  "year": 2026
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `month must be between 1 and 12` | Invalid month value |
| 400 | `year must be a valid four-digit year` | Invalid year value |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | User is not a member of the project |
| 404 | `Project not found` | Project ID does not exist |

**Business Rules**:

- Returns all non-deleted tasks that have a `due_date` falling within the specified month and year
- Tasks without a `due_date` are excluded from calendar results
- `assignee` is `null` if the task is unassigned
- `columnTitle` indicates the task's current status (which column it is in)
- `labels` array includes all labels attached to the task
- Results are sorted by `due_date ASC`, then `priority DESC` (urgent first within same date)
- The query spans the full calendar month: from the 1st to the last day of the specified month
- Both owners and members can view the calendar

---

### PATCH /api/projects/:projectId/calendar/tasks/:taskId/reschedule

**Description**: Change a task's due date, typically by dragging it on the calendar view.

**Auth**: Required (project OWNER only)

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | uuid | Project ID |
| `taskId` | uuid | Task ID |

**Request Body**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `dueDate` | string (ISO date) | Yes | Valid date in `YYYY-MM-DD` format |

```json
{
  "dueDate": "2026-02-25"
}
```

**Success Response** `200 OK`:

```json
{
  "id": "uuid",
  "title": "Design homepage mockup",
  "dueDate": "2026-02-25",
  "priority": "high",
  "assignee": {
    "id": "uuid",
    "name": "John Smith",
    "avatarUrl": null
  },
  "columnTitle": "In Progress",
  "updatedAt": "2026-02-16T16:00:00.000Z"
}
```

**Error Responses**:

| Code | Message | Condition |
|------|---------|-----------|
| 400 | `dueDate is required` | Missing due date |
| 400 | `dueDate must be a valid date in YYYY-MM-DD format` | Invalid date format |
| 401 | `Unauthorized` | Missing or invalid access token |
| 403 | `Forbidden` | User is not the project owner |
| 404 | `Project not found` | Project ID does not exist |
| 404 | `Task not found` | Task ID does not exist or does not belong to this project |

**Business Rules**:

- Only project owners can reschedule tasks via calendar drag (per PRD: "Change due dates via Calendar drag — Owner only")
- Team members receive 403 when attempting this action
- Updates `tasks.due_date` to the new value
- Creates an `activity_log` entry with action `TASK_UPDATED` and details `{ "changes": { "due_date": { "old": "2026-02-20", "new": "2026-02-25" } } }`
- If the task had notifications scheduled for the old due date, they are recalculated based on the new date
- The assignee (if any) receives a notification of type `DUE_DATE_REMINDER` if the new due date is within the configured `deadline_reminder_hours`
- Real-time: broadcasts `taskUpdated` WebSocket event to all project room members
- Setting `dueDate` to the same value as the current due date is a no-op (returns 200 with no changes)

---

## 21. WebSocket Events

> **Namespace**: `/board`
> **Transport**: Socket.IO over WebSocket
> **Auth**: JWT token must be provided during connection handshake via `auth` option

### Connection

```javascript
// Client connection example
const socket = io("ws://localhost:3000/board", {
  auth: {
    token: "eyJ..."  // JWT access token
  }
});
```

**Connection Authentication**:

| Scenario | Result |
|----------|--------|
| Valid JWT token | Connection established |
| Missing token | Connection rejected with `{ message: "Authentication required" }` |
| Expired token | Connection rejected with `{ message: "Token expired" }` |
| Invalid token | Connection rejected with `{ message: "Invalid token" }` |
| Suspended user | Connection rejected with `{ message: "Account is suspended" }` |

**Business Rules**:

- JWT token is verified on connection using the same secret as the REST API
- The socket connection is tied to the authenticated user; all events are authorized against their project memberships
- If the access token expires during an active connection, the server emits an `error` event with code `TOKEN_EXPIRED` and disconnects after a grace period of 30 seconds (client should refresh token and reconnect)
- A single user can have multiple simultaneous socket connections (e.g., multiple browser tabs)

---

### Client-to-Server Events

#### `joinProject`

**Description**: Join a project room to receive real-time board updates.

**Payload**:

```json
{
  "projectId": "uuid"
}
```

**Server Response** (acknowledgement callback):

```json
{
  "success": true,
  "message": "Joined project room"
}
```

**Error Response**:

```json
{
  "success": false,
  "message": "Not a member of this project",
  "code": "FORBIDDEN"
}
```

**Business Rules**:

- User must be a member of the project (`project_members` table) to join the room
- A user can join multiple project rooms simultaneously
- Joining a room the user is already in is idempotent (no error)
- Server adds the socket to a room named `project:{projectId}`

---

#### `leaveProject`

**Description**: Leave a project room, stopping real-time updates for that project.

**Payload**:

```json
{
  "projectId": "uuid"
}
```

**Server Response** (acknowledgement callback):

```json
{
  "success": true,
  "message": "Left project room"
}
```

**Business Rules**:

- Removes the socket from the project room
- Leaving a room the user is not in is a no-op (no error)
- On socket disconnect, all room memberships are automatically cleaned up

---

#### `moveTask`

**Description**: Move a task to a different column and/or position (drag-and-drop).

**Payload**:

```json
{
  "taskId": "uuid",
  "targetColumnId": "uuid",
  "position": 0
}
```

**Server Response** (acknowledgement callback):

```json
{
  "success": true,
  "task": {
    "id": "uuid",
    "columnId": "uuid",
    "position": 0
  }
}
```

**Error Response**:

```json
{
  "success": false,
  "message": "WIP limit reached for target column",
  "code": "WIP_LIMIT_EXCEEDED"
}
```

**Business Rules**:

- Both owners and members can move tasks (drag cards between columns)
- `position` is 0-based; tasks below the insertion point are shifted down
- If `targetColumnId` is the same as the current column, this is a reorder within the same column
- If the target column has a WIP limit and it is already at capacity, the move is rejected unless the task is coming from the same column (reorder)
- Updates `tasks.column_id` and `tasks.position` in the database
- Creates an `activity_log` entry with action `TASK_MOVED`
- Broadcasts `taskMoved` event to all other clients in the project room
- The assignee (if different from the mover) receives a notification of type `STATUS_CHANGE`

---

#### `createTask`

**Description**: Create a new task in real-time.

**Payload**:

```json
{
  "columnId": "uuid",
  "title": "New task title",
  "description": "Task description",
  "priority": "medium",
  "assigneeId": "uuid",
  "dueDate": "2026-03-01",
  "labelIds": ["uuid-1", "uuid-2"]
}
```

**Server Response** (acknowledgement callback):

```json
{
  "success": true,
  "task": {
    "id": "uuid",
    "columnId": "uuid",
    "title": "New task title",
    "description": "Task description",
    "priority": "medium",
    "position": 0,
    "assignee": {
      "id": "uuid",
      "name": "John Smith",
      "avatarUrl": null
    },
    "dueDate": "2026-03-01",
    "labels": [
      { "id": "uuid-1", "name": "Bug", "color": "#E74C3C" },
      { "id": "uuid-2", "name": "Feature", "color": "#3498DB" }
    ],
    "creator": {
      "id": "uuid",
      "name": "Jane Doe"
    },
    "createdAt": "2026-02-16T16:00:00.000Z"
  }
}
```

**Error Response**:

```json
{
  "success": false,
  "message": "title is required",
  "code": "VALIDATION_ERROR"
}
```

**Business Rules**:

- Both owners and members can create tasks
- `title` is required; all other fields are optional
- New task is placed at `position: 0` (top of the column) by default; existing tasks shift down
- If `assigneeId` is provided, a notification of type `TASK_ASSIGNED` is sent to the assignee
- Creates an `activity_log` entry with action `TASK_CREATED`
- Broadcasts `taskCreated` event to all other clients in the project room

---

#### `updateTask`

**Description**: Update one or more fields of an existing task in real-time.

**Payload**:

```json
{
  "taskId": "uuid",
  "changes": {
    "title": "Updated title",
    "priority": "high",
    "assigneeId": "uuid",
    "dueDate": "2026-03-15"
  }
}
```

**Server Response** (acknowledgement callback):

```json
{
  "success": true,
  "task": {
    "id": "uuid",
    "title": "Updated title",
    "priority": "high",
    "assigneeId": "uuid",
    "dueDate": "2026-03-15",
    "updatedAt": "2026-02-16T16:30:00.000Z"
  }
}
```

**Error Response**:

```json
{
  "success": false,
  "message": "Cannot edit tasks created by other members",
  "code": "FORBIDDEN"
}
```

**Business Rules**:

- Owners can update any task; members can only update tasks they created (per PRD: "Edit own tasks only")
- Allowed fields: `title`, `description`, `priority`, `assigneeId`, `dueDate`, `labelIds`
- If `assigneeId` changes, the new assignee receives a `TASK_ASSIGNED` notification
- Creates an `activity_log` entry with action `TASK_UPDATED` including old/new values in `details`
- Broadcasts `taskUpdated` event to all other clients in the project room

---

#### `deleteTask`

**Description**: Soft-delete a task (move to trash).

**Payload**:

```json
{
  "taskId": "uuid"
}
```

**Server Response** (acknowledgement callback):

```json
{
  "success": true,
  "message": "Task moved to trash"
}
```

**Error Response**:

```json
{
  "success": false,
  "message": "Only project owners can delete tasks",
  "code": "FORBIDDEN"
}
```

**Business Rules**:

- Only project owners can delete tasks (per PRD permissions)
- Sets `tasks.deleted_at` to now and `tasks.deleted_by_id` to the owner's user ID
- Task remains in the database and can be restored within 30 days
- Creates an `activity_log` entry with action `TASK_DELETED`
- Broadcasts `taskDeleted` event to all other clients in the project room

---

### Server-to-Client Events

#### `taskMoved`

**Description**: Broadcast when a task is moved to a different column or position.

**Payload**:

```json
{
  "taskId": "uuid",
  "fromColumnId": "uuid",
  "toColumnId": "uuid",
  "position": 0,
  "movedBy": {
    "id": "uuid",
    "name": "Jane Doe"
  },
  "timestamp": "2026-02-16T16:00:00.000Z"
}
```

---

#### `taskCreated`

**Description**: Broadcast when a new task is created in the project.

**Payload**:

```json
{
  "task": {
    "id": "uuid",
    "columnId": "uuid",
    "title": "New task title",
    "description": "Task description",
    "priority": "medium",
    "position": 0,
    "assignee": {
      "id": "uuid",
      "name": "John Smith",
      "avatarUrl": null
    },
    "dueDate": "2026-03-01",
    "labels": [
      { "id": "uuid", "name": "Bug", "color": "#E74C3C" }
    ],
    "subTasksCount": 0,
    "subTasksCompleted": 0,
    "commentsCount": 0,
    "attachmentsCount": 0,
    "creator": {
      "id": "uuid",
      "name": "Jane Doe"
    },
    "createdAt": "2026-02-16T16:00:00.000Z"
  }
}
```

---

#### `taskUpdated`

**Description**: Broadcast when a task's fields are updated.

**Payload**:

```json
{
  "taskId": "uuid",
  "changes": {
    "title": "Updated title",
    "priority": "high",
    "assignee": {
      "id": "uuid",
      "name": "John Smith",
      "avatarUrl": null
    },
    "dueDate": "2026-03-15"
  },
  "updatedBy": {
    "id": "uuid",
    "name": "Jane Doe"
  },
  "timestamp": "2026-02-16T16:30:00.000Z"
}
```

---

#### `taskDeleted`

**Description**: Broadcast when a task is soft-deleted (moved to trash).

**Payload**:

```json
{
  "taskId": "uuid",
  "columnId": "uuid",
  "deletedBy": {
    "id": "uuid",
    "name": "Jane Doe"
  },
  "timestamp": "2026-02-16T17:00:00.000Z"
}
```

---

#### `memberJoined`

**Description**: Broadcast when a new member joins the project.

**Payload**:

```json
{
  "userId": "uuid",
  "name": "Alice Williams",
  "avatarUrl": "https://s3.amazonaws.com/taskboard/avatars/uuid.jpg",
  "projectRole": "member",
  "joinedAt": "2026-02-16T10:00:00.000Z"
}
```

---

#### `memberLeft`

**Description**: Broadcast when a member is removed from the project.

**Payload**:

```json
{
  "userId": "uuid",
  "removedBy": {
    "id": "uuid",
    "name": "Jane Doe"
  },
  "timestamp": "2026-02-16T11:00:00.000Z"
}
```

---

#### `columnUpdated`

**Description**: Broadcast when a column is created, updated, reordered, or deleted.

**Payload**:

```json
{
  "action": "updated",
  "columnId": "uuid",
  "changes": {
    "title": "In Review",
    "position": 2,
    "wipLimit": 5
  },
  "updatedBy": {
    "id": "uuid",
    "name": "Jane Doe"
  },
  "timestamp": "2026-02-16T12:00:00.000Z"
}
```

**Notes**:

- `action` is one of: `created`, `updated`, `deleted`, `reordered`
- For `deleted` action, only `columnId` and `updatedBy` are present in the payload
- For `reordered` action, `changes` contains the new `position` values for all affected columns

---

#### `boardRefresh`

**Description**: Broadcast when the entire board state should be refreshed (e.g., after bulk operations, column reorder, or structural changes that affect multiple tasks).

**Payload**:

```json
{
  "projectId": "uuid",
  "reason": "column_reorder",
  "timestamp": "2026-02-16T16:00:00.000Z"
}
```

**Notes**:

- Clients receiving this event should re-fetch the entire board state via `GET /api/projects/:projectId/board`
- Used sparingly for operations where incremental updates would be too complex or unreliable

---

#### `notification`

**Description**: Push a real-time notification to a specific user.

**Payload**:

```json
{
  "notification": {
    "id": "uuid",
    "type": "TASK_ASSIGNED",
    "title": "New task assigned",
    "message": "Jane Doe assigned you to 'Design homepage mockup'",
    "taskId": "uuid",
    "projectId": "uuid",
    "isRead": false,
    "createdAt": "2026-02-16T14:00:00.000Z"
  }
}
```

**Notes**:

- Sent directly to the specific user's socket(s), not broadcast to the project room
- Maps to the `notifications` table record that was created
- Client should update the notification badge/counter and optionally show a toast

---

#### `timerUpdate`

**Description**: Broadcast when a time tracking timer is started, stopped, or updated for a task in the project.

**Payload**:

```json
{
  "taskId": "uuid",
  "timeEntryId": "uuid",
  "action": "started",
  "user": {
    "id": "uuid",
    "name": "Jane Doe"
  },
  "startedAt": "2026-02-16T10:00:00.000Z",
  "endedAt": null,
  "durationMinutes": 0,
  "timestamp": "2026-02-16T10:00:00.000Z"
}
```

**Notes**:

- Broadcast to all members in the project room so they can see who is actively working on what
- Useful for displaying real-time "user is working on this task" indicators

---

#### `error`

**Description**: Send an error notification to the client.

**Payload**:

```json
{
  "message": "Token expired. Please reconnect.",
  "code": "TOKEN_EXPIRED"
}
```

**Error Codes**:

| Code | Description |
|------|-------------|
| `TOKEN_EXPIRED` | JWT access token has expired; client should refresh and reconnect |
| `FORBIDDEN` | User does not have permission for the requested action |
| `NOT_FOUND` | Referenced resource (task, column, project) was not found |
| `VALIDATION_ERROR` | Payload failed validation |
| `WIP_LIMIT_EXCEEDED` | Target column WIP limit would be exceeded |
| `INTERNAL_ERROR` | Unexpected server error |

---

## Endpoint Summary

| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| | | **1. Authentication (9)** | | |
| 1 | POST | /api/auth/register | Public | Register new user account |
| 2 | POST | /api/auth/login | Public | Login with email and password |
| 3 | POST | /api/auth/google | Public | Login or register via Google OAuth |
| 4 | POST | /api/auth/refresh | Public | Refresh access token |
| 5 | POST | /api/auth/forgot-password | Public | Request password reset email |
| 6 | POST | /api/auth/reset-password | Public | Reset password with token |
| 7 | POST | /api/auth/verify-email | Public | Verify email address |
| 8 | POST | /api/auth/resend-verification | Public | Resend verification email |
| 9 | POST | /api/auth/logout | Required | Log out and invalidate tokens |
| | | **2. Users — Profile (9)** | | |
| 10 | GET | /api/users/me | Required | Get current user profile |
| 11 | PATCH | /api/users/me | Required | Update profile fields |
| 12 | POST | /api/users/me/avatar | Required | Upload profile photo |
| 13 | PATCH | /api/users/me/email | Required | Request email change |
| 14 | PATCH | /api/users/me/password | Required | Change password |
| 15 | PATCH | /api/users/me/notifications | Required | Update notification preferences |
| 16 | POST | /api/users/me/devices | Required | Register device for push notifications |
| 17 | DELETE | /api/users/me/devices/:deviceId | Required | Unregister device |
| 18 | DELETE | /api/users/me | Required | Delete own account |
| | | **3. Admin — User Management (10)** | | |
| 19 | GET | /api/admin/users | Admin | List all users |
| 20 | POST | /api/admin/users | Admin | Create user with invitation |
| 21 | GET | /api/admin/users/:id | Admin | Get user detail |
| 22 | PATCH | /api/admin/users/:id | Admin | Update user profile |
| 23 | PATCH | /api/admin/users/:id/status | Admin | Change user status |
| 24 | PATCH | /api/admin/users/:id/role | Admin | Change user role |
| 25 | POST | /api/admin/users/:id/reset-password | Admin | Admin-initiated password reset |
| 26 | DELETE | /api/admin/users/:id | Admin | Delete user |
| 27 | POST | /api/admin/users/bulk | Admin | Bulk user actions |
| 28 | GET | /api/admin/users/export | Admin | Export users as CSV |
| | | **4. Projects (7)** | | |
| 29 | GET | /api/projects | Required | List user's projects |
| 30 | POST | /api/projects | Owner | Create new project |
| 31 | GET | /api/projects/:projectId | Member | Get project details |
| 32 | GET | /api/projects/:projectId/board | Member | Get full board state |
| 33 | PATCH | /api/projects/:projectId | Owner | Update project settings |
| 34 | POST | /api/projects/:projectId/archive | Owner | Archive/unarchive project |
| 35 | DELETE | /api/projects/:projectId | Owner | Delete project |
| | | **5. Project Members (8)** | | |
| 36 | GET | /api/projects/:projectId/members | Member | List project members |
| 37 | POST | /api/projects/:projectId/members/invite | Owner | Invite members via email |
| 38 | DELETE | /api/projects/:projectId/members/:userId | Owner | Remove member |
| 39 | GET | /api/projects/:projectId/invitations | Owner | List invitations |
| 40 | POST | /api/projects/:projectId/invitations/:invitationId/resend | Owner | Resend invitation email |
| 41 | DELETE | /api/projects/:projectId/invitations/:invitationId | Owner | Cancel invitation |
| 42 | POST | /api/invitations/:token/accept | Required | Accept invitation |
| 43 | POST | /api/invitations/:token/decline | Required | Decline invitation |
| | | **6. Columns (5)** | | |
| 44 | GET | /api/projects/:projectId/columns | Member | List board columns |
| 45 | POST | /api/projects/:projectId/columns | Owner | Create column |
| 46 | PATCH | /api/projects/:projectId/columns/:columnId | Owner | Update column |
| 47 | DELETE | /api/projects/:projectId/columns/:columnId | Owner | Delete column |
| 48 | PATCH | /api/projects/:projectId/columns/reorder | Owner | Reorder columns |
| | | **7. Tasks (10)** | | |
| 49 | GET | /api/projects/:projectId/tasks | Member | List project tasks |
| 50 | POST | /api/projects/:projectId/tasks | Member | Create task |
| 51 | GET | /api/projects/:projectId/tasks/:taskId | Member | Get task detail |
| 52 | PATCH | /api/projects/:projectId/tasks/:taskId | Member | Update task |
| 53 | PATCH | /api/projects/:projectId/tasks/:taskId/move | Member | Move task between columns |
| 54 | DELETE | /api/projects/:projectId/tasks/:taskId | Owner | Soft-delete task |
| 55 | GET | /api/projects/:projectId/tasks/trash | Owner | List trashed tasks |
| 56 | POST | /api/projects/:projectId/tasks/:taskId/restore | Owner | Restore task from trash |
| 57 | DELETE | /api/projects/:projectId/tasks/trash/:taskId | Owner | Permanently delete from trash |
| 58 | GET | /api/users/me/tasks | Required | List my tasks across projects |
| | | **8. Sub-Tasks (5)** | | |
| 59 | GET | /api/projects/:projectId/tasks/:taskId/subtasks | Member | List sub-tasks |
| 60 | POST | /api/projects/:projectId/tasks/:taskId/subtasks | Member | Create sub-task |
| 61 | PATCH | /api/projects/:projectId/tasks/:taskId/subtasks/:subTaskId | Member | Update sub-task |
| 62 | DELETE | /api/projects/:projectId/tasks/:taskId/subtasks/:subTaskId | Member | Delete sub-task |
| 63 | PATCH | /api/projects/:projectId/tasks/:taskId/subtasks/reorder | Member | Reorder sub-tasks |
| | | **9. Comments (4)** | | |
| 64 | GET | /api/projects/:projectId/tasks/:taskId/comments | Member | List comments |
| 65 | POST | /api/projects/:projectId/tasks/:taskId/comments | Member | Add comment |
| 66 | PATCH | /api/projects/:projectId/tasks/:taskId/comments/:commentId | Member | Edit comment |
| 67 | DELETE | /api/projects/:projectId/tasks/:taskId/comments/:commentId | Member | Delete comment |
| | | **10. Attachments (4)** | | |
| 68 | GET | /api/projects/:projectId/tasks/:taskId/attachments | Member | List attachments |
| 69 | POST | /api/projects/:projectId/tasks/:taskId/attachments | Member | Upload attachment |
| 70 | GET | /api/projects/:projectId/tasks/:taskId/attachments/:attachmentId/download | Member | Download attachment |
| 71 | DELETE | /api/projects/:projectId/tasks/:taskId/attachments/:attachmentId | Member | Delete attachment |
| | | **11. Time Entries (6)** | | |
| 72 | GET | /api/projects/:projectId/tasks/:taskId/time-entries | Member | List time entries |
| 73 | POST | /api/projects/:projectId/tasks/:taskId/time-entries | Member | Log manual time entry |
| 74 | POST | /api/projects/:projectId/tasks/:taskId/time-entries/start | Member | Start timer |
| 75 | POST | /api/projects/:projectId/tasks/:taskId/time-entries/:timeEntryId/stop | Member | Stop timer |
| 76 | PATCH | /api/projects/:projectId/tasks/:taskId/time-entries/:timeEntryId | Member | Update time entry |
| 77 | DELETE | /api/projects/:projectId/tasks/:taskId/time-entries/:timeEntryId | Member | Delete time entry |
| | | **12. Labels (4)** | | |
| 78 | GET | /api/projects/:projectId/labels | Member | List project labels |
| 79 | POST | /api/projects/:projectId/labels | Owner | Create label |
| 80 | PATCH | /api/projects/:projectId/labels/:labelId | Owner | Update label |
| 81 | DELETE | /api/projects/:projectId/labels/:labelId | Owner | Delete label |
| | | **13. Notifications (4)** | | |
| 82 | GET | /api/notifications | Required | List user notifications |
| 83 | PATCH | /api/notifications/:notificationId/read | Required | Mark notification as read |
| 84 | POST | /api/notifications/read-all | Required | Mark all notifications as read |
| 85 | DELETE | /api/notifications/:notificationId | Required | Delete notification |
| | | **14. Activity Logs (1)** | | |
| 86 | GET | /api/projects/:projectId/activity | Member | Get project activity feed |
| | | **15. Admin — Dashboard (3)** | | |
| 87 | GET | /api/admin/dashboard/stats | Admin | Get dashboard summary stats |
| 88 | GET | /api/admin/dashboard/charts | Admin | Get dashboard chart data |
| 89 | GET | /api/admin/dashboard/recent-activity | Admin | Get latest activity events |
| | | **16. Admin — User Management** | | |
| | | *(See section 3 — same 10 endpoints)* | | |
| | | **17. Admin — Project Management (6)** | | |
| 90 | GET | /api/admin/projects | Admin | List all projects |
| 91 | GET | /api/admin/projects/:projectId | Admin | Get project detail |
| 92 | POST | /api/admin/projects/:projectId/archive | Admin | Archive project |
| 93 | DELETE | /api/admin/projects/:projectId | Admin | Delete project permanently |
| 94 | POST | /api/admin/projects/bulk | Admin | Bulk project actions |
| 95 | GET | /api/admin/projects/export | Admin | Export projects as CSV |
| | | **18. Admin — System Configuration (7)** | | |
| 96 | GET | /api/admin/settings | Admin | Get all system settings |
| 97 | PATCH | /api/admin/settings/general | Admin | Update general settings |
| 98 | PATCH | /api/admin/settings/notifications | Admin | Update notification settings |
| 99 | GET | /api/admin/settings/labels | Admin | List global default labels |
| 100 | POST | /api/admin/settings/labels | Admin | Create global default label |
| 101 | PATCH | /api/admin/settings/labels/:labelId | Admin | Update global default label |
| 102 | DELETE | /api/admin/settings/labels/:labelId | Admin | Delete global default label |
| | | **19. Admin — Export (3)** | | |
| 103 | GET | /api/admin/export/users | Admin | Export user report as CSV |
| 104 | GET | /api/admin/export/projects | Admin | Export project report as CSV |
| 105 | GET | /api/admin/export/tasks | Admin | Export task report as CSV |
| | | **20. Project Dashboard & Calendar (5)** | | |
| 106 | GET | /api/projects/:projectId/dashboard/summary | Member | Dashboard summary cards |
| 107 | GET | /api/projects/:projectId/dashboard/charts | Member | Dashboard chart data |
| 108 | GET | /api/projects/:projectId/export | Owner | Export project data as CSV |
| 109 | GET | /api/projects/:projectId/calendar | Member | Get calendar view tasks |
| 110 | PATCH | /api/projects/:projectId/calendar/tasks/:taskId/reschedule | Owner | Reschedule task due date |
| | | **21. WebSocket Events (6 C2S + 8 S2C)** | | |
| 111 | WS | /board → joinProject | Member | Join project room |
| 112 | WS | /board → leaveProject | Member | Leave project room |
| 113 | WS | /board → moveTask | Member | Move task via drag-and-drop |
| 114 | WS | /board → createTask | Member | Create task in real-time |
| 115 | WS | /board → updateTask | Member | Update task in real-time |
| 116 | WS | /board → deleteTask | Owner | Soft-delete task in real-time |

**Total: 110 REST endpoints + 6 WebSocket client events + 8 WebSocket server events**

---

*Generated from PRD v1.1 (2026-02-09), PROJECT_DATABASE.md, and PROJECT_KNOWLEDGE.md*
