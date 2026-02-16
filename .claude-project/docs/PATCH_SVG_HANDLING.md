# PATCH: SVG Handling in React

> **Adds to**: Missing guidance in `.claude/` conversion docs
> **Problem**: HTML SVGs break in JSX due to attribute naming differences

---

## Attribute Conversion Table

| HTML SVG Attribute | React JSX Attribute |
|-------------------|---------------------|
| `fill-rule` | `fillRule` |
| `clip-rule` | `clipRule` |
| `clip-path` | `clipPath` |
| `stroke-width` | `strokeWidth` |
| `stroke-linecap` | `strokeLinecap` |
| `stroke-linejoin` | `strokeLinejoin` |
| `stroke-dasharray` | `strokeDasharray` |
| `font-size` | `fontSize` |
| `text-anchor` | `textAnchor` |
| `xlink:href` | `xlinkHref` (deprecated → use `href`) |
| `xmlns` | **Remove entirely** (not needed in JSX) |
| `xmlns:xlink` | **Remove entirely** |
| `xml:space` | **Remove entirely** |

---

## Conversion Pattern

```jsx
// ❌ HTML SVG (breaks in JSX)
<svg xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="nonzero">
  <path stroke-width="2" stroke-linecap="round" d="..." />
</svg>

// ✅ React JSX
<svg fillRule="evenodd" clipRule="nonzero">
  <path strokeWidth={2} strokeLinecap="round" d="..." />
</svg>
```

---

## Best Practice: Extract as Components

```tsx
// src/components/icons/MenuIcon.tsx
interface IconProps {
  size?: number;
  className?: string;
}

export const MenuIcon = ({ size = 24, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    className={className}
  >
    <path d="M3 12h18M3 6h18M3 18h18" />
  </svg>
);
```

### Icon Index File

```tsx
// src/components/icons/index.ts
export { MenuIcon } from './MenuIcon';
export { CloseIcon } from './CloseIcon';
export { SearchIcon } from './SearchIcon';
```

### Usage

```tsx
import { MenuIcon } from '@/components/icons';

<button aria-label="Open menu">
  <MenuIcon size={20} className="text-gray-600" />
</button>
```

---

## Quick Conversion Command

```bash
# Find all SVG attributes that need conversion
grep -rn 'fill-rule\|clip-rule\|stroke-width\|stroke-linecap\|xmlns' src/ --include="*.tsx"
```
