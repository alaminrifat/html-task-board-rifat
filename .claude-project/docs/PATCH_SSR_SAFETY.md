# PATCH: SSR Safety

> **Overrides**: `loading-and-error-states.md`, `best-practices.md` from `.claude/`
> **Problem**: Bare `localStorage` and `window` calls crash in SSR (Next.js, Remix, etc.)

---

## The Rule

**Every browser API call MUST be wrapped.** No exceptions.

---

## Safe Patterns

### localStorage / sessionStorage

```typescript
// ❌ NEVER — crashes in SSR
localStorage.getItem('token');
localStorage.removeItem('token');

// ✅ ALWAYS — SSR-safe utility
export const safeStorage = {
  get(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage full or unavailable
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Storage may be unavailable
    }
  },
};
```

### window.location

```typescript
// ❌ NEVER
window.location.href = '/login';

// ✅ ALWAYS
if (typeof window !== 'undefined') {
  window.location.href = '/login';
}

// ✅ BETTER — use router
const router = useRouter(); // or useNavigate()
router.push('/login');
```

### Unauthorized Handler (Fixed)

```typescript
// This replaces the broken version in loading-and-error-states.md
export const handleUnauthorized = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('token');
    } catch {
      // Storage may be unavailable
    }
    window.location.href = '/login';
  }
};
```

### Custom Hook for Safe Browser APIs

```typescript
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) setValue(JSON.parse(stored));
    } catch {
      // Use initial value
    }
  }, [key]);

  const setStored = (newValue: T) => {
    setValue(newValue);
    try {
      localStorage.setItem(key, JSON.stringify(newValue));
    } catch {
      // Storage unavailable
    }
  };

  return [value, setStored] as const;
}
```

---

## Quick Check

Before committing any file, search for bare usage:

```bash
# Find unsafe localStorage
grep -rn 'localStorage\.' src/ --include="*.ts" --include="*.tsx" | grep -v 'typeof window'

# Find unsafe window references
grep -rn 'window\.' src/ --include="*.ts" --include="*.tsx" | grep -v 'typeof window'
```
