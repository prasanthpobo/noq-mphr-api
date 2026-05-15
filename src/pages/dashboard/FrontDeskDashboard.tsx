import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import Icon from '@/components/ui/Icon'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'
import { doctorsService } from '@/services/doctors.service'
import { tokensService } from '@/services/tokens.service'
import dayjs from 'dayjs'

function greeting(name: string): string {
  const h = new Date().getHours()
  const period = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
  return `Good ${period}, ${name}`
}

interface HourBar {
  hour: string
  count: number
}

const HOURLY: HourBar[] = [
  { hour: '08',  count: 8  },
  { hour: '09',  count: 14 },
  { hour: '10',  count: 18 },
  { hour: '11',  count: 22 },
  { hour: '12',  count: 10 },
  { hour: '13',  count: 6  },
  { hour: '14',  count: 4  },
  { hour: '15',  count: 2  },
]

const maxHourly = Math.max(...HOURLY.map(h => h.count))

interface QuickAction {
  ic: string
  label: string
  route: string
  tone: string
}

const QUICK_ACTIONS: QuickAction[] = [
  { ic: 'calendar',  label: 'Book appointment', route: 'book',        tone: 'blue'   },
  { ic: 'plus',      label: 'Walk-in',           route: 'live-tokens', tone: 'green'  },
  { ic: 'search',    label: 'Find patient',       route: 'patients',    tone: 'plum'   },
  { ic: 'printer',   label: 'Print queue',        route: 'tokens',      tone: 'amber'  },
  { ic: 'sheet',     label: 'Token report',       route: 'reports',     tone: 'pink'   },
  { ic: 'settings',  label: 'Settings',           route: 'settings',    tone: 'indigo' },
]

function statusBadgeForToken(status: string, priority: string): { cls: string; label: string } {
  if (priority === 'emergency') return { cls: 'danger',  label: 'Emergency' }
  if (status === 'in-consultation') return { cls: 'blue',    label: 'In room'  }
  if (status === 'waiting')         return { cls: 'warning', label: 'Waiting'  }
  return                                   { cls: 'muted',   label: 'Not seen' }
}

function doctorStatusBadge(status: string): { cls: string; label: string } {
  if (status === 'active') return { cls: 'success', label: 'Available' }
  return                          { cls: 'muted',   label: 'Unavailable' }
}

