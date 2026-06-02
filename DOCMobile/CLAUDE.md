# NoQ Doctor UI — Project Guide

## Project Overview

**NoQ Doctor** is a mobile-first healthcare application for clinic management. It covers patient queuing (token system), appointments, prescriptions, and billing. The UI Kit reference is `NoQ Doctor UI Kit.html`.

---

## Tech Stack

| Layer | Library/Tool |
|---|---|
| Framework | React 19 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS (mobile-first, no desktop-first) |
| Routing | React Router DOM |
| State | Zustand |
| HTTP | Axios |
| Forms | React Hook Form |
| Animation | Framer Motion |

---

## Design System

### Colors (from UI Kit)
- **Primary Dark:** `#102E63` — page background, sidebar
- **Primary Blue:** `#1E4FA3` — buttons, active states, icons
- **Accent Teal:** `#1FA3A8` — CTA buttons, badges
- **Light Blue:** `#9BB4DD` — secondary text, inactive icons
- **Surface:** `#E8F1FD` — card backgrounds, input fills
- **White:** `#FFFFFF` — cards, modals

### Typography
- System font stack: `-apple-system, BlinkMacSystemFont, sans-serif`
- Clean, readable sizes — prioritize legibility on small screens

### Design Principles
- **Mobile-first always** — write base Tailwind styles for mobile, then `md:` / `lg:` for desktop
- **Card-based layout** — no raw tables on mobile; use cards instead
- **No desktop-first patterns** — never start with a sidebar and collapse it

---

## Layout Architecture

### Mobile (default)
- **Bottom navigation bar** — fixed, 5 icons max
- **Sticky header** — search bar + avatar/notification bell
- **Floating Action Button (FAB)** — primary action per page
- **Cards** — full-width, stacked vertically

### Desktop (`md:` and above)
- **Sidebar** — collapsible, icon + label
- **Header** — search + user info
- **Grid layouts** — 2–3 column card grids

---

## Screens & Routes

The UI Kit defines **15 screens** across 2 phases. Login state (variant, phone, MCI) persists across all screens.

### Phase 1 · Onboarding

| # | Route | Screen | Notes |
|---|---|---|---|
| 1 | `/splash` | Splash | App logo, auto-redirect |
| 2 | `/login` | Login | Phone number entry, JWT |
| 3 | `/otp` | OTP Verification | 6-digit code, resend timer |
| 4 | `/clinic-select` | Clinic Select | Doctor picks their clinic on first login |

### Phase 2 · In-App

| # | Route | Screen | Notes |
|---|---|---|---|
| 5 | `/` | Dashboard (Analytics) | Stats cards, charts, summary |
| 6 | `/queue` | Dashboard (Live Queue) | Real-time token queue view |
| 7 | `/appointments` | Appointments | Scheduled appointments list |
| 8 | `/consultation` | Consultation | Active consult — Rx, notes, vitals |
| 9 | `/history` | History | Past consultations list |
| 10 | `/history/:id` | Past Consult Detail | Full detail of a past visit |
| 11 | `/profile` | Profile | Doctor profile view |
| 12 | `/profile/edit` | Create / Edit Profile | Edit doctor info, MCI number |
| 13 | `/clinics` | Your Clinics | Manage linked clinic locations |
| 14 | `/patients` | My Patients | Patient list with search |
| 15 | `/patients/:id` | Patient Details | Full patient record + history |

> **Navigation note:** Onboarding screens (1–4) use full-screen layouts with no bottom nav. In-app screens (5–15) use the bottom nav on mobile and sidebar on desktop.

---

## Component Library

### Layout Components
- `BottomNav` — mobile bottom navigation with active state
- `Sidebar` — desktop left nav, hidden on mobile
- `Header` — sticky top bar with search and user avatar
- `FAB` — floating action button, bottom-right

### UI Components
- `Card` — base card with shadow, rounded corners, padding
- `StatCard` — metric display with icon and trend
- `TokenBadge` — queue token number display
- `StatusBadge` — appointment status (waiting / in-progress / done)
- `Modal` — centered overlay, backdrop blur
- `BottomSheet` — mobile-native slide-up panel

### Form Components
- `Input` — text input with label, error state
- `Select` — styled dropdown
- `SearchBar` — with debounce, in header
- `RxLine` — single prescription drug row (medicine + dose + duration)

---

## State Management (Zustand)

