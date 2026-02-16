# Project Knowledge: html-taskboard

## Overview

TaskBoard is a lightweight, mobile-first project management platform centered around Kanban boards. It enables project owners to organize work visually, assign tasks to team members, and track progress in real-time. The platform focuses on simplicity and real-time collaboration without the complexity of traditional enterprise PM tools.

### Goals

1. Provide a simple, intuitive Kanban board experience with real-time synchronization across all users
2. Enable project owners to track team progress through automated dashboards and completion metrics
3. Facilitate team collaboration through task comments, file attachments, and notification-driven workflows

## Tech Stack

- **Backend**: NestJS (TypeScript, TypeORM, JWT, Swagger)
- **Frontend**: React (Web App for Project Owner & Team Member access)
- **Dashboard**: React (Admin management interface)
- **Database**: PostgreSQL
- **Deployment**: Docker
- **Real-time**: WebSocket

## Architecture

```
html-taskboard/
├── backend/              # NestJS API server
├── frontend/             # React web application
├── dashboard/            # React admin management interface
├── .claude/              # Claude Code configuration
├── .claude-project/      # Project documentation and skills
└── docker-compose.yml    # Docker services orchestration
```

## User Types

| User Type | Description | Key Capabilities |
|-----------|-------------|------------------|
| **Project Owner** | Creates and manages projects | Builds Kanban boards, creates and assigns tasks, invites team members, monitors project progress via dashboard |
| **Team Member** | Works on assigned tasks within projects | Views assigned tasks, creates tasks, updates task status by dragging cards, adds comments and file attachments, creates sub-tasks, logs time on tasks, receives notifications for assignments and deadlines |
| **Admin** | System-level administrator | Manages all users and projects, monitors system usage analytics, configures system settings |

## Terminology

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

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend Framework | NestJS (TypeScript, TypeORM, JWT, Swagger) | Structured, scalable Node.js framework with built-in TypeScript support and enterprise patterns |
| Frontend App | React | Web App for Project Owner and Team Member access |
| Admin Dashboard | React | Separate admin management interface |
| Real-time Communication | WebSocket | Board updates require real-time synchronization across all connected users |
| Authentication | httpOnly cookie-based JWT | Secure token storage preventing XSS token theft (see Security Architecture below) |
| Database | PostgreSQL | Robust relational database for structured project and task data |
| Deployment | Docker | Containerized deployment for consistent environments |

## Development Setup

```bash
# Clone with submodules
git clone --recurse-submodules <repo-url>

# Start services
docker-compose up -d
```

## Environment Variables

### Backend (.env)

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `DATABASE_URL` | Database connection string | Yes | - | `postgresql://user:pass@localhost:5432/db` |
| `AUTH_JWT_SECRET` | JWT signing secret (use strong random string) | Yes | - | `your-secure-secret-key-min-32-chars` |
| `AUTH_TOKEN_COOKIE_NAME` | Access token cookie name | No | `accessToken` | `accessToken` |
| `AUTH_TOKEN_EXPIRE_TIME` | Access token expiration | No | `24h` | `24h`, `1d`, `3600s` |
| `AUTH_TOKEN_EXPIRED_TIME_REMEMBER_ME` | Extended expiration for "remember me" | No | `30d` | `30d`, `720h` |
| `AUTH_REFRESH_TOKEN_COOKIE_NAME` | Refresh token cookie name | No | `refreshToken` | `refreshToken` |
| `AUTH_REFRESH_TOKEN_EXPIRE_TIME` | Refresh token expiration | No | `7d` | `7d`, `168h` |
| `FRONTEND_URL` | Frontend URL for CORS allowlist | Yes | `http://localhost:5173` | `https://app.example.com` |
| `MODE` | Environment mode (affects cookie security) | Yes | `DEV` | `DEV`, `PROD` |

### Frontend (.env)

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `VITE_API_URL` | Backend API base URL | Yes | `http://localhost:3000/api` | `https://api.example.com` |

### Cookie Security Configuration

**Automatically configured based on `MODE` environment variable:**

| Setting | Development (`MODE=DEV`) | Production (`MODE=PROD`) |
|---------|--------------------------|--------------------------|
| `httpOnly` | `true` | `true` |
| `secure` | `false` | `true` (HTTPS only) |
| `sameSite` | `'lax'` | `'strict'` |
| `path` | `'/'` | `'/'` |

**Cookie Expiration:**
- **Access Token**: 24 hours (or extended to 30 days with "Remember Me")
- **Refresh Token**: 7 days

**Security Notes:**

1. **httpOnly Flag**: Prevents JavaScript access to cookies (XSS protection)
2. **Secure Flag**: Ensures cookies only sent over HTTPS in production
3. **SameSite Policy**: Prevents CSRF attacks (`strict` in production, `lax` in dev for easier testing)
4. **Short-lived Access Tokens**: Reduces exposure window if token compromised
5. **Long-lived Refresh Tokens**: Enables automatic token refresh without re-login

### Authentication Environment Variables Explained

