# Design Guidelines - TaskBoard

**Last Updated:** 2026-02-16
**Source:** Extracted from 25 HTML prototypes in `.claude-project/resources/HTML/`

---

## 1. Color System

### 1.1 Brand Colors

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Primary | `#4A90D9` | `bg-[#4A90D9]` `text-[#4A90D9]` | Buttons, links, active states, brand, FAB |
| Primary Hover | `#3B82F6` | `hover:bg-[#3B82F6]` | Button hover, link hover |
| Primary Gradient | `#3A7BC8` | - | Splash page gradient end (`linear-gradient(180deg, #4A90D9 0%, #3A7BC8 100%)`) |
| Primary Light BG | `#F0F7FF` | `bg-[#F0F7FF]` | Active icon bg, unread notification bg, calendar today cell |
| Primary 10% | `#4A90D9/10` | `bg-[#4A90D9]/10` | Sidebar active bg, stat icon bg |
| Primary 15% | `#4A90D9/15` | `bg-[#4A90D9]/15` | Status pill bg (task detail) |

### 1.2 Semantic / Status Colors

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Success | `#10B981` | `text-[#10B981]` `bg-[#10B981]` | Completed status, valid password, progress bars, active dot |
| Warning | `#F59E0B` | `text-[#F59E0B]` `bg-[#F59E0B]` | High priority, due date reminder icons, chart accent |
| Error | `#EF4444` | `text-[#EF4444]` `bg-[#EF4444]` | Urgent priority, overdue, delete, suspended, notification badge |
| Purple | `#8B5CF6` | `text-[#8B5CF6]` `bg-[#8B5CF6]` | Admin role badge, design label, mention icon, chart line |
| Blue | `#3B82F6` | `text-[#3B82F6]` `bg-[#3B82F6]` | Manager role badge, medium priority dot, comment icon |

### 1.3 Text Colors

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Text Primary | `#1E293B` | `text-[#1E293B]` | Headings, body text, primary content |
| Text Secondary | `#64748B` | `text-[#64748B]` | Secondary text, labels, metadata, timestamps |
| Text Muted | `#94A3B8` | `text-[#94A3B8]` | Placeholders, inactive nav, disabled text |
| Text Comment | `#475569` | `text-[#475569]` | Comment body text |

### 1.4 Background Colors

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Page BG | `#F9FAFB` | `bg-[#F9FAFB]` | Page background, table header bg |
| Section BG | `#F1F5F9` | `bg-[#F1F5F9]` | Kanban column bg, filter chip inactive, progress bar track, task group header |
| Subtle BG | `#F8FAFC` | `bg-[#F8FAFC]` | Comment input bg, file type chip bg, calendar cell hover, modal footer |
| Alt BG | `#F3F4F6` | `bg-[#F3F4F6]` | Admin progress bar track, segmented control bg |
| Hover BG | `#E2E8F0` | `hover:bg-[#E2E8F0]` | Priority chip hover, avatar upload hover |
| Unread BG | `#F0F7FF` | `bg-[#F0F7FF]` | Unread notification row |
| Unread Hover | `#EBF5FF` | `hover:bg-[#EBF5FF]` | Unread notification hover |
| White | `#FFFFFF` | `bg-white` | Cards, inputs, modals |

### 1.5 Border Colors

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Border | `#E5E7EB` | `border-[#E5E7EB]` | All card borders, input borders, dividers, table rows |
| Border Light | `#F1F5F9` | `border-[#F1F5F9]` | Section dividers within settings cards |
| Checkbox Border | `#CBD5E1` | `border-[#CBD5E1]` | Subtask checkboxes |
| Checkbox Border Alt | `#D1D5DB` | `border-[#D1D5DB]` | Admin table checkboxes |

### 1.6 Overlay

| Token | Value | Usage |
|-------|-------|-------|
| Modal Overlay | `bg-black/30 backdrop-blur-[1px]` | Modals, drawers |
| Splash Overlay | `bg-white/5 mix-blend-overlay opacity-20` | Splash page texture |

### 1.7 Priority Colors (Board Card Dots)

| Priority | Color | Tailwind |
|----------|-------|----------|
| Urgent | `#EF4444` | `bg-red-500` |
| High | `#F97316` | `bg-orange-500` |
| Medium | `#4A90D9` | `bg-[#4A90D9]` |
| Low | `#94A3B8` | `bg-[#94A3B8]` or `bg-gray-400` |

### 1.8 Task Status Badge Colors (My Tasks)

| Status | Background | Text |
|--------|------------|------|
| To Do | `#E0F2FE` | `#0284C7` |
| In Progress | `#FEF3C7` | `#D97706` |
| Review | `#F3E8FF` | `#9333EA` |
| Done | `#10B981` (solid) | `white` |

### 1.9 Role Badge Colors (Admin)

