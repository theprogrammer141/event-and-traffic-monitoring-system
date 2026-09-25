# Articulate-AI — Frontend Design System & UI Architecture

Welcome to the **Articulate-AI** Design System. This document defines the visual principles, color tokens, typography rules, component patterns, and interaction standards for the frontend application.

---

## 1. Visual Philosophy: *Cyber-Observability & Dark Glass*

Articulate-AI is an operational incident monitoring and AI intelligence platform. The user interface must feel like a mission-critical command center:
- **High Contrast**: Deep obsidian/space dark canvas (`#080C14`) creates immediate contrast against alert states and vibrant indicators.
- **Glassmorphism**: Elevated cards use translucent slate fills (`rgba(15, 23, 42, 0.75)`) with subtle hairline borders (`rgba(255, 255, 255, 0.08)`) and backdrop blur (`12px`).
- **Physical Depth**: Subtle colored shadows and glow halos emphasize urgency and AI interaction without visual clutter.

---

## 2. Design Tokens

### A. Semantic Color Palette

| Token | CSS Variable | Hex / Value | Purpose |
| :--- | :--- | :--- | :--- |
| **Canvas Base** | `--bg-base` | `#080C14` | Deepest application background |
| **Surface** | `--bg-surface` | `rgba(15, 23, 42, 0.75)` | Cards, tables, modals with glass blur |
| **Surface Hover** | `--bg-surface-hover` | `rgba(30, 41, 59, 0.65)` | Interactive list items, hoverable cards |
| **Subtle Border** | `--border-subtle` | `rgba(255, 255, 255, 0.08)` | Hairline dividers and card borders |
| **Focus Border** | `--border-focus` | `rgba(99, 102, 241, 0.5)` | Active form controls, selected tabs |
| **Brand Primary** | `--color-brand` | `#6366F1` | Electric Indigo: primary CTAs, active highlights |
| **Brand Glow** | `--color-brand-glow`| `rgba(99, 102, 241, 0.25)` | Glow shadows behind AI badges and cards |
| **Critical** | `--severity-critical`| `#F43F5E` | Neon Rose: server crashes, high-impact alerts |
| **Critical Glow** | `--severity-critical-glow`| `rgba(244, 63, 94, 0.25)` | Glow aura for critical alert indicators |
| **High** | `--severity-high` | `#F59E0B` | Amber Flame: traffic spikes, latency warnings |
| **Medium** | `--severity-medium` | `#06B6D4` | Electric Cyan: moderate operational events |
| **Low** | `--severity-low` | `#64748B` | Slate: routine low-urgency notifications |
| **Online / Health** | `--status-online` | `#10B981` | Emerald: live pipeline heartbeat, resolved states |
| **Text Primary** | `--text-primary` | `#F8FAFC` | Headings, primary metrics, high contrast text |
| **Text Secondary** | `--text-secondary` | `#94A3B8` | Subtitles, labels, descriptions |
| **Text Muted** | `--text-muted` | `#64748B` | Timestamps, IDs, helper captions |

---

## 3. Typography

- **Primary Font Family**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  - Clean, geometric, and optimized for high-density dashboard interfaces.
- **Monospace Font Family**: `'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, monospace`
  - Used for Event IDs, timestamps, AI model tags, and technical payload details.

### Type Scale

| Style | Size | Weight | Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- |
| **Display / KPI** | `32px` | 700 (Bold) | `1.2` | `-0.025em` |
| **Heading 1** | `24px` | 700 (Bold) | `1.3` | `-0.02em` |
| **Heading 2** | `18px` | 600 (Semibold) | `1.4` | `-0.01em` |
| **Body (Default)**| `14px` | 400 (Regular) | `1.6` | `0` |
| **Body Medium** | `14px` | 500 (Medium) | `1.6` | `0` |
| **Caption / Badge**| `11px` | 600 (Semibold) | `1.4` | `+0.05em` (Uppercase) |
| **Code / Mono** | `12px` | 500 (Medium) | `1.5` | `0` |

---

## 4. Component Hierarchy & Anatomy

### 1. Navigation & System Status Bar
- **Brand Identity**: `Articulate-AI` logo with glowing gradient icon.
- **Heartbeat Pill**: Animated pulsing emerald dot displaying `AI Engine: Online` and real-time connectivity.
- **View Tabs**:
  - `Overview`: Dashboard metrics and incident health score.
  - `Live Incidents`: Real-time events table with severity filters.
  - `AI Diagnoses`: Comprehensive diagnosis feed with actionable remediation checklists.
  - `Simulator`: Interactive panel to fire real test incidents into BullMQ.
- **User Account Pill**: Shows user identity, tenant status, and logout button.

