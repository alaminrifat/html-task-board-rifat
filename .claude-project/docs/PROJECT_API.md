# API Reference: html-taskboard

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.html-taskboard.com`

## Authentication

This API uses **httpOnly cookie-based authentication** for secure session management.

### 🍪 For Browser/Web Clients (PRIMARY METHOD)

Authentication is handled automatically via httpOnly cookies:

**Flow:**
1. Client calls `POST /auth/login` with credentials
2. Backend validates and sets `accessToken` and `refreshToken` as httpOnly cookies via `Set-Cookie` header
3. All subsequent requests automatically include cookies (browser handles this)
4. Frontend uses `withCredentials: true` in axios/fetch configuration
5. **NO tokens stored in localStorage or sessionStorage**

**Cookie Configuration:**
```
HttpOnly: true       # JavaScript cannot access (XSS protection)
Secure: true         # HTTPS only (production)
SameSite: Strict     # CSRF protection (production)
Path: /
Max-Age: 86400       # 24 hours (access token)
```

**Frontend Setup:**
```javascript
// axios configuration
axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,  // REQUIRED to include cookies
})
```

**Backend CORS:**
```javascript
// NestJS main.ts
app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true  // REQUIRED to allow cookies
})
```

### 🔑 For API Clients/External Services (FALLBACK)

Bearer token authentication is supported for non-browser clients:

```
Authorization: Bearer <token>
```

Obtain token via login endpoint, then pass in Authorization header for subsequent requests.

**When to use:**
- Mobile apps (non-web views)
- External API clients (Postman, curl, third-party)
- Server-to-server communication
- Command-line tools

**Note**: Web browsers should ALWAYS use cookies for security.

## Endpoints

### Auth

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/forgot-password` | Send password reset email | No |
| POST | `/auth/reset-password` | Reset password with token | No |
| POST | `/auth/refresh` | Refresh access token | Yes |
| POST | `/auth/logout` | Logout user | Yes |
| GET | `/auth/google` | Google OAuth redirect | No |
| POST | `/auth/verify-email` | Verify email with token | No |

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users/me` | Get current user profile | Yes |
| PATCH | `/users/me` | Update profile | Yes |
| PATCH | `/users/me/password` | Change password | Yes |
| GET | `/users/me/preferences` | Get notification preferences | Yes |
| PATCH | `/users/me/preferences` | Update notification preferences | Yes |

### Projects

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/projects` | List user's projects | Yes |
| POST | `/projects` | Create new project | Yes (Owner) |
| GET | `/projects/:id` | Get project details | Yes |
| PATCH | `/projects/:id` | Update project | Yes (Owner) |
| DELETE | `/projects/:id` | Delete project | Yes (Owner) |
| POST | `/projects/:id/archive` | Archive project | Yes (Owner) |
| GET | `/projects/:id/members` | List project members | Yes |
| POST | `/projects/:id/members/invite` | Invite member via email | Yes (Owner) |
| DELETE | `/projects/:id/members/:userId` | Remove member | Yes (Owner) |
| GET | `/projects/:id/dashboard` | Get project dashboard/stats | Yes |
| GET | `/projects/:id/export` | Export project CSV | Yes (Owner) |

### Boards (Columns)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/projects/:id/columns` | List board columns | Yes |
| POST | `/projects/:id/columns` | Add column | Yes (Owner) |
| PATCH | `/projects/:id/columns/:colId` | Update column (name, WIP limit) | Yes (Owner) |
| DELETE | `/projects/:id/columns/:colId` | Delete column | Yes (Owner) |
| PATCH | `/projects/:id/columns/reorder` | Reorder columns | Yes (Owner) |

### Tasks

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/projects/:id/tasks` | List project tasks | Yes |
| POST | `/projects/:id/tasks` | Create task | Yes |
| GET | `/tasks/:id` | Get task details | Yes |
| PATCH | `/tasks/:id` | Update task | Yes |
| DELETE | `/tasks/:id` | Soft delete task | Yes (Owner) |
| PATCH | `/tasks/:id/move` | Move task between columns | Yes |
| POST | `/tasks/:id/restore` | Restore from trash | Yes (Owner) |
| DELETE | `/tasks/:id/permanent` | Permanently delete | Yes (Owner) |
| GET | `/projects/:id/trash` | List trashed tasks | Yes (Owner) |
| GET | `/projects/:id/calendar` | Get tasks by date for calendar | Yes |

### Sub-Tasks

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/tasks/:id/subtasks` | List sub-tasks | Yes |
| POST | `/tasks/:id/subtasks` | Create sub-task | Yes |
| PATCH | `/subtasks/:id` | Update/toggle sub-task | Yes |
| DELETE | `/subtasks/:id` | Delete sub-task | Yes |