| Role | Background | Text | Border |
|------|------------|------|--------|
| Admin | `#8B5CF6/10` | `#8B5CF6` | `#8B5CF6/20` |
| Manager | `#3B82F6/10` | `#3B82F6` | `#3B82F6/20` |
| Member | `#10B981/10` | `#10B981` | `#10B981/20` |
| Viewer | `#64748B/10` | `#64748B` | `#64748B/20` |

### 1.10 Label Colors (System Config / Board)

| Label | Dot Color | Tag BG | Tag Text |
|-------|-----------|--------|----------|
| Bug | `#EF4444` | `red-50` | `red-600` |
| Feature | `#10B981` | `emerald-50` | `emerald-600` |
| Design | `#8B5CF6` | `purple-50` | `purple-600` |
| Documentation | `#3B82F6` | `blue-50` | `blue-600` |
| Improvement | `#F59E0B` | `yellow-50` | `yellow-600` |
| Backend | - | `indigo-50` | `indigo-600` |
| Frontend | - | `teal-50` | `teal-600` |
| Research | - | `purple-50` | `purple-600` |
| QA | - | `yellow-50` | `yellow-600` |
| DevOps | - | `slate-100` | `slate-600` |
| UX | - | `purple-50` | `purple-600` |

### 1.11 User Status Indicator Colors

| Status | Dot Color |
|--------|-----------|
| Active | `#10B981` |
| Inactive | `#64748B` |
| Suspended | `#EF4444` |

---

## 2. Typography

### 2.1 Font Family

| Type | Family | Weights | CDN |
|------|--------|---------|-----|
| Primary | `'Inter', sans-serif` | 400, 500, 600, 700 | `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap` |
| Mono | System mono stack | 400 | `font-mono` (timestamps in admin table) |

Global: `body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }`

### 2.2 Size Scale (as used in prototypes)

| Tailwind | px | Usage |
|----------|----|-------|
| `text-[10px]` | 10px | Nav labels, badge text, chart axis labels, column count, timestamps, filter chips |
| `text-[11px]` | 11px | Board template subtitle |
| `text-xs` | 12px | Secondary info, badges, timestamps, links, filter text, table headers (uppercase) |
| `text-sm` | 14px | Body text, form labels, table data, sidebar nav items, section headers, comments |
| `text-base` | 16px | Task titles (my-tasks), notification content, form inputs, section headings |
| `text-lg` | 18px | Mobile page titles (header h2/h4) |
| `text-xl` | 20px | Project card titles, section headings, drawer name, "New Project" header |
| `text-2xl` | 24px | Admin page headings, stat card numbers, signup heading |
| `text-3xl` | 30px | Login page logo |
| `text-4xl` | 36px | Splash page logo (mobile) |
| `text-5xl` | 48px | Splash page logo (desktop via `md:text-5xl`) |

### 2.3 Weight Scale

| Tailwind | Value | Usage |
|----------|-------|-------|
| `font-normal` (400) | 400 | Body text, descriptions, paragraphs |
| `font-medium` (500) | 500 | Labels, nav items, card titles, badges, emphasized text |
| `font-semibold` (600) | 600 | Page headings, section titles, buttons, comment usernames, progress badge |
| `font-bold` (700) | 700 | Admin logo, sidebar brand, stat numbers, avatar initials, drawer name |

### 2.4 Letter Spacing & Line Height

| Property | Tailwind | Usage |
|----------|----------|-------|
| `tracking-tighter` | -0.05em | Splash page logo only |
| `tracking-tight` | -0.025em | All headings, stat numbers, card titles |
| `tracking-wider` | 0.05em | Task group headers (uppercase), table header labels (uppercase) |
| `leading-snug` | 1.375 | Board card titles |
| `leading-relaxed` | 1.625 | Description paragraphs, comment text |
| `leading-tight` | 1.25 | Checkbox labels, terms text |
| `leading-none` | 1.0 | Bottom nav labels |

---

## 3. Spacing

### 3.1 Common Gap Patterns

| Gap | px | Usage |
|-----|----|-------|
| `gap-0.5` | 2px | Stat label stacks, text stacks |
| `gap-1` | 4px | Icon-text pairs (small), nav icon gap, divider with text |
| `gap-1.5` | 6px | Icon-text pairs, label stacks, badge icon pairs, status indicators |
| `gap-2` | 8px | Filter chips, form fields, member list items, small grids, kanban column columns, column inputs |
| `gap-2.5` | 10px | Kanban card spacing, subtask items, dashboard grid, time entries, comment gap |
| `gap-3` | 12px | Kanban columns, header sections, member workload items, notification items, form sections, table row avatar gap, drawer info grid |
| `gap-4` | 16px | Form fields, page sections, card content, notification toggles, admin stats grid |
| `gap-5` | 20px | Modal form sections, notification preference sections |
| `gap-6` | 24px | Admin chart grid |

### 3.2 Common Padding Patterns

