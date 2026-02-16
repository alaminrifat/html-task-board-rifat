# PATCH: Passing Data Between Pages (react-router)

> **Adds to**: Missing pattern in `.claude/` docs
> **Problem**: No guidance on sharing data via navigation state

---

## Pattern: Navigate with State

### Sending Data

```tsx
import { useNavigate } from 'react-router-dom';

function SubmitEmail() {
  const navigate = useNavigate();

  const handleSubmit = (email: string) => {
    // Pass data to next page via router state
    navigate('/auth/otp', {
      state: { email },
    });
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const email = new FormData(e.currentTarget).get('email') as string;
      handleSubmit(email);
    }}>
      <input name="email" type="email" required />
      <button type="submit">Send OTP</button>
    </form>
  );
}
```

### Receiving Data (with Safety)

```tsx
import { useLocation, Navigate } from 'react-router-dom';

interface OtpPageState {
  email: string;
}

function OtpPage() {
  const location = useLocation();
  const state = location.state as OtpPageState | null;

  // Guard: redirect if no state (user navigated directly)
  if (!state?.email) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <div>
      <p>OTP sent to {state.email}</p>
      {/* OTP input form */}
    </div>
  );
}
```

---

## When to Use Each Pattern

| Method | Use When |
|--------|----------|
| **Router state** | Passing data to the next page (ephemeral, lost on refresh) |
| **URL params** `/users/:id` | Resource identifier that should be bookmarkable |
| **Query params** `?tab=settings` | Filters, search terms, UI state that should be shareable |
| **Context/Store** | Data needed by many components across routes |

---

## Important: Router State is Ephemeral

State is lost on page refresh. Always handle the missing state case:

```tsx
const state = location.state as ExpectedState | null;

if (!state) {
  // Option A: Redirect
  return <Navigate to="/fallback" replace />;

  // Option B: Fetch from API using URL params
  // const { id } = useParams();
  // useEffect(() => fetchData(id), [id]);
}
```
