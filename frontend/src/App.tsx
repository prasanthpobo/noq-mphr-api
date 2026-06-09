import { lazy, Suspense, useEffect } from 'react'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'
import { usePermissions } from '@/hooks/usePermissions'
import { ROUTE_PERMISSIONS, DEFAULT_ROUTE } from '@/config/rbac'
import Sidebar from '@/components/layout/Sidebar'
import LoginPage      from '@/pages/login/Login'
import ForgotPassword from '@/pages/login/ForgotPassword'
import LogoutModal from '@/components/LogoutModal'
import ToastContainer from '@/components/ui/Toast'
import Icon from '@/components/ui/Icon'

// ─── Lazy page imports ───────────────────────────────────────────────────────
const AdminDashboard    = lazy(() => import('@/pages/dashboard/AdminDashboard'))
const ClinicDashboard   = lazy(() => import('@/pages/dashboard/ClinicDashboard'))
const DoctorDashboard   = lazy(() => import('@/pages/dashboard/DoctorDashboard'))
const NurseDashboard    = lazy(() => import('@/pages/dashboard/NurseDashboard'))
const FrontDeskDashboard= lazy(() => import('@/pages/dashboard/FrontDeskDashboard'))

const Appointments      = lazy(() => import('@/pages/appointments/Appointments'))
const AppointmentDetail = lazy(() => import('@/pages/appointments/AppointmentDetail'))

const TokenDisplay      = lazy(() => import('@/pages/tokens/TokenDisplay'))
const TokensManager     = lazy(() => import('@/pages/tokens/TokensManager'))

const DoctorList        = lazy(() => import('@/pages/doctors/DoctorList'))
const DoctorForm        = lazy(() => import('@/pages/doctors/DoctorForm'))

const PatientList       = lazy(() => import('@/pages/patients/PatientList'))
const PatientForm       = lazy(() => import('@/pages/patients/PatientForm'))

const ClinicList        = lazy(() => import('@/pages/clinics/ClinicList'))
const ClinicForm        = lazy(() => import('@/pages/clinics/ClinicForm'))

const FrontDeskList     = lazy(() => import('@/pages/frontdesk/FrontDeskList'))
const FrontDeskForm     = lazy(() => import('@/pages/frontdesk/FrontDeskForm'))

const NurseList         = lazy(() => import('@/pages/nurses/NurseList'))
const NurseForm         = lazy(() => import('@/pages/nurses/NurseForm'))

const AdminUserList     = lazy(() => import('@/pages/adminusers/AdminUserList'))
const AdminUserForm     = lazy(() => import('@/pages/adminusers/AdminUserForm'))

const PharmacyPage      = lazy(() => import('@/pages/pharmacy/PharmacyPage'))
const PharmacyDetail    = lazy(() => import('@/pages/pharmacy/PharmacyDetail'))

const LabPage           = lazy(() => import('@/pages/lab/LabPage'))
const LabDetail         = lazy(() => import('@/pages/lab/LabDetail'))
const LabBillingPage    = lazy(() => import('@/pages/lab/LabBillingPage'))

const BillingPage       = lazy(() => import('@/pages/billing/BillingPage'))
const BillingDetail     = lazy(() => import('@/pages/billing/BillingDetail'))

const ReportsPage       = lazy(() => import('@/pages/reports/ReportsPage'))
const MasterDataPage    = lazy(() => import('@/pages/masterdata/MasterDataPage'))

const ProfilePage       = lazy(() => import('@/pages/profile/Profile'))
const SupportTickets    = lazy(() => import('@/pages/support/SupportTickets'))
const SettingsPage      = lazy(() => import('@/pages/settings/SettingsPage'))

const BookFlow          = lazy(() => import('@/pages/bookflow/BookFlow'))

// ─── Fallback loader ─────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-muted)', fontSize: 14 }}>
      Loading…
    </div>
  )
}

// ─── Coming Soon stub ────────────────────────────────────────────────────────
function ComingSoon() {
  const { setRoute } = useAppStore()
  const { role }     = usePermissions()
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ fontSize: 48 }}>🚧</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--fg-primary)', margin: 0 }}>Coming Soon</h2>
      <p style={{ color: 'var(--fg-secondary)', margin: 0 }}>This page is under construction.</p>
      <button className="btn btn-primary" onClick={() => setRoute(DEFAULT_ROUTE[role] ?? 'support')}>
        Back to Dashboard
      </button>
    </div>
  )
}

// ─── Access Denied ───────────────────────────────────────────────────────────
function AccessDenied() {
  const { setRoute } = useAppStore()
  const { role }     = usePermissions()
  const home         = DEFAULT_ROUTE[role] ?? 'support'
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'rgba(239,68,68,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="lock" size={28} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--fg-primary)', margin: '0 0 6px' }}>
          Access denied
        </h2>
        <p style={{ color: 'var(--fg-secondary)', margin: 0, fontSize: 14 }}>
          You don't have permission to view this page.
        </p>
      </div>
      <button className="btn btn-primary" onClick={() => setRoute(home)}>
        Back to Dashboard
      </button>
    </div>
  )
}

