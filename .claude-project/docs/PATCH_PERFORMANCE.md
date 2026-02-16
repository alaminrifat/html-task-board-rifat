# PATCH: Performance — React 18+ APIs

> **Adds to**: `performance.md` in `.claude/`
> **Problem**: Missing `useDeferredValue`, `startTransition`, and `useEffectEvent`

---

## useDeferredValue

Defers re-rendering of non-urgent UI. Great for search/filter inputs.

```tsx
import { useState, useDeferredValue, useMemo } from 'react';

function SearchResults({ items }: { items: Item[] }) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  // Expensive filtering uses the deferred (stale) value
  const filtered = useMemo(
    () => (items ?? []).filter(item =>
      item.name.toLowerCase().includes(deferredQuery.toLowerCase())
    ),
    [items, deferredQuery]
  );

  const isStale = query !== deferredQuery;

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search..."
      />
      <div style={{ opacity: isStale ? 0.6 : 1 }}>
        {filtered.map(item => (
          <div key={item.id}>{item.name}</div>
        ))}
      </div>
    </div>
  );
}
```

**When to use**: Large lists, expensive filtering/sorting, search-as-you-type.
**NOT for**: Simple state updates, small datasets.

---

## startTransition

Marks state updates as non-urgent so urgent updates (typing, clicking) stay responsive.

```tsx
import { useState, useTransition } from 'react';

function TabContainer() {
  const [tab, setTab] = useState('home');
  const [isPending, startTransition] = useTransition();

  const switchTab = (newTab: string) => {
    // Tab highlight updates immediately
    // Content rendering is deferred
    startTransition(() => {
      setTab(newTab);
    });
  };

  return (
    <div>
      <nav>
        {['home', 'profile', 'settings'].map(t => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={tab === t ? 'active' : ''}
          >
            {t}
          </button>
        ))}
      </nav>
      <div style={{ opacity: isPending ? 0.7 : 1 }}>
        {isPending && <span>Loading...</span>}
        <TabContent tab={tab} />
      </div>
    </div>
  );
}
```

**When to use**: Tab switching, navigation, heavy re-renders after user action.
**NOT for**: Urgent feedback (form validation, button states).

### startTransition vs useDeferredValue

| Feature | startTransition | useDeferredValue |
|---------|----------------|------------------|
| Wraps | State setter calls | A value |
| Use when | You control the update | You receive props |
| Gives you | `isPending` boolean | Stale vs fresh comparison |

---

## useEffectEvent (React 19+)

Captures the latest values without re-running the effect. Prevents stale closures.

```tsx
import { useEffect, useEffectEvent } from 'react';

function ChatRoom({ roomId, theme }: { roomId: string; theme: string }) {
  // This function always sees the latest `theme`
  // but doesn't cause the effect to re-run when `theme` changes
  const onConnected = useEffectEvent(() => {
    showNotification(`Connected to ${roomId}`, theme);
  });

  useEffect(() => {
    const conn = createConnection(roomId);
    conn.on('connected', () => {
      onConnected(); // always has latest theme
    });
    return () => conn.disconnect();
  }, [roomId]); // theme NOT in deps — intentional and correct
}
```

**When to use**: Effect callbacks that need latest state/props but shouldn't re-trigger the effect.
**NOT for**: Anything outside of useEffect context.

> **Note**: `useEffectEvent` is available in React 19+. For React 18, use a ref pattern:

```tsx
// React 18 fallback
const themeRef = useRef(theme);
themeRef.current = theme;

useEffect(() => {
  const conn = createConnection(roomId);
  conn.on('connected', () => {
    showNotification(`Connected to ${roomId}`, themeRef.current);
  });
  return () => conn.disconnect();
}, [roomId]);
```

---

## Quick Reference: Which API to Use

| Problem | Solution |
|---------|----------|
| Typing feels laggy because of heavy re-renders | `useDeferredValue` on the search query |
| Tab switch freezes the UI | `startTransition` around `setTab` |
| Effect re-runs when only a callback's dependency changes | `useEffectEvent` (React 19+) or ref pattern |
| List rendering is slow | `useDeferredValue` + `useMemo` for filtered list |
| Navigation feels janky | `startTransition` around router navigation |
