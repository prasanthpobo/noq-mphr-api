import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

// Layout wrapper for in-app screens (bottom nav + header)
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthShell } from '@/components/layout/AuthShell'

// Phase 1 — Onboarding
import { Splash } from '@/pages/Splash'
import { Login } from '@/pages/Login'
import { OtpVerification } from '@/pages/OtpVerification'
import { ClinicSelect } from '@/pages/ClinicSelect'

// Phase 2 — In-App
import { DashboardAnalytics } from '@/pages/DashboardAnalytics'
import { DashboardQueue } from '@/pages/DashboardQueue'
import { Appointments } from '@/pages/Appointments'
import { Consultation } from '@/pages/Consultation'
import { History } from '@/pages/History'
import { PastConsultDetail } from '@/pages/PastConsultDetail'
import { Profile } from '@/pages/Profile'
import { ProfileEdit } from '@/pages/ProfileEdit'
import { YourClinics } from '@/pages/YourClinics'
import { MyPatients } from '@/pages/MyPatients'
import { PatientDetails } from '@/pages/PatientDetails'

// ─── Guards ────────────────────────────────────────────────────────────────

/** Redirects unauthenticated users to /login */
function RequireAuth() {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}

/** Redirects authenticated users who haven't selected a clinic to /clinic-select */
function RequireClinic() {
  const clinic = useAuthStore((s) => s.selectedClinic)
  if (!clinic) return <Navigate to="/clinic-select" replace />
  return <Outlet />
}

/** Redirects already-authenticated users away from onboarding */
function RedirectIfAuth() {
  const token = useAuthStore((s) => s.token)
  if (token) return <Navigate to="/" replace />
  return <Outlet />
}

// ─── Router ────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  // All routes share the mobile-shell wrapper
  {
    element: <AuthShell />,
    children: [
      // Splash (no guard)
      { path: '/splash', element: <Splash /> },

      // Onboarding — redirect away if already logged in
      {
        element: <RedirectIfAuth />,
        children: [
          { path: '/login', element: <Login /> },
          { path: '/otp', element: <OtpVerification /> },
        ],
      },

      // Clinic select — auth required but no clinic yet
      {
        element: <RequireAuth />,
        children: [
          { path: '/clinic-select', element: <ClinicSelect /> },
        ],
      },
    ],
  },

  // In-app — auth + clinic required, wrapped in AppLayout
  {
    element: <RequireAuth />,
    children: [
      {
        element: <RequireClinic />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: '/', element: <DashboardAnalytics /> },
              { path: '/queue', element: <DashboardQueue /> },
              { path: '/appointments', element: <Appointments /> },
              { path: '/consultation', element: <Consultation /> },
              { path: '/history', element: <History /> },
              { path: '/history/:id', element: <PastConsultDetail /> },
              { path: '/profile', element: <Profile /> },
              { path: '/profile/edit', element: <ProfileEdit /> },
              { path: '/clinics', element: <YourClinics /> },
              { path: '/patients', element: <MyPatients /> },
              { path: '/patients/:id', element: <PatientDetails /> },
            ],
          },
        ],
      },
    ],
  },

  // Fallback
  { path: '*', element: <Navigate to="/splash" replace /> },
])