```
stores/
  authStore.ts         — user, token, MCI number, clinic, login/logout
  queueStore.ts        — live token queue, current token, status updates
  appointmentStore.ts  — scheduled appointments list
  consultationStore.ts — active consult, Rx lines, notes, vitals
  patientStore.ts      — patient list, selected patient, search filter
  historyStore.ts      — past consults list + selected detail
  clinicStore.ts       — linked clinics list, selected clinic
```

Each store follows the pattern:
```ts
interface StoreState { ... }
interface StoreActions { ... }
const useStore = create<StoreState & StoreActions>((set) => ({ ... }))
```

---

## API Layer (Axios)

```
services/
  api.ts                 — Axios instance, base URL, JWT interceptor
  authService.ts         — login (phone+OTP), logout, token refresh
  queueService.ts        — live queue fetch, token status update
  appointmentService.ts  — scheduled appointments CRUD
  consultationService.ts — create/save active consultation
  patientService.ts      — patient list, patient detail
  historyService.ts      — past consults list + detail
  clinicService.ts       — clinic list, select clinic
```

**Auth:** JWT stored in memory (not localStorage). Axios request interceptor attaches `Authorization: Bearer <token>`. Axios response interceptor handles 401 → redirect to login.

---

## File Structure

```
src/
  components/
    layout/          — BottomNav, Sidebar, Header, FAB
    ui/              — Card, Modal, BottomSheet, Badge, Input, Select
    forms/           — RxLine, PatientForm, ConsultForm
  pages/
    Splash/          — Screen 1
    Login/           — Screen 2
    OtpVerification/ — Screen 3
    ClinicSelect/    — Screen 4
    DashboardAnalytics/  — Screen 5
    DashboardQueue/      — Screen 6  (live token queue)
    Appointments/        — Screen 7
    Consultation/        — Screen 8  (active consult)
    History/             — Screen 9
    PastConsultDetail/   — Screen 10
    Profile/             — Screen 11
    ProfileEdit/         — Screen 12
    YourClinics/         — Screen 13
    MyPatients/          — Screen 14
    PatientDetails/      — Screen 15
  stores/            — Zustand stores
  services/          — Axios service layer
  hooks/             — useDebounce, useQueue, usePrint, useOtp
  types/             — shared TypeScript interfaces
  utils/             — formatters, validators
  router.tsx         — React Router config (onboarding vs in-app guards)
  main.tsx
```

---

## Key Patterns

### Mobile-first Tailwind
```tsx
// CORRECT — mobile base, then desktop enhancement
<div className="flex flex-col p-4 md:flex-row md:p-8">

// WRONG — never start desktop-first
<div className="hidden md:flex">  {/* ❌ hides on mobile */}
```

### No Tables on Mobile
```tsx
// Use cards on mobile, switch to table on md+
<div className="space-y-3 md:hidden">
  {patients.map(p => <PatientCard key={p.id} patient={p} />)}
</div>
<table className="hidden md:table w-full">...</table>
```

### Token Queue (Appointments)
- Each appointment gets a numeric token
- Doctor calls next token — status: `waiting → in-progress → done`
- Queue is real-time via polling or WebSocket
- Mobile shows one big token card at a time

### Onboarding Flow
- Splash → Login (phone) → OTP (6-digit) → Clinic Select → Dashboard
- After OTP success, JWT is stored in memory via `authStore`
- `ClinicSelect` is shown only on first login; persisted clinic skips it on subsequent logins
- Route guards: unauthenticated → `/login`, authenticated without clinic → `/clinic-select`

### Prescription (Rx Pad)
- Dynamic list of `RxLine` components
- Each line: drug name (autocomplete) + dose + frequency + duration
- Print button renders a clean prescription PDF view

---

## Commands

```bash
# Install
npm install

# Dev server
npm run dev

# Build
npm run build

# Type check
npm run type-check

# Lint
npm run lint
```

---

## UI Kit Reference

The bundled reference file `NoQ Doctor UI Kit.html` contains all screens and components as static mockups. Open it in a browser to inspect the visual design before building any component.

---

## Important Rules

1. **Mobile-first always** — no exceptions
2. **No tables on mobile** — use card lists
3. **JWT in memory** — never store tokens in localStorage or sessionStorage
4. **Zustand for shared state** — local component state for UI-only state
5. **Framer Motion for transitions** — page enter/exit, modal open/close, card appear
6. **Real clinic usability** — fast, clear, usable with one hand on a phone