### 2. Metric / KPI Stat Cards
- 4 grid tiles at the top of the dashboard:
  1. **Total Incidents** (With 24h trend indicator).
  2. **Critical Alarms** (With neon rose indicator).
  3. **Diagnosed Insights** (Count of AI processed events).
  4. **System Health Score** (Percentage / status).
- Cards feature top hairline accent borders that light up on hover.

### 3. AI Diagnosis Cards
The core feature of Articulate-AI:
- **Header**:
  - AI Sparkle icon with gradient badge: `AI Incident Diagnosis`.
  - Chip showing the model used (e.g. `dots-studio/dots-3-note-preview:free`).
  - Relative timestamp (e.g., `2 mins ago`).
- **Linked Event Details**:
  - Event pill badge (`Server Crash`, `Traffic Spike`).
  - Severity indicator with colored dot.
  - Source location and technical error message.
- **Summary**:
  - Formatted diagnosis text highlighting observations and probable root causes.
- **Remediation Action Checklist**:
  - Interactive checkboxes for each `recommendedAction` allowing operators to track remediation steps.

### 4. Event Ingestion Simulator
- An interactive drawer / card:
  - Form controls: Event Type, Severity (`Critical`, `High`, `Medium`, `Low`), Source, and Custom Error Message.
  - Trigger button: Fires real `POST /api/v1/events` to BullMQ.
  - Provides instant feedback with `jobId` and updates the Live Events table.

### 5. Authentication Screen
- Seamless dark card supporting both **Login** and **Registration**.
- Form validation with error banners and automatic JWT storage.

---

## 5. Micro-Animations & Interactivity

- **Pulsing Status Dots**:
  ```css
  @keyframes pulseGlow {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(1.15); }
  }
  ```
- **Card Hover Elevation**:
  ```css
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  transform: translateY(-2px);
  ```
- **Smooth Tab Transitions**: Active pill indicators slide or cross-fade cleanly without layout shift.

---

## 6. Web Interface Guidelines Compliance (Vercel Standards)

All frontend components, styles, and markup must adhere strictly to the following standards:

### Accessibility & Semantics
- **Semantic HTML First**: Always use `<button>` for actions, `<a>` for navigation, `<label>` for form fields, and `<table>` for tabular event lists. Never use `<div onClick>` for interactive elements.
- **Accessible Icons**:
  - Any icon-only button must have an explicit `aria-label` (e.g. `<button aria-label="Refresh events">`).
  - Decorative icons must include `aria-hidden="true"`.
- **Live Regions**: Asynchronous alerts, status updates, and toast notices must include `aria-live="polite"`.
- **Keyboard Navigation**: All interactive elements must be accessible via Tab/Shift+Tab and triggered via `Enter` or `Space`.

### Focus States
- **Visible Replacement**: Never use `outline: none` without a high-visibility replacement.
- **`:focus-visible`**: Always use `:focus-visible` instead of `:focus` so mouse clicks don't produce jarring focus outlines.
- **High-Contrast Ring**: Focus rings use `box-shadow: 0 0 0 2px var(--bg-base), 0 0 0 4px var(--color-brand);`.

### Forms & Input Hygiene
- **Associative Labels**: Every input, select, and textarea must be explicitly linked to a label via `<label htmlFor="...">`.
- **Input Types & Modes**: Use appropriate types (`type="email"`, `type="password"`, `type="text"`).
- **Credentials & Codes**: Set `spellCheck={false}` on email inputs, API keys, and code snippets.
- **Never Block Paste**: Never intercept or disable paste handlers (`onPaste`).
- **Ellipsis in Placeholders**: Placeholders and pending states must end with the proper single-character ellipsis (`…`, not `...`), e.g., `"Enter incident description…"` and `"Diagnosing incident…"`.

### Motion & Compositor Rules
- **Reduced Motion**: Strictly honor `@media (prefers-reduced-motion: reduce)` by disabling non-essential transitions and pulsing animations.
- **Explicit Transitions**: Never use `transition: all`. Explicitly enumerate animated properties (`transition: transform 0.2s ease, opacity 0.2s ease, border-color 0.2s ease`).
- **GPU-Friendly**: Animate `transform` and `opacity` only to prevent expensive layout recalculations and repaints.

### Typography & Content Handling
- **Tabular Figures**: Always apply `font-variant-numeric: tabular-nums` to numbers, counters, timestamps, and metric KPIs to avoid layout jitter during live counter updates.
- **Balanced Headings**: Use `text-wrap: balance` on section headings and alert titles to prevent single trailing words (widows).
- **Flex Child Truncation**: Any flex child containing truncated text must declare `min-width: 0` alongside `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`.
- **Thoughtful Empty States**: Never render empty grids or broken tables. Display informative, styled empty states (e.g. `"No critical incidents recorded in the last 24 hours"`).