export default function FrontDeskDashboard() {
  const { setRoute } = useAppStore()
  const user         = useAuthStore(s => s.user)
  const [tokens, setTokens] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, waiting: 0, completed: 0 })

  useEffect(() => {
    const today = dayjs().format('YYYY-MM-DD')
    Promise.all([
      tokensService.list({ date: today }),
      doctorsService.list(),
    ]).then(([tRes, dRes]) => {
      const tData = tRes.data || []
      const dData = dRes.data || []
      setTokens(tData)
      setDoctors(dData)
      setStats({
        total: tRes.count || tData.length,
        waiting: tData.filter((t: any) => t.status === 'waiting').length,
        completed: tData.filter((t: any) => t.status === 'completed').length,
      })
    }).catch(() => {})
  }, [])

  const QUEUE_ROWS = tokens
    .filter((t: any) => t.status !== 'completed' && t.status !== 'cancelled')
    .slice(0, 6)

  const DUTY_DOCTORS = doctors.filter((d: any) => d.status !== 'on-leave').slice(0, 4)

  return (
    <>
      <Header
        title={greeting(user?.name ?? 'Front Desk')}
        crumbs={`Front desk · ${dayjs().format('dddd, D MMM YYYY')}`}
      />
      <div className="main">
        {/* Stat cards */}
        <div className="stats-grid">
          <StatCard
            ic="ticket"
            label="Tokens today"
            value={String(stats.total)}
            accent
            foot="Issued since 09:00"
          />
          <StatCard
            ic="users"
            tone="blue"
            label="Waiting now"
            value={String(stats.waiting)}
            foot="In queue across OPD"
          />
          <StatCard
            ic="clock"
            tone="amber"
            label="Avg wait time"
            value="18 min"
            foot="Across all doctors"
          />
          <StatCard
            ic="check"
            tone="green"
            label="Completed"
            value={String(stats.completed)}
            foot="Consultations done today"
          />
        </div>

        {/* Live queue + Doctors on duty */}
        <div className="dash-grid">
          {/* Live token queue */}
          <div className="card">
            <div className="card-h">
              <div>
                <h2>Live token queue</h2>
                <div className="sub">{QUEUE_ROWS.length} active tokens</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setRoute('live-tokens')}>
                Full queue
              </button>
            </div>

            {/* Column header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '28px 80px 1fr 1fr 90px',
              gap: 10,
              padding: '0 12px 8px',
              borderBottom: '1px solid var(--border-light)',
            }}>
              {['#', 'Token', 'Patient', 'Doctor', 'Status'].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {h}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
              {QUEUE_ROWS.map((t: any, i: number) => {
                const badge = statusBadgeForToken(t.status, t.priority)
                const isCurrent = t.status === 'in-consultation'
                return (
                  <div
                    key={t._id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '28px 80px 1fr 1fr 90px',
                      gap: 10,
                      padding: '9px 12px',
                      borderRadius: 10,
                      alignItems: 'center',
                      background: isCurrent ? 'rgba(44,110,213,0.08)' : 'var(--bg-section)',
                      border: `1px solid ${isCurrent ? 'rgba(44,110,213,0.25)' : 'var(--border-light)'}`,
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-muted)' }}>
                      {i + 1}
                    </span>
                    <div className="token-pill">
                      <span className="l">{t.priority === 'emergency' ? 'EMG' : 'TKN'}</span>
                      <span className="n">{t.tokenNumber}</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.patientId?.name || 'Patient'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--fg-secondary)' }}>{t.slot}</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--fg-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.doctorId?.name || 'Doctor'}
                    </div>
                    <span className={`badge ${badge.cls}`}>
                      <span className="d" />
                      {badge.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Doctors on duty */}
          <div className="card">
            <div className="card-h">
              <div>
                <h2>Doctors on duty</h2>
                <div className="sub">{DUTY_DOCTORS.length} available today</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setRoute('doctors')}>
                All doctors
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DUTY_DOCTORS.map((d: any, idx: number) => {
                const badge = doctorStatusBadge(d.status)
                return (
                  <div
                    key={d._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      background: 'var(--bg-section)',
                      borderRadius: 12,
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    <div className={`av ${['blue','teal','pink','amber'][idx % 4]}`} style={{ flexShrink: 0 }}>
                      {d.name?.slice(0, 2) || 'DR'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>
                        {d.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--fg-secondary)', marginTop: 2 }}>
                        {d.specialization}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span className={`badge ${badge.cls}`}>
                        <span className="d" />
                        {badge.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Hourly trend + Quick actions */}
        <div className="dash-grid">
          {/* Hourly walk-in trend */}
          <div className="card">
            <div className="card-h">
              <div>
                <h2>Hourly walk-in trend</h2>
                <div className="sub">Token issuance per hour today</div>
              </div>
            </div>
            <div className="bars">
              {HOURLY.map((h: HourBar) => {
                const pct = maxHourly > 0 ? Math.round((h.count / maxHourly) * 100) : 0
                return (
                  <div key={h.hour} className="bar-col">
                    <div className="bar-stack">
                      <div
                        className="bar"
                        style={{ height: `${pct}%` }}
                        title={`${h.count} tokens`}
                      />
                    </div>
                    <div className="bar-lbl">{h.hour}h</div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="swatch" style={{ background: 'var(--brand-gradient)' }} />
              <span style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>Walk-in tokens per hour</span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="card">
            <div className="card-h">
              <div>
                <h2>Quick actions</h2>
                <div className="sub">Front desk shortcuts</div>
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 10,
            }}>
              {QUICK_ACTIONS.map((a: QuickAction) => (
                <button
                  key={a.route}
                  onClick={() => setRoute(a.route)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    padding: '16px 12px',
                    borderRadius: 12,
                    background: 'var(--bg-section)',
                    border: '1px solid var(--border-light)',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  <div className={`av ${a.tone}`} style={{ borderRadius: 12 }}>
                    <Icon name={a.ic} size={16} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-primary)', textAlign: 'center', lineHeight: 1.3 }}>
                    {a.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