**`AUTH_JWT_SECRET`:**
- Used to sign JWT tokens
- Must be a strong, random string (minimum 32 characters recommended)
- NEVER commit this to version control
- Use different secrets for dev/staging/production

**`AUTH_TOKEN_EXPIRE_TIME`:**
- How long access token remains valid
- Shorter = more secure but more frequent refreshes
- Recommended: 15min-24h range
- Format: `1h`, `24h`, `1d`, `86400s`

**`AUTH_REFRESH_TOKEN_EXPIRE_TIME`:**
- How long refresh token remains valid
- Longer = less frequent re-logins needed
- Recommended: 7d-30d range
- User must re-login after this expires

**`MODE`:**
- Controls cookie security flags
- `DEV`: Allows http, relaxed sameSite for local development
- `PROD`: Enforces https, strict sameSite for production security

**`FRONTEND_URL`:**
- CORS allowlist for cookie-based auth
- Must match exact origin (protocol + domain + port)
- Multiple origins: Use comma-separated list or array

## Security Architecture

### Authentication Security Model

This project uses **httpOnly cookie-based authentication** to prevent XSS token theft.

#### Why httpOnly Cookies Over localStorage?

| Attack Vector | localStorage | httpOnly Cookie | Winner |
|---------------|--------------|-----------------|--------|
| **XSS (Cross-Site Scripting)** | ❌ VULNERABLE - JS can access tokens | ✅ PROTECTED - JS cannot access | Cookie |
| **CSRF (Cross-Site Request Forgery)** | ✅ Not applicable | ⚠️ Possible (mitigated with SameSite) | Tie with mitigation |
| **Man-in-the-Middle** | ❌ Vulnerable without HTTPS | ✅ Protected with Secure flag | Cookie |
| **Token Theft via DevTools** | ❌ Visible in Application tab | ✅ Hidden from JavaScript | Cookie |

**Verdict**: httpOnly cookies are significantly more secure for web applications.

#### Security Features Implemented

1. **httpOnly Cookies**
   - Tokens inaccessible to JavaScript
   - Prevents XSS token theft
   - Automatic browser management

2. **Secure Flag (Production)**
   - Cookies only sent over HTTPS
   - Prevents man-in-the-middle token interception
   - Automatically enabled when `MODE=PROD`

3. **SameSite Policy**
   - `strict` in production: Blocks all cross-site requests
   - `lax` in development: Allows top-level navigation
   - Prevents CSRF attacks

4. **Short-lived Access Tokens**
   - 24-hour expiration (default)
   - Reduces exposure window if compromised
   - Automatic refresh via refresh token

5. **Long-lived Refresh Tokens**
   - 7-day expiration (default)
   - Enables seamless token refresh
   - Stored as httpOnly cookie

6. **CORS with Credentials**
   - Explicit origin allowlist
   - Credentials required for cookie transmission
   - Prevents unauthorized cross-origin requests

#### Threat Model & Mitigations

| Threat | Mitigation |
|--------|------------|
| XSS injects malicious script | httpOnly cookies prevent token access |
| CSRF forces unwanted actions | SameSite policy blocks cross-site requests |
| MITM intercepts tokens | Secure flag + HTTPS enforcement |
| Token stolen from localStorage | Tokens never stored in localStorage |
| Replay attack with old token | Short-lived tokens with expiration |
| Session hijacking | Token refresh rotation + device tracking (optional) |

#### Security Best Practices

**✅ DO:**
- Use httpOnly cookies for all authentication tokens
- Enable Secure flag in production (HTTPS)
- Use SameSite=Strict in production
- Implement short-lived access tokens (15min-24h)
- Implement automatic token refresh
- Log and monitor authentication failures
- Use HTTPS in production
- Rotate JWT secret regularly

**❌ DON'T:**
- Store tokens in localStorage or sessionStorage
- Return tokens in response body (use Set-Cookie headers)
- Disable httpOnly flag
- Use long-lived access tokens (>24h)
- Ignore CORS configuration
- Use SameSite=None without good reason
- Allow credentials from all origins (*)

#### Compliance Considerations

- **GDPR**: Cookies require user consent in EU
- **OWASP Top 10**: Mitigates A02:2021 (Cryptographic Failures), A07:2021 (Identification and Authentication Failures)
- **PCI DSS**: Supports secure authentication requirements
- **SOC 2**: Demonstrates security controls for authentication

#### Further Reading

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [MDN: Using HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [OWASP: Cross-Site Scripting (XSS)](https://owasp.org/www-community/attacks/xss/)

---

## External Services

| Service | Purpose | Documentation |
|---------|---------|---------------|
| Google OAuth | Social login authentication for user signup/login | [Google Identity](https://developers.google.com/identity) |
| SendGrid | Email notifications for invitations, deadline reminders, and daily digest | [SendGrid Docs](https://docs.sendgrid.com/) |
| AWS S3 | File attachment storage for documents and images uploaded to tasks | [AWS S3 Docs](https://docs.aws.amazon.com/s3/) |