// ─── App root ────────────────────────────────────────────────────────────────
export default function App() {
  const { authed, route, logoutOpen, selectedId, setSelectedId, setRoute } = useAppStore()
  const user       = useAuthStore(s => s.user)
  const { can, role } = usePermissions()

  // On login / role change: redirect to role's default if current route is forbidden
  useEffect(() => {
    if (!authed || !user) return
    const requiredPerm = ROUTE_PERMISSIONS[route]
    if (requiredPerm && !can(requiredPerm)) {
      setRoute(DEFAULT_ROUTE[role] ?? 'support')
    }
  }, [authed, user?.role]) // eslint-disable-line react-hooks/exhaustive-deps

  if (route === 'forgot-password') return <ForgotPassword />
  if (!authed) return <LoginPage />

  // ── Screen resolution ──────────────────────────────────────────────────────
  let screen: React.ReactNode

  switch (route) {
    case 'dashboard':       screen = <AdminDashboard />; break
    case 'dash-clinic':     screen = <ClinicDashboard />; break
    case 'dash-doctor':     screen = <DoctorDashboard />; break
    case 'dash-nurse':      screen = <NurseDashboard />; break
    case 'dash-frontdesk':  screen = <FrontDeskDashboard />; break

    case 'appointments':    screen = <Appointments />; break
    case 'appt-view':       screen = <AppointmentDetail mode="view" />; break
    case 'appt-edit':       screen = <AppointmentDetail mode="edit" />; break

    case 'live-tokens':     screen = <TokenDisplay />; break
    case 'tokens-mgr':      screen = <TokensManager />; break
    case 'tokens':          screen = <TokenDisplay />; break

    case 'doctors':         screen = <DoctorList />; break
    case 'doctor-new':      screen = <DoctorForm id={undefined} onClose={() => { setSelectedId(null); setRoute('doctors') }} />; break
    case 'doctor-edit':     screen = <DoctorForm id={selectedId ?? undefined} onClose={() => { setSelectedId(null); setRoute('doctors') }} />; break
    case 'doctor-view':     screen = <DoctorForm id={selectedId ?? undefined} viewOnly onClose={() => { setSelectedId(null); setRoute('doctors') }} />; break

    case 'patients':        screen = <PatientList />; break
    case 'patient-new':     screen = <PatientForm id={undefined} onClose={() => { setSelectedId(null); setRoute('patients') }} />; break
    case 'patient-edit':    screen = <PatientForm id={selectedId ?? undefined} onClose={() => { setSelectedId(null); setRoute('patients') }} />; break
    case 'patient-view':    screen = <PatientForm id={selectedId ?? undefined} viewOnly onClose={() => { setSelectedId(null); setRoute('patients') }} />; break

    case 'clinics':         screen = <ClinicList />; break
    case 'clinic-new':      screen = <ClinicForm id={undefined} onClose={() => { setSelectedId(null); setRoute('clinics') }} />; break
    case 'clinic-edit':     screen = <ClinicForm id={selectedId ?? undefined} onClose={() => { setSelectedId(null); setRoute('clinics') }} />; break
    case 'clinic-view':     screen = <ClinicForm id={selectedId ?? undefined} onClose={() => { setSelectedId(null); setRoute('clinics') }} />; break

    case 'frontdesk':       screen = <FrontDeskList />; break
    case 'fd-new':          screen = <FrontDeskForm id={undefined} onClose={() => { setSelectedId(null); setRoute('frontdesk') }} />; break
    case 'fd-edit':         screen = <FrontDeskForm id={selectedId ?? undefined} onClose={() => { setSelectedId(null); setRoute('frontdesk') }} />; break
    case 'fd-view':         screen = <FrontDeskForm id={selectedId ?? undefined} viewOnly onClose={() => { setSelectedId(null); setRoute('frontdesk') }} />; break

    case 'nurses':          screen = <NurseList />; break
    case 'nurse-new':       screen = <NurseForm id={undefined} onClose={() => { setSelectedId(null); setRoute('nurses') }} />; break
    case 'nurse-edit':      screen = <NurseForm id={selectedId ?? undefined} onClose={() => { setSelectedId(null); setRoute('nurses') }} />; break
    case 'nurse-view':      screen = <NurseForm id={selectedId ?? undefined} viewOnly onClose={() => { setSelectedId(null); setRoute('nurses') }} />; break

    case 'admin-users':     screen = <AdminUserList />; break
    case 'admin-new':       screen = <AdminUserForm id={undefined} onClose={() => { setSelectedId(null); setRoute('admin-users') }} />; break
    case 'admin-edit':      screen = <AdminUserForm id={selectedId ?? undefined} onClose={() => { setSelectedId(null); setRoute('admin-users') }} />; break
    case 'admin-view':      screen = <AdminUserForm id={selectedId ?? undefined} onClose={() => { setSelectedId(null); setRoute('admin-users') }} />; break

    case 'pharmacy':        screen = <PharmacyPage />; break
    case 'pharmacy-detail': screen = <PharmacyDetail />; break

    case 'lab':             screen = <LabPage />; break
    case 'lab-detail':      screen = <LabDetail />; break
    case 'lab-billing':     screen = <LabBillingPage />; break

    case 'billing':         screen = <BillingPage />; break
    case 'billing-detail':  screen = <BillingDetail />; break

    case 'reports':         screen = <ReportsPage />; break
    case 'master-data':     screen = <MasterDataPage />; break

    case 'profile':         screen = <ProfilePage />; break
    case 'support':         screen = <SupportTickets />; break
    case 'settings':        screen = <SettingsPage />; break

    case 'book':            screen = <BookFlow />; break

    default:                screen = <ComingSoon />; break
  }

  // ── Route guard: replace screen if role lacks permission ──────────────────
  const requiredPerm = ROUTE_PERMISSIONS[route]
  if (requiredPerm && !can(requiredPerm)) {
    screen = <AccessDenied />
  }

  return (
    <div className="app">
      <Sidebar />
      <div className="main-col">
        <Suspense fallback={<PageLoader />}>
          {screen}
        </Suspense>
      </div>
      {logoutOpen && <LogoutModal />}
      <ToastContainer />
    </div>
  )
}