### Comments

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/tasks/:id/comments` | List task comments | Yes |
| POST | `/tasks/:id/comments` | Add comment | Yes |
| PATCH | `/comments/:id` | Edit comment | Yes (Author) |
| DELETE | `/comments/:id` | Delete comment | Yes (Author) |

### Attachments

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/tasks/:id/attachments` | List attachments | Yes |
| POST | `/tasks/:id/attachments` | Upload file | Yes |
| DELETE | `/attachments/:id` | Delete attachment | Yes |
| GET | `/attachments/:id/download` | Download file | Yes |

### Time Tracking

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/tasks/:id/time-entries` | List time entries | Yes |
| POST | `/tasks/:id/time-entries` | Log time (manual) | Yes |
| POST | `/tasks/:id/timer/start` | Start timer | Yes |
| POST | `/tasks/:id/timer/stop` | Stop timer | Yes |
| DELETE | `/time-entries/:id` | Delete time entry | Yes |

### Labels

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/labels` | List available labels | Yes |
| POST | `/labels` | Create label | Yes (Owner) |
| PATCH | `/labels/:id` | Update label | Yes (Owner) |
| DELETE | `/labels/:id` | Delete label | Yes (Owner) |

### Notifications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/notifications` | List user notifications | Yes |
| PATCH | `/notifications/:id/read` | Mark as read | Yes |
| POST | `/notifications/read-all` | Mark all as read | Yes |
| DELETE | `/notifications/:id` | Dismiss notification | Yes |

### Admin

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/stats` | Get admin statistics | Yes (Admin) |
| GET | `/admin/users` | List all users | Yes (Admin) |
| POST | `/admin/users` | Create user | Yes (Admin) |
| GET | `/admin/users/:id` | Get user details | Yes (Admin) |
| PATCH | `/admin/users/:id` | Update user (role, status) | Yes (Admin) |
| DELETE | `/admin/users/:id` | Delete user | Yes (Admin) |
| POST | `/admin/users/:id/reset-password` | Reset user password | Yes (Admin) |
| GET | `/admin/projects` | List all projects | Yes (Admin) |
| GET | `/admin/projects/:id` | Get project details | Yes (Admin) |
| PATCH | `/admin/projects/:id` | Update project (archive/delete) | Yes (Admin) |
| GET | `/admin/settings` | Get system settings | Yes (Admin) |
| PATCH | `/admin/settings` | Update system settings | Yes (Admin) |
| GET | `/admin/export/users` | Export users CSV | Yes (Admin) |
| GET | `/admin/export/projects` | Export projects CSV | Yes (Admin) |
| GET | `/admin/export/tasks` | Export tasks CSV | Yes (Admin) |

### WebSocket Events

Real-time updates are delivered via WebSocket connections. Clients subscribe to project board rooms to receive live task and comment events.

| Event            | Direction        | Description                     |
|------------------|------------------|---------------------------------|
| `board:join`     | Client -> Server | Join a project board room       |
| `board:leave`    | Client -> Server | Leave board room                |
| `task:moved`     | Server -> Client | Task moved between columns      |
| `task:created`   | Server -> Client | New task created                |
| `task:updated`   | Server -> Client | Task updated                    |
| `task:deleted`   | Server -> Client | Task deleted                    |
| `comment:added`  | Server -> Client | New comment added               |

## Request/Response Examples

### Login

**Request:**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": false  // Optional: extends cookie expiration to 30 days
}
```

**Response Body:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "OWNER"
    }
  }
}
```

**TaskBoard Roles:** `OWNER` (project creator, full control), `MEMBER` (standard project member), `ADMIN` (system administrator)

**Response Headers (Set-Cookie):**
```http
Set-Cookie: accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400
Set-Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800
```

**CRITICAL NOTES:**

1. **Tokens are NOT in response body** - only user data is returned
2. **Tokens are set via Set-Cookie headers** - browser stores automatically
3. **Frontend does NOT manually store tokens** - security vulnerability
4. **Cookies automatically included in subsequent requests**
5. **httpOnly flag prevents JavaScript access** - XSS protection

**Frontend Implementation:**
```typescript
// Login request
const response = await authService.login({
  email: 'user@example.com',
  password: 'password123'
});

// Backend sets cookies automatically via Set-Cookie header
// No localStorage.setItem() needed - in fact, DON'T do this!

// Dispatch user to Redux/state (NO tokens)
dispatch(loginSuccess(response.data.user));

// Navigate to dashboard
navigate('/dashboard');

// All subsequent API calls automatically include cookies
const data = await api.get('/protected-endpoint');
// No need to add Authorization header - cookies sent automatically
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid credentials",
  "statusCode": 401
}
```

## Error Responses

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |
