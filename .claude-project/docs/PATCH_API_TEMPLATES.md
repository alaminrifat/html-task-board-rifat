# PATCH: API & Auth Examples — Use Generic Templates

> **Overrides**: `api-integration.md`, `authentication-architecture.md` from `.claude/`
> **Problem**: Docs hardcode "ActivityCoaching", "Coach", "Patient" roles instead of generic templates

---

## Rule

All examples in shared docs that reference a specific product name or domain-specific
roles should be treated as **templates**. Replace with your project's actual terms.

## Translation Table

| In .claude/ docs (hardcoded) | Replace with |
|------------------------------|-------------|
| `ActivityCoaching` | Your project name or `[ProjectName]` |
| `Coach` | Your admin/provider role or `[AdminRole]` |
| `Patient` | Your end-user role or `[UserRole]` |
| `/coach/dashboard` | `/{admin-role}/dashboard` |
| `/patient/profile` | `/{user-role}/profile` |

---

## Generic Role-Based Route Pattern

```typescript
// ❌ Hardcoded in .claude/ docs
const routes = {
  coach: '/coach/dashboard',
  patient: '/patient/home',
};

// ✅ Generic pattern — adapt to your project
enum Role {
  ADMIN = 'admin',
  USER = 'user',
  MEMBER = 'member',
}

const ROLE_HOME_ROUTES: Record<Role, string> = {
  [Role.ADMIN]: '/admin/dashboard',
  [Role.USER]: '/home',
  [Role.MEMBER]: '/member/overview',
};

export function getHomeRoute(role: Role): string {
  return ROLE_HOME_ROUTES[role] ?? '/';
}
```

## Generic Auth Guard

```typescript
// ❌ Hardcoded
if (user.role === 'Coach') { ... }

// ✅ Generic
if (user.role === Role.ADMIN) { ... }

// ✅ Better — permission-based
if (user.permissions.includes('manage:users')) { ... }
```

## Generic API Endpoint Pattern

```typescript
// ❌ Hardcoded in .claude/ docs
const API = {
  getCoachPatients: '/api/coach/patients',
  getPatientSessions: '/api/patient/sessions',
};

// ✅ Generic
const API = {
  getUsers: '/api/users',
  getUserSessions: (userId: string) => `/api/users/${userId}/sessions`,
  getDashboard: '/api/dashboard',
};
```