| Padding | px | Usage |
|---------|----|-------|
| `p-1` | 4px | Calendar cells |
| `p-2` | 8px | Member list items |
| `p-2.5` | 10px | Kanban column inner padding |
| `p-3` | 12px | Kanban cards, mobile page content, task detail sections, dashboard cards |
| `p-4` | 16px | Project cards, header padding, notification items, filter sections, drawer content |
| `p-5` | 20px | Admin stat cards, profile sections, modal body, settings sections |
| `p-6` | 24px | Admin chart cards, table cells (`px-6 py-3`/`px-6 py-4`), modal padding |
| `p-8` | 32px | Auth form cards, admin main content padding |
| `px-3.5` | 14px | Input with icon (left padding for icon area) |
| `px-[12px]` | 12px | Filter chips |

### 3.3 Section Margins

| Margin | px | Usage |
|--------|----|-------|
| `mb-2` / `mb-2.5` | 8-10px | Within-card section headers to content |
| `mb-3` | 12px | Chart title to content, section title to body |
| `mb-4` | 16px | Form sections, section spacing |
| `mb-5` | 20px | Notification preference row spacing |
| `mb-6` | 24px | Admin header to content, form sections, action bar to table |
| `mb-8` | 32px | Admin header to main content |

---

## 4. Layout

### 4.1 Page Dimensions

| Element | Value | Tailwind |
|---------|-------|----------|
| Mobile app container | 402px max-width | `max-w-[402px]` |
| Mobile container desktop border | 24px radius | `md:rounded-[24px]` |
| Mobile container desktop shadow | 2xl | `md:shadow-2xl` |
| Auth card | 402px max-width | `max-w-[402px]` |
| Admin sidebar | 240px width | `w-[240px]` |
| Admin sidebar collapsed | 64px width | `w-[64px]` (via `.collapsed`) |
| Admin sidebar header height | 64px | `h-[64px]` |
| Admin main content margin | 240px left | `ml-[240px]` |
| Admin drawer | 440px width | `w-[440px]` |
| Admin create user modal | 480px width | `w-[480px]` |
| Mobile header height | 56px | `h-[56px]` |
| Bottom nav height | 56px | `h-[56px]` |
| Kanban column width | 260px | `w-[260px]` |
| Calendar cell min-height | 72px | `min-h-[72px]` |

### 4.2 Fixed Element Heights

| Element | Height | Tailwind |
|---------|--------|----------|
| Mobile input | 48px | `h-[48px]` |
| Admin modal input | 44px | `h-[44px]` |
| Admin settings input | 40px | `h-[40px]` |
| Admin column input | 36px | `h-[36px]` |
| Mobile button | 48px | `h-[48px]` |
| Admin modal footer button | 40px | `h-[40px]` |
| Admin header action button | 36px | `h-[36px]` |
| Filter chip | 32px | `h-[32px]` |
| Admin sort dropdown | 36px | `h-9` |
| Rich text toolbar | 32px | `h-[32px]` |
| FAB button | 56x56px | `w-[56px] h-[56px]` |
| Admin nav item | 48px | `h-[48px]` |
| Summary stat card | 104px | `h-[104px]` |
| Admin chart container | 288px | `h-72` |

### 4.3 Avatar Sizes

| Context | Size | Tailwind |
|---------|------|----------|
| Board card assignee | 20px | `w-5 h-5` |
| Comments, inline | 24px | `w-6 h-6` |
| Project card members | 28px | `w-7 h-7` |
| Member initials (workload, invite) | 32px | `w-8 h-8` |
| Admin table row | 36px | `w-9 h-9` |
| Admin drawer header | 64px | `w-[64px] h-[64px]` |
| Profile page | 80px | `w-20 h-20` |
| Signup upload | 80px | `w-[80px] h-[80px]` |

### 4.4 Grid Patterns

