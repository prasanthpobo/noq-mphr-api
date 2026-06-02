import React, { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import AppLayout from '../layouts/AppLayout'
import AuthLayout from '../layouts/AuthLayout'
import Loader from '../components/Loader'

// ── Lazy-loaded screen modules ────────────────────────────────────────────────
const SplashScreen         = lazy(() => import('../modules/splash/SplashScreen'))
const LoginScreen          = lazy(() => import('../modules/auth/LoginScreen'))
const RegisterScreen       = lazy(() => import('../modules/auth/RegisterScreen'))
const ForgotPasswordScreen = lazy(() => import('../modules/auth/ForgotPasswordScreen'))
const OTPScreen            = lazy(() => import('../modules/auth/OTPScreen'))
const ResetPasswordScreen  = lazy(() => import('../modules/auth/ResetPasswordScreen'))
const DashboardScreen      = lazy(() => import('../modules/dashboard/DashboardScreen'))
const SearchScreen         = lazy(() => import('../modules/search/SearchScreen'))
const ClinicsScreen        = lazy(() => import('../modules/clinics/ClinicsScreen'))
const ClinicDetailScreen   = lazy(() => import('../modules/clinics/ClinicDetailScreen'))
const DoctorProfileScreen  = lazy(() => import('../modules/doctors/DoctorProfileScreen'))
const BookingScreen        = lazy(() => import('../modules/booking/BookingScreen'))
const QueueScreen          = lazy(() => import('../modules/queue/QueueScreen'))
const TodayQueueScreen     = lazy(() => import('../modules/queue/TodayQueueScreen'))
const AppointmentsScreen        = lazy(() => import('../modules/appointments/AppointmentsScreen'))
const AppointmentDetailScreen   = lazy(() => import('../modules/appointments/AppointmentDetailScreen'))
const RecordsScreen        = lazy(() => import('../modules/records/RecordsScreen'))
const ProfileScreen        = lazy(() => import('../modules/profile/ProfileScreen'))
const FamilyScreen               = lazy(() => import('../modules/profile/FamilyScreen'))
const FamilyMemberDetailScreen   = lazy(() => import('../modules/profile/FamilyMemberDetailScreen'))
const PersonalInfoScreen   = lazy(() => import('../modules/profile/PersonalInfoScreen'))
const MedicalHistoryScreen = lazy(() => import('../modules/profile/MedicalHistoryScreen'))
const SettingsScreen          = lazy(() => import('../modules/settings/SettingsScreen'))
const TermsOfServiceScreen    = lazy(() => import('../modules/settings/TermsOfServiceScreen'))
const PrivacyPolicyScreen     = lazy(() => import('../modules/settings/PrivacyPolicyScreen'))
const PaymentPolicyScreen     = lazy(() => import('../modules/settings/PaymentPolicyScreen'))
const SupportScreen           = lazy(() => import('../modules/support/SupportScreen'))
const NewTicketScreen      = lazy(() => import('../modules/support/NewTicketScreen'))
const TicketDetailScreen   = lazy(() => import('../modules/support/TicketDetailScreen'))
const MyDoctorsScreen        = lazy(() => import('../modules/profile/MyDoctorsScreen'))
const NotificationsScreen    = lazy(() => import('../modules/notifications/NotificationsScreen'))
const ConsentScreen          = lazy(() => import('../modules/consent/ConsentScreen'))

// ── Suspense wrapper ──────────────────────────────────────────────────────────
function SuspenseScreen({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Loader />}>{children}</Suspense>
}

// ── Protected route wrapper ───────────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

// ── Router definition ─────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  // ── Public routes — all share AuthLayout (mobile-shell) ──────────────────
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/',
        element: <SuspenseScreen><SplashScreen /></SuspenseScreen>,
      },
      {
        path: '/login',
        element: <SuspenseScreen><LoginScreen /></SuspenseScreen>,
      },
      {
        path: '/register',
        element: <SuspenseScreen><RegisterScreen /></SuspenseScreen>,
      },
      {
        path: '/forgot-password',
        element: <SuspenseScreen><ForgotPasswordScreen /></SuspenseScreen>,
      },
      {
        path: '/otp',
        element: <SuspenseScreen><OTPScreen /></SuspenseScreen>,
      },
      {
        path: '/reset-password',
        element: <SuspenseScreen><ResetPasswordScreen /></SuspenseScreen>,
      },
    ],
  },

  // ── Protected routes — AppLayout includes mobile-shell + BottomNav ────────
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard',   element: <SuspenseScreen><DashboardScreen /></SuspenseScreen> },
      { path: 'search',      element: <SuspenseScreen><SearchScreen /></SuspenseScreen> },
      { path: 'clinics',     element: <SuspenseScreen><ClinicsScreen /></SuspenseScreen> },
      { path: 'clinic/:id',  element: <SuspenseScreen><ClinicDetailScreen /></SuspenseScreen> },
      { path: 'doctor/:id',  element: <SuspenseScreen><DoctorProfileScreen /></SuspenseScreen> },
      { path: 'book',        element: <SuspenseScreen><BookingScreen /></SuspenseScreen> },
      { path: 'booking',     element: <SuspenseScreen><BookingScreen /></SuspenseScreen> },
      { path: 'queue',       element: <SuspenseScreen><QueueScreen /></SuspenseScreen> },
      { path: 'today-queue', element: <SuspenseScreen><TodayQueueScreen /></SuspenseScreen> },
      { path: 'appointments',       element: <SuspenseScreen><AppointmentsScreen /></SuspenseScreen> },
      { path: 'appointments/:id',   element: <SuspenseScreen><AppointmentDetailScreen /></SuspenseScreen> },
      { path: 'records',     element: <SuspenseScreen><RecordsScreen /></SuspenseScreen> },
      { path: 'profile',        element: <SuspenseScreen><ProfileScreen /></SuspenseScreen> },
      { path: 'personal-info',  element: <SuspenseScreen><PersonalInfoScreen /></SuspenseScreen> },
      { path: 'family',         element: <SuspenseScreen><FamilyScreen /></SuspenseScreen> },
      { path: 'family/:id',    element: <SuspenseScreen><FamilyMemberDetailScreen /></SuspenseScreen> },
      { path: 'medical-history',element: <SuspenseScreen><MedicalHistoryScreen /></SuspenseScreen> },
      { path: 'my-doctors',     element: <SuspenseScreen><MyDoctorsScreen /></SuspenseScreen> },
      { path: 'notifications',  element: <SuspenseScreen><NotificationsScreen /></SuspenseScreen> },
      { path: 'consent',         element: <SuspenseScreen><ConsentScreen /></SuspenseScreen> },
      { path: 'settings',        element: <SuspenseScreen><SettingsScreen /></SuspenseScreen> },
      { path: 'settings/terms',    element: <SuspenseScreen><TermsOfServiceScreen /></SuspenseScreen> },
      { path: 'settings/privacy',  element: <SuspenseScreen><PrivacyPolicyScreen /></SuspenseScreen> },
      { path: 'settings/payment-policy', element: <SuspenseScreen><PaymentPolicyScreen /></SuspenseScreen> },
      { path: 'support',        element: <SuspenseScreen><SupportScreen /></SuspenseScreen> },
      { path: 'support/new',    element: <SuspenseScreen><NewTicketScreen /></SuspenseScreen> },
      { path: 'support/:id',    element: <SuspenseScreen><TicketDetailScreen /></SuspenseScreen> },
    ],
  },
])
