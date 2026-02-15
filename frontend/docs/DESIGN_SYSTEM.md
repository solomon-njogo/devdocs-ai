# DevDocs AI Design System

Single source of truth for colors, typography, spacing, and components across the frontend. Use design tokens and UI components from this system; avoid hardcoding colors or spacing.

## Principles

- **Consistency**: Use tokens for all visual decisions so the app feels coherent.
- **Accessibility**: Focus rings, contrast, and reduced-motion are built into tokens and components.
- **Responsive**: Mobile-first; use `sm:`, `md:`, `lg:` breakpoints for layout and typography.

## Theming (dark and light mode)

The app supports **dark and light mode**. Theme is controlled by a **class** on `<html>`: no class = light, `.dark` = dark.

- **ThemeProvider**: A client component in the root layout reads `localStorage` key `devdocs-theme` (`"light"` | `"dark"` | `"system"`) and system preference, then sets `document.documentElement.classList`. Use `useTheme()` from `@/components/theme-provider` to read or set theme.
- **ThemeToggle**: Optional control that cycles light → dark → system. Import from `@/components/theme-toggle` and place in header or settings.
- **Tokens**: All color tokens are defined for both themes in `styles/design-tokens.css` (`:root` = light, `.dark` = dark). Use token-based Tailwind classes; they switch automatically with the theme.

## Token reference

Tokens are defined in `styles/design-tokens.css` and exposed to Tailwind via `@theme`. Color values below are theme-dependent (light vs dark); use the Tailwind class names so the correct value is applied automatically.

### Colors

| Token (Tailwind class) | Usage |
|------------------------|--------|
| `bg-bg-primary` | Page background |
| `bg-bg-secondary` | Secondary background, cards |
| `surface-sidebar`, `surface-header`, `surface-editor` | Layout surfaces |
| `surface-hover` | Hover states |
| `surface-border` | Borders |
| `action-primary`, `action-primary-hover` | Primary buttons, links |
| `action-success` / `action-success-hover` | Success actions |
| `text-primary` | Primary text |
| `text-secondary` | Secondary text |
| `text-muted` | Muted, placeholders |
| `text-faded` | Faded labels |
| `semantic-success-text` / `semantic-success-bg` | Success states |
| `semantic-error-text` / `semantic-error-bg` | Errors |
| `semantic-warning-text` / `semantic-warning-bg` | Warnings |
| `semantic-info-text` / `semantic-info-bg` | Info |
| `ring` | Focus ring |

### Typography