| Context | Pattern |
|---------|---------|
| Project cards | `grid grid-cols-2 gap-[12px] px-4` |
| Dashboard summary | `grid grid-cols-2 gap-2.5` |
| Admin stats | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4` |
| Admin charts | `grid grid-cols-1 lg:grid-cols-2 gap-6` |
| Settings two-column | `grid grid-cols-1 lg:grid-cols-2 gap-6` |
| Task detail metadata | `grid grid-cols-[80px_1fr] gap-y-3` |
| Dashboard filter | `grid grid-cols-2 gap-2.5` |
| Calendar | `grid grid-cols-7 auto-rows-fr` |
| Drawer info | `grid grid-cols-2 gap-y-4 gap-x-3` |

---

## 5. Border Radius

| Tailwind | px | Usage |
|----------|----|-------|
| `rounded` | 4px | Label tags on task detail (`px-2 py-0.5 rounded`) |
| `rounded-md` | 6px | Mobile form inputs, buttons, sidebar active icon bg, segmented control items |
| `rounded-lg` | 8px | Project cards, admin inputs, kanban cards, mobile cards, admin buttons, admin sections |
| `rounded-xl` | 12px | Auth cards, mobile sections, admin stat cards, admin tables, notification groups |
| `rounded-2xl` | 16px | Filter chips (`rounded-2xl`) |
| `rounded-[6px]` | 6px | Project creation form inputs/buttons |
| `rounded-[10px]` | 10px | Board template selected card |
| `rounded-[24px]` | 24px | Mobile container on desktop |
| `rounded-full` | 9999px | Avatars, priority dots, FAB, progress bars, column badges, notification dots, toggles, file type chips, label color dots, stat icon bg |

---

## 6. Shadows

| Tailwind | Usage |
|----------|-------|
| `shadow-sm` | Cards (mobile), buttons, form elements, calendar today dot, segmented active |
| `shadow` | (default - not commonly used alone) |
| `shadow-md` | Board template hover (`hover:shadow-md`) |
| `shadow-2xl` | Mobile container on desktop, modals, drawers |
| `shadow-[0_4px_12px_rgba(74,144,217,0.3)]` | FAB button (primary-colored shadow) |
| `hover:shadow-md` | Kanban card hover |
| `hover:shadow` | Primary button hover |

### Z-Index Hierarchy

| z-index | Tailwind | Usage |
|---------|----------|-------|
| 10 | `z-10` | FAB button |
| 20 | `z-20` | Mobile header, bottom nav, filter section |
| 30 | `z-30` | Board view header, task detail header |
| 50 | `z-50` | Admin sidebar (fixed) |
| 60 | `z-[60]` | Admin modal overlay, admin drawer overlay |

---

## 7. Interactive States

### 7.1 Primary Button

| State | Classes |
|-------|---------|
| Default | `bg-[#4A90D9] text-white font-medium rounded-md shadow-sm` |
| Hover | `hover:bg-[#3B82F6] hover:shadow` |
| Active | `active:scale-[0.98]` or `active:scale-[0.99]` |
| Disabled | `disabled:opacity-50 disabled:cursor-not-allowed` (implied) |
| Loading | Replace text with spinner: `<iconify-icon icon="svg-spinners:ring-resize">` |
| Transition | `transition-all duration-200` |

### 7.2 Secondary / Outline Button

| State | Classes |
|-------|---------|
| Default | `bg-white border border-[#E5E7EB] text-[#64748B] font-medium rounded-lg` |
| Hover | `hover:bg-[#F9FAFB] hover:text-[#1E293B]` or `hover:bg-gray-50` |
| Transition | `transition-colors` or `transition-all` |

### 7.3 Danger Button

| State | Classes |
|-------|---------|
| Default | `text-[#EF4444] border border-[#E5E7EB] rounded-lg` |
| Hover | `hover:bg-red-50` or `hover:bg-red-50 hover:border-red-200` |

### 7.4 Input Fields

| State | Classes |
|-------|---------|
| Default | `bg-white border border-[#E5E7EB] rounded-md placeholder-[#94A3B8] text-[#1E293B]` |
| Focus | `focus:outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9]` |
| Error | `border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]` |
| Success | `border-[#10B981]` |
| With icon | Left icon: `pl-11`, icon container: `absolute inset-y-0 left-0 pl-3.5 pointer-events-none` |
| Icon focus color | `group-focus-within:text-[#4A90D9] transition-colors` |
| Transition | `transition: border-color 0.2s ease, box-shadow 0.2s ease` (`.input-transition` class) |

### 7.5 Card Hover

| State | Classes |
|-------|---------|
| Project card | `active:scale-[0.98] transition-transform cursor-pointer` |
| Kanban card | `hover:shadow-md transition-shadow cursor-pointer` |
| Table row | `hover:bg-gray-50 transition-colors` |
| Admin row actions | `opacity-0 group-hover:opacity-100 transition-opacity` |

### 7.6 Link States

| State | Classes |
|-------|---------|
| Default | `text-[#4A90D9]` |
| Hover | `hover:text-[#3B82F6]` or `hover:underline` |
| Transition | `transition-colors` |

### 7.7 Navigation

| State | Mobile Nav | Admin Sidebar |
|-------|-----------|---------------|
| Active | `text-[#4A90D9]` + bold-duotone icon | `bg-[#4A90D9]/10 border-l-[3px] border-[#4A90D9] text-[#4A90D9] pl-[13px]` |
| Inactive | `text-[#94A3B8]` + linear icon | `text-[#64748B] border-l-[3px] border-transparent pl-4` |
| Hover (inactive) | `hover:text-[#64748B]` | `hover:bg-gray-50` |

### 7.8 Filter Chips

| State | Classes |
|-------|---------|
| Active | `bg-[#4A90D9] text-white shadow-sm` |
| Inactive | `bg-[#F1F5F9] text-[#64748B] border border-transparent hover:border-[#E5E7EB]` |

### 7.9 Toggle Switch

| State | Track Classes | Knob Position |
|-------|--------------|---------------|
| On (large) | `w-11 h-6 bg-[#4A90D9] rounded-full` | `right-0.5 top-0.5 w-5 h-5` |
| Off (large) | `w-11 h-6 bg-[#E5E7EB] rounded-full` | `left-0.5 top-0.5 w-5 h-5` |
| On (small) | `w-9 h-5 bg-[#4A90D9] rounded-full` | `right-0.5 top-0.5 w-4 h-4` |
| Off (small) | `w-9 h-5 bg-[#E5E7EB] rounded-full` | `left-0.5 top-0.5 w-4 h-4` |
| Admin toggle | `w-[44px] h-[24px] rounded-[12px]` | Knob `w-[20px] h-[20px]`, active: `transform: translateX(20px)` |
| Track inactive color | `#CBD5E1` | (admin system config) |

### 7.10 Custom Checkbox

| State | Classes |
|-------|---------|
| Unchecked | `w-4 h-4 rounded border border-[#CBD5E1] bg-white` or `w-5 h-5 border border-[#E5E7EB] rounded bg-white` |
| Checked | `bg-[#4A90D9] border-[#4A90D9]` + white check icon |
| Hover | `group-hover:border-[#4A90D9]` or `group-hover:border-[#94A3B8]` |
| Admin checkbox | `w-[16px] h-[16px] border border-[#D1D5DB] rounded-[4px]`, checked: `bg-[#4A90D9] border-[#4A90D9]` + CSS `::after` checkmark |

### 7.11 Done Card Styling

| Property | Classes |
|----------|---------|
| Opacity | `opacity-60 hover:opacity-100` |
| Title | `line-through` |
| Priority dot | `bg-gray-400` |

---

## 8. Animations & Transitions

### 8.1 Transition Defaults

| Property | Duration | Easing | Usage |
|----------|----------|--------|-------|
| `transition-colors` | 200ms | ease | Links, nav items, icon colors, toggles |
| `transition-all` | 200ms | ease | Buttons, inputs, cards |
| `transition-transform` | 150ms | ease | Press effects (`active:scale-*`) |
| `transition-shadow` | 200ms | ease | Card hover shadow changes |
| `transition-opacity` | 200ms | ease | Action buttons reveal on row hover |

### 8.2 Sidebar Collapse

```css
aside { transition: width 300ms ease; overflow: hidden; }
aside.collapsed { width: 64px !important; }
main { transition: margin-left 300ms ease; }
```

### 8.3 Drawer Slide

```css
#user-drawer-panel { transform: translateX(100%); transition: transform 300ms ease; }
#user-drawer-overlay.open #user-drawer-panel { transform: translateX(0); }
#user-drawer-overlay { opacity: 0; transition: opacity 300ms ease; }
#user-drawer-overlay.open { opacity: 1; }
```

### 8.4 Custom Animations

| Name | Keyframes | Usage |
|------|-----------|-------|
| Splash fade-in | `0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); }` (0.3s cubic-bezier) | Splash page entry |
| Logo pulse | `0%,100% { opacity: 1; } 50% { opacity: 0.9; }` (1.5s ease-in-out infinite) | Splash logo |
| Checkbox bounce | `0% { scale(1) } 50% { scale(0.9) } 100% { scale(1) }` (0.2s cubic-bezier) | Signup checkbox |
| Spinner | `animate-spin` | Loading spinner (Iconify `solar:spinner-linear`) |

### 8.5 Press Effects

| Target | Effect |
|--------|--------|
| Project card tap | `active:scale-[0.98]` |
| Primary button press | `active:scale-[0.99]` |
| FAB press | `active:scale-90` (more dramatic) |
| Header icon tap | `active:scale-95` |

---

## 9. Component Patterns

### 9.1 Mobile App Container (User Pages)

```html
<div class="w-full max-w-[402px] bg-[#F9FAFB] relative flex flex-col h-screen
  md:h-[90vh] md:my-auto md:border md:border-[#E5E7EB] md:rounded-[24px] md:shadow-2xl overflow-hidden">
  <header class="h-[56px] bg-white border-b border-[#E5E7EB] flex items-center px-4 shrink-0 z-20">
  <main class="flex-1 overflow-y-auto">
  <nav class="absolute bottom-0 w-full h-[56px] bg-white border-t border-[#E5E7EB] flex items-center justify-between px-2 z-20">
</div>
```

### 9.2 Bottom Navigation (4 tabs)

```html
<!-- Active tab -->
<button class="flex-1 flex flex-col items-center justify-center gap-1 h-full text-[#4A90D9]">
  <iconify-icon icon="solar:{name}-bold-duotone" width="24"></iconify-icon>
  <span class="text-[10px] font-medium leading-none">Label</span>
</button>
<!-- Inactive tab -->
<button class="flex-1 flex flex-col items-center justify-center gap-1 h-full text-[#94A3B8] hover:text-[#64748B] transition-colors">
  <iconify-icon icon="solar:{name}-linear" width="24"></iconify-icon>
  <span class="text-[10px] font-medium leading-none">Label</span>
</button>
```

### 9.3 Admin Sidebar

```html
<aside class="w-[240px] bg-white border-r border-[#E5E7EB] flex flex-col flex-shrink-0 h-screen fixed left-0 top-0 z-50">
  <!-- Logo: h-[64px] px-6 -->
  <!-- Nav items: h-[48px] -->
  <!-- Active: bg-[#4A90D9]/10 border-l-[3px] border-[#4A90D9] text-[#4A90D9] pl-[13px] -->
  <!-- Inactive: text-[#64748B] border-l-[3px] border-transparent pl-4 hover:bg-gray-50 -->
  <!-- Collapse footer: p-4 border-t border-[#E5E7EB] -->
</aside>
```

### 9.4 Admin Breadcrumb

```html
<div class="flex items-center gap-2 text-sm text-[#64748B]">
  <span>Admin</span>
  <iconify-icon icon="solar:alt-arrow-right-linear" width="12"></iconify-icon>
  <span class="text-[#1E293B] font-medium">Page Name</span>
</div>
```

### 9.5 Project Card (Grid)

```html
<div class="bg-white p-4 rounded-lg border border-[#E5E7EB] flex flex-col justify-between h-[180px]
  active:scale-[0.98] transition-transform cursor-pointer">
  <!-- Title: text-xl font-medium tracking-tight line-clamp-2 -->
  <!-- Member avatars: -space-x-2, w-7 h-7 rounded-full border-2 border-white -->
  <!-- Progress bar: h-1 bg-[#E5E7EB] rounded-full, fill: bg-[#4A90D9] -->
  <!-- Footer: calendar icon + date, task count -->
</div>
```

### 9.6 Kanban Card

```html
<div class="bg-white p-3 rounded-lg border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow cursor-pointer">
  <!-- Priority dot: w-2 h-2 rounded-full -->
  <!-- Title: text-sm font-medium leading-snug -->
  <!-- Labels: h-5 px-1.5 rounded-full bg-{color}-50 text-{color}-600 text-[10px] font-medium -->
  <!-- Footer: assignee avatar w-5 h-5, date/comments text-[10px] -->
</div>
```

### 9.7 Kanban Column

```html
<div class="w-[260px] h-full flex flex-col bg-[#F1F5F9] rounded-xl p-2.5 shrink-0">
  <!-- Header: flex justify-between mb-2.5 px-1 -->
  <!-- Title: text-sm font-semibold -->
  <!-- Count badge: bg-[#94A3B8] text-white text-[10px] px-1.5 py-0.5 rounded-full -->
  <!-- WIP indicator: text-[10px] font-medium text-[#94A3B8] (e.g., "3/5") -->
  <!-- Add button: w-7 h-7 rounded-full bg-white shadow-sm -->
  <!-- Cards container: flex-1 overflow-y-auto flex flex-col gap-2.5 -->
</div>
```

### 9.8 Admin Data Table

```html
<div class="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
  <table class="w-full text-left border-collapse">
    <thead class="bg-[#F9FAFB] border-b border-[#E5E7EB]">
      <th class="px-6 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wider">
    </thead>
    <tbody class="divide-y divide-[#E5E7EB]">
      <tr class="hover:bg-gray-50 transition-colors group">
        <td class="px-6 py-4 text-sm text-[#64748B]">
        <!-- Row actions: opacity-0 group-hover:opacity-100 transition-opacity -->
      </tr>
    </tbody>
  </table>
  <!-- Pagination footer: px-6 py-4 border-t -->
</div>
```

### 9.9 Pagination

```html
<div class="flex items-center border border-[#E5E7EB] rounded-lg overflow-hidden">
  <button class="px-3 py-1.5 text-sm text-[#64748B] border-r border-[#E5E7EB]" disabled>Previous</button>
  <button class="px-3 py-1.5 text-sm bg-[#4A90D9] text-white font-medium border-r border-[#E5E7EB]">1</button>
  <button class="px-3 py-1.5 text-sm text-[#64748B] hover:bg-gray-50 border-r border-[#E5E7EB]">2</button>
  <button class="px-3 py-1.5 text-sm text-[#64748B]">Next</button>
</div>
<!-- Per-page: select with 10/25/50/100 options -->
<!-- Info text: "Showing 1-10 of 156 users" -->
```

### 9.10 Modal

```html
<div class="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[1px] flex items-center justify-center p-4">
  <div class="w-[480px] max-h-[90vh] bg-white rounded-xl shadow-2xl border border-[#E5E7EB] flex flex-col overflow-hidden">
    <!-- Header: px-6 py-5 border-b, icon in rounded-lg bg-[#4A90D9]/10 -->
    <!-- Body: px-6 py-5 flex flex-col gap-5 overflow-y-auto -->
    <!-- Footer: px-6 py-4 border-t bg-[#F9FAFB] flex justify-end gap-3 -->
  </div>
</div>
```

### 9.11 Drawer

```html
<div id="overlay" class="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[1px]">
  <div class="absolute right-0 top-0 h-full w-[440px] bg-white shadow-2xl flex flex-col">
    <!-- Header: centered profile, px-5 pt-5 pb-6 border-b -->
    <!-- Content: flex-1 overflow-y-auto -->
    <!-- Tabs: border-b, active tab has border-b-[2px] border-[#4A90D9] text-[#4A90D9] -->
    <!-- Footer: p-4 border-t, delete + close buttons -->
  </div>
</div>
```

### 9.12 Stat Card (Dashboard)

```html
<!-- Mobile (project dashboard) -->
<div class="bg-white border border-[#E5E7EB] rounded-lg p-3 flex flex-col justify-between h-[104px] shadow-sm">
  <!-- Label: text-[10px] font-medium text-[#64748B] -->
  <!-- Value: text-2xl font-bold tracking-tight -->
  <!-- Icon BG: w-8 h-8 rounded-full bg-{color}/10 text-{color} -->
</div>

<!-- Admin (wider) -->
<div class="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm flex flex-col gap-4">
  <!-- Label: text-sm font-medium text-[#64748B] -->
  <!-- Value: text-2xl font-semibold tracking-tight mt-1 -->
  <!-- Icon BG: w-10 h-10 rounded-full bg-{color}/10 text-{color} -->
  <!-- Trend: text-xs text-emerald-500 with trend icon -->
</div>
```

### 9.13 FAB (Floating Action Button)

```html
<button class="absolute bottom-[calc(56px+24px)] right-4 w-[56px] h-[56px] rounded-full
  bg-[#4A90D9] text-white flex items-center justify-center
  shadow-[0_4px_12px_rgba(74,144,217,0.3)] hover:bg-[#3B82F6] active:scale-90 transition-all z-10">
  <!-- Plus icon: 28x28 SVG -->
</button>
```

### 9.14 Notification Item

```html
<!-- Unread -->
<div class="flex items-start gap-3 p-4 bg-[#F0F7FF] border-b border-[#E5E7EB] relative hover:bg-[#EBF5FF] cursor-pointer">
  <div class="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#4A90D9]"></div>
  <!-- Icon: colored by type (blue=assigned, amber=due, purple=mention, green=status, blue=comment) -->
  <!-- Content: text-base leading-snug, bold names/tasks -->
  <!-- Timestamp: text-xs text-[#64748B] -->
</div>

<!-- Read -->
<div class="flex items-start gap-3 p-4 bg-white border-b border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer">
  <!-- No unread dot, icon offset ml-4 instead of ml-2 -->
</div>
```

### 9.15 Settings Section (Admin)

```html
<section class="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
  <div class="px-6 py-4 border-b border-[#F1F5F9] flex items-center gap-3">
    <div class="w-9 h-9 rounded-lg bg-{color}/10 text-{color}"><!-- icon --></div>
    <div>
      <h4 class="text-sm font-semibold text-[#1E293B]">Section Title</h4>
      <p class="text-xs text-[#64748B]">Description</p>
    </div>
  </div>
  <div class="px-6 py-5 flex flex-col gap-0">
    <!-- Fields separated by: pb-5 border-b border-[#F1F5F9] / pt-5 -->
  </div>
</section>
```

### 9.16 Segmented Control (Profile)

```html
<div class="flex bg-[#F3F4F6] rounded-md p-0.5 h-8 items-center">
  <button class="px-3 h-full text-xs font-medium text-[#64748B] rounded hover:text-[#1E293B]">Off</button>
  <button class="px-3 h-full bg-white text-[#1E293B] shadow-sm rounded text-xs font-medium border border-[#E5E7EB]">Daily</button>
  <button class="px-3 h-full text-xs font-medium text-[#64748B] rounded hover:text-[#1E293B]">Weekly</button>
</div>
```

### 9.17 Period Filter (Admin Dashboard)

```html
<div class="flex items-center bg-white p-1 rounded-lg border border-[#E5E7EB] shadow-sm">
  <button class="px-3 py-1.5 text-xs font-medium text-[#64748B] rounded-md">Today</button>
  <button class="px-3 py-1.5 text-xs font-medium bg-[#4A90D9] text-white rounded-md shadow-sm">Last 7 Days</button>
  <button class="px-3 py-1.5 text-xs font-medium text-[#64748B] rounded-md">Last 30 Days</button>
  <button class="px-3 py-1.5 text-xs font-medium text-[#64748B] rounded-md">Custom</button>
</div>
```

### 9.18 Progress Bar

| Context | Track | Fill | Height |
|---------|-------|------|--------|
| Project card | `bg-[#E5E7EB] rounded-full` | `bg-[#4A90D9] rounded-full` | `h-1` |
| Task detail subtask | `bg-[#F1F5F9] rounded-full` | `bg-[#10B981] rounded-full` | `h-1` |
| Dashboard workload | `bg-[#F1F5F9] rounded-full` | `bg-[#4A90D9] rounded-full` | `h-1.5` |
| Dashboard status chart | `bg-[#F1F5F9] rounded-full` | `bg-[#4A90D9] rounded-full` or `bg-[#10B981]` | `h-2` |
| Admin top projects | `bg-[#F3F4F6] rounded-full` | `bg-[#F59E0B] rounded-full` | `h-2` |

---

## 10. Icon System

### 10.1 Library

- **Provider:** Iconify
- **Icon Set:** Solar (`solar:*`)
- **CDN:** `https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js`
- **Element:** `<iconify-icon icon="solar:{name}" width="{size}"></iconify-icon>`

### 10.2 Naming Convention

| State | Suffix | Example |
|-------|--------|---------|
| Default/Inactive | `-linear` | `solar:bell-linear` |
| Active/Selected | `-bold-duotone` | `solar:bell-bold-duotone` |
| Filled/Completed | `-bold` | `solar:check-circle-bold` |

### 10.3 Common Icon Sizes

| px | Usage |
|----|-------|
| 12 | Inline with text-[10px], breadcrumb arrows, small indicators |
| 14 | Inline with text-xs, calendar icons, status indicators |
| 16 | Small buttons, action icons, table actions, form icons |
| 18 | Search icon, nav arrows, drag handles |
| 20 | Navigation icons, input left icons, sidebar nav, header action icons |
| 22 | Back arrow in mobile headers |
| 24 | Bottom nav icons, header search/grid icons, sidebar close icon |
| 28 | FAB plus icon (SVG) |
| 32 | Signup avatar camera icon |

### 10.4 Frequently Used Icons

| Icon | Identifier | Context |
|------|-----------|---------|
| Back | `solar:arrow-left-linear` | Mobile headers |
| Calendar | `solar:calendar-linear` | Date fields, due dates |
| Search | `solar:magnifer-linear` | Search inputs |
| Settings | `solar:settings-linear` | Settings navigation |
| Trash | `solar:trash-bin-trash-linear` | Delete actions |
| Close | `solar:close-circle-linear` | Close buttons |
| Add | `solar:add-circle-linear` | Add buttons |
| Check | `solar:check-circle-bold` | Completed items |
| Comment | `solar:chat-round-line-linear` | Comment count |
| Attachment | `solar:paperclip-linear` | Attachment count |
| Timer | `solar:play-circle-linear` | Start timer |
| Export | `solar:export-linear` | CSV export |
| Eye | `solar:eye-linear` / `solar:eye-closed-linear` | Password toggle |
| Warning | `solar:danger-circle-linear` | Overdue, alerts |
| Trend Up | `solar:trend-up-linear` or `solar:arrow-right-up-linear` | Positive stats |
| Spinner | `svg-spinners:ring-resize` | Loading buttons |

---

## 11. Scrollbar Styles

### Hidden Scrollbar

```css
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
```

Used on: kanban board, filter chip rows, mobile pages

### Custom Scrollbar (Admin)

```css
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #E5E7EB; border-radius: 20px; }
```

Used on: admin main content, admin table containers, drawers

---

## 12. Dividers

| Type | Tailwind | Usage |
|------|----------|-------|
| Standard | `border-b border-[#E5E7EB]` | Between cards, table rows, header/content |
| Section (within card) | `border-b border-[#F1F5F9]` | Between settings fields |
| Dashed | `border-t border-dashed border-[#E5E7EB]` | Time tracking total separator, "add label" separator |
| Horizontal line | `h-px bg-[#E5E7EB]` | Profile notification preferences |
| Vertical | `w-[1px] h-4 bg-[#E5E7EB]` | Rich text toolbar separator |
| Vertical timeline | `w-0.5 h-7 rounded-full bg-[#E5E7EB]` | Time entry indicators |
| "Or" divider | `h-px bg-[#E5E7EB] flex-1` with center text `text-xs text-[#64748B]` | Login "Or continue with" |

---

## 13. Responsive Strategy

### Mobile-First Approach

All user-facing pages are built mobile-first at `max-w-[402px]`. On desktop (`md:` breakpoint), they render as a centered phone preview with:
- `md:h-[90vh] md:my-auto`
- `md:border md:border-[#E5E7EB] md:rounded-[24px] md:shadow-2xl`

### Admin Dashboard

Admin pages use a fixed sidebar + scrollable main layout:
- Sidebar: `w-[240px] fixed left-0 top-0 h-screen`
- Main: `ml-[240px] flex-1 h-screen overflow-y-auto p-8`
- Grid columns: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` (stats), `grid-cols-1 lg:grid-cols-2` (charts/settings)
- Sidebar collapse: CSS class toggle, sidebar narrows to `64px`, nav text hides

### Global Styles

```css
* { -webkit-tap-highlight-color: transparent; }
body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
```

---

*Extracted from 25 HTML prototypes. All values are actual CSS/Tailwind classes used in the prototypes.*
