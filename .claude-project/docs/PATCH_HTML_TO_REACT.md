# PATCH: HTML to React Conversion

> **Adds to**: Workflow guidance missing from `.claude/`
> **Problem**: HTML→React conversions skip files, lose elements, and lack verification

---

## Mandatory Workflow

### Step 1 — Inventory (BLOCKING)

**DO NOT write any React code until this table is complete.**

```bash
# Generate file list
find . -name "*.html" -not -path "./node_modules/*" | sort
```

Fill this table for EVERY file:

| # | HTML File | React Component | Route | Status |
|---|-----------|-----------------|-------|--------|
| 1 | index.html | HomePage.tsx | / | ❌ Not Started |
| 2 | login.html | LoginPage.tsx | /login | ❌ Not Started |
| 3 | ... | ... | ... | ... |

**Checkpoint**: All HTML files listed? → Proceed. Any missing? → STOP.

---

### Step 2 — Convert Each File

For EACH file in the inventory:

#### 2a. Count Source Elements
```bash
grep -o '<[a-zA-Z]' source.html | wc -l
```

#### 2b. Convert Following These Rules

**Structure mapping:**
- `<header>` → `<header>` or `<Header />` component
- `<nav>` → `<nav>` or `<Navigation />` component
- `<main>` → `<main>` or page content area
- `<footer>` → `<footer>` or `<Footer />` component
- `<section>` → appropriate semantic element or component
- `<form>` → React controlled form (see PATCH_MULTISTEP_FORM.md)

**Attribute conversion:**
- `class=` → `className=`
- `for=` → `htmlFor=`
- `onclick=` → `onClick=`
- `tabindex=` → `tabIndex=`
- `fill-rule=` → `fillRule=`
- `clip-rule=` → `clipRule=`
- `stroke-width=` → `strokeWidth=`
- Inline `style="color: red"` → `style={{ color: 'red' }}`

**Links:**
- `<a href="/page">` → `<Link to="/page">` (react-router)
- External links stay as `<a>` with `target="_blank" rel="noopener noreferrer"`

**Images:**
- `<img src="...">` → `<img src={...} alt="descriptive text" />`
- Always add `alt` attribute
- Self-close the tag

**SVGs:** See `PATCH_SVG_HANDLING.md`

#### 2c. Count Output Elements
```bash
grep -o '<[a-zA-Z]' Output.tsx | wc -l
```

#### 2d. Verify (BLOCKING)

| Check | Pass? |
|-------|-------|
| Element count within ±10% of source | |
| All text content preserved | |
| All images/media referenced | |
| All links converted | |
| All forms converted to controlled components | |
| Defensive patterns applied (arrays, optional chaining) | |
| SSR-safe (no bare localStorage/window) | |

**Failed any check? → Fix before moving to next file.**

#### 2e. Update Inventory

Mark file as ✅ Complete in the tracking table.

---

### Step 3 — Final Verification (BLOCKING)

```bash
# All files converted?
echo "HTML files:" && find . -name "*.html" -not -path "./node_modules/*" | wc -l
echo "TSX pages:" && find src/ -name "*Page.tsx" -o -name "*page.tsx" | wc -l
```

Counts should match. If not, find and convert missing files.

---

## Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| Forgetting to convert inline event handlers | Search for `on[A-Z]` in HTML, convert all |
| Missing self-closing tags | `<img>`, `<br>`, `<hr>`, `<input>` → must self-close in JSX |
| Leaving `<!-- comments -->` | Convert to `{/* comments */}` |
| Hardcoding text | Extract to i18n keys (see PATCH_I18N_GUIDE.md) |
