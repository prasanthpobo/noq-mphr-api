import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import Badge, { StatusBadge } from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'
import { appointmentsService } from '@/services/appointments.service'

const PHR_APP_URL = 'https://testapp.zerotoken.in/'

export default function PatientDashboard() {
  const { setRoute } = useAppStore()
  const user = useAuthStore((s) => s.user)
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [past,     setPast]     = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      appointmentsService.mine?.({ filter: 'upcoming' }).catch(() => ({ data: [] })),
      appointmentsService.mine?.({ filter: 'past'     }).catch(() => ({ data: [] })),
    ]).then(([up, p]: any[]) => {
      setUpcoming(up?.data ?? [])
      setPast(p?.data ?? [])
    }).finally(() => setLoading(false))
  }, [])

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const firstName = (user?.name || '').split(' ')[0] || 'there'

  return (
    <>
      <Header
        title={`${greeting}, ${firstName}`}
        crumbs="My health workspace"
      />

      <div className="main">
        {/* Hero card linking to PHRMobile */}
        <div style={{
          padding: '20px 22px', borderRadius: 16,
          background: 'linear-gradient(135deg, #2C6ED5 0%, #1FA3A8 100%)',
          color: '#FFFFFF',
          display: 'flex', alignItems: 'center', gap: 18,
          marginBottom: 18,
          boxShadow: '0 8px 24px rgba(30,79,163,0.20)',
        }}>
          <span style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'rgba(255,255,255,0.18)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon name="heart" size={22} style={{ color: '#FFFFFF' }} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em' }}>
              The full patient experience lives on the NoQ mobile app
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
              Family members, full health records, vitals, consent, and faster booking — all there.
            </div>
          </div>
          <a
            href={PHR_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', borderRadius: 10,
              background: '#FFFFFF', color: '#1E4FA3',
              fontSize: 13.5, fontWeight: 800, textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            Open mobile app <Icon name="chevR" size={14} />
          </a>
        </div>

        {/* Quick actions */}
        <div className="stats-grid" style={{ marginBottom: 18 }}>
          <QuickCard icon="calendar" tone="#2C6ED5" label="Book appointment"  onClick={() => setRoute('book')} />
          <QuickCard icon="clock"    tone="#1FA3A8" label="My appointments"   onClick={() => setRoute('my-appointments')} count={upcoming.length} />
          <QuickCard icon="folder"   tone="#7C3AED" label="Medical records"   onClick={() => setRoute('my-records')} />
          <QuickCard icon="lifebuoy" tone="#F59E0B" label="Support"           onClick={() => setRoute('support')} />
        </div>

        {/* Upcoming appointments */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 18px', borderBottom: '1px solid var(--border-light)',
          }}>
            <span style={{
              width: 32, height: 32, borderRadius: 10,
              background: '#EBF2FF', border: '1px solid #DBE7F8',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="calendar" size={15} style={{ color: '#1E4FA3' }} />
            </span>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg-primary)', flex: 1 }}>
              Upcoming appointments
            </span>
            <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
              {loading ? 'Loading…' : `${upcoming.length} scheduled`}
            </span>
          </div>
          {loading ? (
            <div style={{ padding: 24, fontSize: 13, color: 'var(--fg-muted)', textAlign: 'center' }}>Loading…</div>
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="No upcoming appointments"
              hint="Book a slot with one of our doctors."
              cta={<button className="btn btn-primary btn-sm" onClick={() => setRoute('book')}><Icon name="plus" size={13} /> Book appointment</button>}
            />
          ) : (
            <table className="data" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Doctor</th>
                  <th>Clinic</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.slice(0, 5).map((a: any) => (
                  <tr key={a._id}>
                    <td>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.date ? dayjs(a.date).format('DD MMM YYYY') : '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{a.time || '—'}</div>
                    </td>
                    <td style={{ fontSize: 13.5 }}>{a.doctorId?.name || '—'}</td>
                    <td style={{ fontSize: 13 }}>{a.clinicId?.name || '—'}</td>
                    <td style={{ fontSize: 13, textTransform: 'capitalize' }}>{a.type || 'consultation'}</td>
                    <td><StatusBadge status={a.status || 'scheduled'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent visits */}
        {!loading && past.length > 0 && (
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: 18 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 18px', borderBottom: '1px solid var(--border-light)',
            }}>
              <span style={{
                width: 32, height: 32, borderRadius: 10,
                background: '#EBF2FF', border: '1px solid #DBE7F8',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="hourglass" size={15} style={{ color: '#1E4FA3' }} />
              </span>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg-primary)', flex: 1 }}>
                Recent visits
              </span>
              <button className="btn btn-secondary btn-sm" onClick={() => setRoute('my-appointments')}>
                View all <Icon name="chevR" size={12} />
              </button>
            </div>
            <table className="data" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Doctor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {past.slice(0, 3).map((a: any) => (
                  <tr key={a._id}>
                    <td style={{ fontSize: 13 }}>{a.date ? dayjs(a.date).format('DD MMM YYYY') : '—'}</td>
                    <td style={{ fontSize: 13.5 }}>{a.doctorId?.name || '—'}</td>
                    <td><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

function QuickCard({ icon, tone, label, onClick, count }: { icon: string; tone: string; label: string; onClick: () => void; count?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '16px 18px', borderRadius: 14,
        background: '#FFFFFF', border: '1px solid var(--border-soft)',
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
      }}
    >
      <span style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${tone}14`, border: `1px solid ${tone}33`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon name={icon} size={20} style={{ color: tone }} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg-primary)' }}>{label}</div>
        {count != null && count > 0 && (
          <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>{count} item{count === 1 ? '' : 's'}</div>
        )}
      </div>
      <Icon name="chevR" size={14} style={{ color: 'var(--fg-muted)' }} />
    </button>
  )
}

function EmptyState({ icon, title, hint, cta }: { icon: string; title: string; hint: string; cta?: React.ReactNode }) {
  return (
    <div style={{ textAlign: 'center', padding: '36px 24px' }}>
      <Icon name={icon} size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-secondary)' }}>{title}</div>
      <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginTop: 4 }}>{hint}</div>
      {cta && <div style={{ marginTop: 14 }}>{cta}</div>}
    </div>
  )
}

// Re-export so `Badge` import survives tree-shaking purges. Keeps things explicit.
export { Badge }
