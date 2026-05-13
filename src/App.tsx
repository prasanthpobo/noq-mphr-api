import { lazy, Suspense } from 'react'
import { useAppStore } from '@/store/app'
import Sidebar from '@/components/layout/Sidebar'
import LoginPage from '@/pages/login/Login'
import LogoutModal from '@/components/LogoutModal'

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
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ fontSize: 48 }}>🚧</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--fg-primary)', margin: 0 }}>Coming Soon</h2>
      <p style={{ color: 'var(--fg-secondary)', margin: 0 }}>This page is under construction.</p>
      <button className="btn btn-primary" onClick={() => setRoute('dashboard')}>
        Back to Dashboard
      </button>
    </div>
  )
}

// ─── Route resolver ──────────────────────────────────────────────────────────
function resolveScreen(route: string): React.ReactNode {
  switch (route) {
    case 'dashboard':       return <AdminDashboard />
    case 'dash-clinic':     return <ClinicDashboard />
    case 'dash-doctor':     return <DoctorDashboard />
    case 'dash-nurse':      return <NurseDashboard />
    case 'dash-frontdesk':  return <FrontDeskDashboard />

    case 'appointments':    return <Appointments />
    case 'appt-view':       return <AppointmentDetail mode="view" />
    case 'appt-edit':       return <AppointmentDetail mode="edit" />

    case 'live-tokens':     return <TokenDisplay />
    case 'tokens-mgr':      return <TokensManager />
    case 'tokens':          return <TokenDisplay />

    case 'doctor-new':      return <DoctorForm mode="create" />
    case 'doctor-view':     return <DoctorForm mode="view" />
    case 'doctor-edit':     return <DoctorForm mode="edit" />
    case 'doctors':         return <DoctorList />

    case 'patient-new':     return <PatientForm mode="create" />
    case 'patient-view':    return <PatientForm mode="view" />
    case 'patient-edit':    return <PatientForm mode="edit" />
    case 'patients':        return <PatientList />

    case 'clinic-new':      return <ClinicForm mode="create" />
    case 'clinic-view':     return <ClinicForm mode="view" />
    case 'clinic-edit':     return <ClinicForm mode="edit" />
    case 'clinics':         return <ClinicList />

    case 'frontdesk':       return <FrontDeskList />
    case 'fd-new':          return <FrontDeskForm mode="create" />
    case 'fd-view':         return <FrontDeskForm mode="view" />
    case 'fd-edit':         return <FrontDeskForm mode="edit" />

    case 'nurses':          return <NurseList />
    case 'nurse-new':       return <NurseForm mode="create" />
    case 'nurse-view':      return <NurseForm mode="view" />
    case 'nurse-edit':      return <NurseForm mode="edit" />

    case 'admin-users':     return <AdminUserList />
    case 'admin-new':       return <AdminUserForm mode="create" />
    case 'admin-view':      return <AdminUserForm mode="view" />
    case 'admin-edit':      return <AdminUserForm mode="edit" />

    case 'pharmacy':        return <PharmacyPage />
    case 'pharmacy-detail': return <PharmacyDetail />

    case 'lab':             return <LabPage />
    case 'lab-detail':      return <LabDetail />

    case 'billing':         return <BillingPage />
    case 'billing-detail':  return <BillingDetail />

    case 'reports':         return <ReportsPage />
    case 'master-data':     return <MasterDataPage />

    case 'profile':         return <ProfilePage />
    case 'support':         return <SupportTickets />
    case 'settings':        return <SettingsPage />

    case 'book':            return <BookFlow />

    default:                return <ComingSoon />
  }
}

// ─── App root ────────────────────────────────────────────────────────────────
export default function App() {
  const { authed, route, logoutOpen } = useAppStore()

  if (!authed) return <LoginPage />

  const screen = resolveScreen(route)

  return (
    <div className="app">
      <Sidebar />
      <div className="main-col">
        <Suspense fallback={<PageLoader />}>
          {screen}
        </Suspense>
      </div>
      {logoutOpen && <LogoutModal />}
    </div>
  )
}
