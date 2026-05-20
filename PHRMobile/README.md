# NoQ PHR Mobile — PHRMOBILE

A production-ready **mobile-first clinic booking web app** built with React 19 + TypeScript + Vite + Tailwind CSS.

## Quick Start

```bash
cd PHRMOBILE

# 1. Install dependencies
npm install

# 2. Set API URL
cp .env.example .env

# 3. Start dev server
npm run dev
```

Open http://localhost:5173 — renders as a phone shell on desktop (max-width 430px).

## Build for Production

```bash
npm run build    # → dist/
npm run preview  # preview the build
```

## Tech Stack

| Layer       | Library                          |
|-------------|----------------------------------|
| UI          | React 19 + TypeScript + Tailwind CSS 4 |
| Routing     | React Router DOM v7              |
| State       | Zustand (with persist middleware)|
| Forms       | React Hook Form                  |
| HTTP        | Axios (interceptors + auth)      |
| Animation   | Framer Motion                    |
| Date        | dayjs                            |
| Icons       | react-icons/hi                   |

## Screens (15 total)

| Route | Screen |
|---|---|
| `/` | Splash (auto-redirect 2.5s) |
| `/login` | Phone number login |
| `/otp` | 6-digit OTP + resend timer |
| `/app/dashboard` | Home — token card, quick actions, depts |
| `/app/search` | Search doctors / clinics |
| `/app/clinics` | Clinic listing with filters |
| `/app/clinic/:id` | Clinic detail + doctors + reviews |
| `/app/doctor/:id` | Doctor profile + slots + booking |
| `/app/book` | 5-step booking flow |
| `/app/queue` | Live queue with simulated updates |
| `/app/appointments` | Upcoming / Past tabs |
| `/app/records` | Medical records + upload FAB |
| `/app/profile` | User profile + menu |
| `/app/family` | Family members management |
| `/app/settings` | Notification, privacy toggles |

## Folder Structure

```
src/
├── modules/
│   ├── splash/           SplashScreen
│   ├── auth/             LoginScreen, OTPScreen
│   ├── dashboard/        DashboardScreen
│   ├── search/           SearchScreen
│   ├── clinics/          ClinicsScreen, ClinicDetailScreen
│   ├── doctors/          DoctorProfileScreen
│   ├── booking/          BookingScreen (5-step)
│   ├── queue/            QueueScreen
│   ├── appointments/     AppointmentsScreen
│   ├── records/          RecordsScreen
│   ├── profile/          ProfileScreen, FamilyScreen
│   └── settings/         SettingsScreen
├── components/           MobileHeader, BottomNav, Card, InputField, Loader
├── layouts/              AppLayout
├── routes/               Router (lazy-loaded, protected)
├── store/                authStore, bookingStore, queueStore
└── services/             api.ts, authService, clinicService,
                          bookingService, queueService
```

## API Integration

Set your backend URL in `.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

All service calls auto-attach the Bearer token. 401 responses redirect to `/login`.
