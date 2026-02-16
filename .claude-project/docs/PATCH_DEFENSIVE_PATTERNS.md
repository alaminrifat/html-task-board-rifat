# PATCH: Defensive Patterns

> **Overrides**: `best-practices.md` from `.claude/`
> **Problem**: Unguarded `.map()` calls crash when data is `undefined` or not an array

---

## The Rule

**Every array method MUST have a guard.** No exceptions.

---

## Array Operations

```typescript
// ❌ NEVER — crashes when users is undefined/null
{users.map(u => <div>{u.name}</div>)}

// ✅ Option A — Nullish coalescing (preferred)
{(users ?? []).map(u => <div>{u.name}</div>)}

// ✅ Option B — Type check
{Array.isArray(users) && users.map(u => <div>{u.name}</div>)}

// ✅ Option C — Default parameter in destructuring
const { items = [] } = data ?? {};
{items.map(item => <Item key={item.id} {...item} />)}
```

### Apply to ALL array methods

```typescript
// .filter()
const active = (users ?? []).filter(u => u.isActive);

// .reduce()
const total = (items ?? []).reduce((sum, item) => sum + item.price, 0);

// .find()
const admin = (users ?? []).find(u => u.role === 'admin');

// .some() / .every()
const hasAdmin = (users ?? []).some(u => u.role === 'admin');
```

---

## Object Access

```typescript
// ❌ NEVER — crashes when user is undefined
{user.name}
{user.address.city}

// ✅ ALWAYS — optional chaining
{user?.name}
{user?.address?.city ?? 'N/A'}
```

---

## Component State Handling

Every component that receives data MUST handle 4 states:

```tsx
function UserList({ users, isLoading, error }: Props) {
  // 1. Loading
  if (isLoading) return <Skeleton />;

  // 2. Error
  if (error) return <ErrorMessage error={error} />;

  // 3. Empty
  if (!users || users.length === 0) return <EmptyState message="No users found" />;

  // 4. Success
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

---

## API Response Handling

```typescript
// ❌ NEVER — assumes response shape
const users = response.data.users;

// ✅ ALWAYS — safe extraction
const users = response?.data?.users ?? [];
```

---

## Quick Audit Command

```bash
# Find unguarded .map() calls
grep -rn '\.map(' src/ --include="*.tsx" --include="*.ts" | grep -v '??' | grep -v 'Array.isArray' | grep -v '?\.map'
```