- **Fonts**: `font-ui` (Inter), `font-mono` (JetBrains Mono). Set on `body` via layout.
- **Sizes**: `text-xs` (10px), `text-sm` (12px), `text-base` (14px), `text-md` (16px), `text-lg` (18px), `text-xl` (20px).
- **Weights**: `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700).
- **Line heights**: `leading-tight` (1.25), `leading-normal` (1.5), `leading-relaxed` (1.625), `leading-editor` (24px).

### Spacing

4/8px scale: `spacing-0` through `spacing-24` (0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px). Use as `p-4`, `m-2`, `gap-3`, etc.

### Border radius

- `radius-sm`: 4px  
- `radius-input`: 6px  
- `radius-button` / `radius-md`: 8px  
- `radius-badge`: 9999px (pill)  
- `radius-lg`: 12px  

Use Tailwind: `rounded-radius-input`, `rounded-radius-button`, etc.

### Shadows

- `shadow-sm`, `shadow-md`, `shadow-lg` — dark-theme friendly, use for cards and overlays.

### Motion

- Durations: `duration-fast` (150ms), `duration-normal` (200ms), `duration-slow` (300ms).  
- Easing: `ease-default` (cubic-bezier).  
- Respects `prefers-reduced-motion: reduce` (durations set to 0).

### Z-index

- `z-dropdown`: 1000  
- `z-sticky`: 1020  
- `z-modal`: 1050  
- `z-toast`: 1100  

Use CSS variable or Tailwind: `z-[1000]` etc. if utilities are not generated.

### Layout

- Sidebar left: `250px`  
- Sidebar right: `300px`  
- Header height: `64px`  
- Status bar height: `24px`  

Use `var(--width-sidebar-left)` or fixed widths in layout components.

### Breakpoints

Use Tailwind defaults: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px), `2xl` (1536px). Mobile-first: base styles for mobile, then `sm:`, `md:`, `lg:` for larger screens.

## shadcn/ui

Use **shadcn/ui** for complex patterns only. Add components **on demand** via:

```bash
npx shadcn@canary add <component>
```

Use shadcn for: **DropdownMenu**, **Dialog**, **AlertDialog**, **Select**, **Tabs**, **Tooltip**, **Sheet**, **Popover**, **Command**. Do not add every component upfront; add when a feature needs a dropdown, modal, select, tabs, etc. Do not replace the design-system **Button**, **Input**, **Badge**, **Card**, or **Alert** with shadcn equivalents—keep using `@/components/ui` for those. Do not overuse (e.g. shadcn Button for every button) or underuse (hand-rolling dropdowns/modals instead of shadcn).

## Design-system components

Import from `@/components/ui` (or `components/ui`). Use these for simple actions, fields, labels, containers, and inline alerts.

### Button

Variants: `primary`, `secondary`, `ghost`, `danger`. Sizes: `sm`, `md`, `lg`. Optional `leftIcon` / `rightIcon`.

```tsx
import { Button } from "@/components/ui";

<Button variant="primary" size="md">Save</Button>
<Button variant="secondary" size="sm" leftIcon={<Icon />}>Cancel</Button>
```

### Input

Supports `label`, `error`, `hint`, `leftAddon`, `rightAddon`. Uses design system border, radius, focus ring.

```tsx
import { Input } from "@/components/ui";

<Input label="Email" placeholder="you@example.com" />
<Input label="Repo" error="Required" />
```

### Badge

Variants: `success`, `error`, `warning`, `info`, `neutral`. Pill shape, uppercase.

```tsx
import { Badge } from "@/components/ui";

<Badge variant="success">Done</Badge>
<Badge variant="neutral">Draft</Badge>
```

### Card

Optional `title` and `footer`. Set `elevated` for shadow.

```tsx
import { Card } from "@/components/ui";

<Card title="Section" footer={<Button>Action</Button>} elevated>
  Content here.
</Card>
```

### Alert

Variants: `success`, `error`, `warning`, `info`. Optional `title`.

```tsx
import { Alert } from "@/components/ui";

<Alert variant="error" title="Error">Something went wrong.</Alert>
```

## Responsive

- Build for small screens first; add `md:` and `lg:` for layout (e.g. sidebars, grid columns).
- Use responsive spacing and text when needed: `text-base md:text-md`, `p-4 lg:p-6`.

## Accessibility

- **Focus**: Interactive elements use `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`. Do not remove focus styles.
- **Contrast**: Text on `bg-primary` and `bg-secondary` meets WCAG AA for the defined text colors.
- **Reduced motion**: Token durations are overridden to 0 when `prefers-reduced-motion: reduce` is set.

## Files

- `config/design-system.json` — Canonical token spec (optional reference).  
- `styles/design-tokens.css` — CSS variables and `@theme` for Tailwind; light (`:root`) and dark (`.dark`).  
- `app/globals.css` — Imports tokens and sets body from tokens.  
- `components/theme-provider.tsx` — Client theme provider; storage key `devdocs-theme`.  
- `components/theme-toggle.tsx` — Optional theme toggle (light/dark/system).  
- `components/ui/*` — Button, Input, Badge, Card, Alert (design-system primitives).  
- `lib/design-tokens.ts` — Optional TS constants for non-CSS usage (e.g. charts).
