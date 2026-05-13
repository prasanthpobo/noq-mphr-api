import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import Icon from '@/components/ui/Icon'
import { useAppStore } from '@/store/app'
import { reportsService } from '@/services/reports.service'
import dayjs from 'dayjs'

const DEPT_LOAD: { dept: string; pct: number; color: string }[] = [
  { dept: 'General OPD',  pct: 92, color: 'var(--brand-gradient)' },
  { dept: 'Cardiology',   pct: 78, color: 'linear-gradient(90deg,#7C3AED,#A78BFA)' },
  { dept: 'Dermatology',  pct: 65, color: 'linear-gradient(90deg,#EC4899,#F9A8D4)' },
  { dept: 'Pediatrics',   pct: 40, color: 'linear-gradient(90deg,#059669,#6EE7B7)' },
  { dept: 'Gynecology',   pct: 55, color: 'linear-gradient(90deg,#B45309,#FCD34D)' },
  { dept: 'Orthopedics',  pct: 70, color: 'linear-gradient(90deg,#0369A1,#7DD3FC)' },
]

interface AlertItem {
  kind: string
  t: string
  s: string
  when: string
}

const ALERTS: AlertItem[] = [
  { kind: 'danger', t: 'Queue overload — General OPD', s: 'Over 30 patients waiting, consider adding a room', when: '5m ago' },
  { kind: 'warn',   t: 'Doctor late — Dr. Priya Sharma', s: 'Scheduled at 09:00, not checked in yet', when: '12m ago' },
  { kind: 'info',   t: 'System maintenance tonight', s: 'Planned downtime 11:00 PM – 01:00 AM', when: '1h ago' },
]

const ALERT_ICONS: Record<string, { ic: string; cls: string }> = {
  warn:   { ic: 'alert', cls: 'amber' },
  danger: { ic: 'siren', cls: 'red'   },
  info:   { ic: 'info',  cls: 'blue'  },
}

function alertToBadge(kind: string): string {
  if (kind === 'danger') return 'danger'
  if (kind === 'warn')   return 'warning'
  return 'info'
}

export default function AdminDashboard() {
  const { setRoute } = useAppStore()
  const [summary, setSummary] = useState<any>(null)
  const [chartDays, setChartDays] = useState<any[]>([])

  useEffect(() => {
    reportsService.summary()
      .then(data => setSummary(data))
      .catch(() => { /* silent — dashboard renders with '...' placeholders */ })
    reportsService.tokens('week').then(data => {
      // data is array of { _id: 'YYYY-MM-DD', count: N }
      setChartDays((data || []).slice(-7).map((d: any) => ({
        label: dayjs(d._id).format('ddd'),
        tokens: d.count || 0,
      })))
    }).catch(() => {})
  }, [])

  const maxTokens = chartDays.length > 0 ? Math.max(...chartDays.map(d => d.tokens)) : 1

  return (
    <div className="main">
      <Header
        title="Good morning, Reception"
        crumbs="Today · Saturday, 9 May 2026 · Sunshine Clinic"
        onAdd={() => setRoute('book')}
        addLabel="Book appointment"
      />

      {/* Stat cards */}
      <div className="stats-grid">
        <StatCard
          ic="users"
          tone="blue"
          label="Total patients"
          value={summary?.totalPatients != null ? String(summary.totalPatients) : '...'}
          delta="+12%"
          up
          foot="Registered this clinic"
        />
        <StatCard
          ic="ticket"
          label="Today's tokens"
          value={summary?.todayTokens != null ? String(summary.todayTokens) : '...'}
          accent
          foot="Issued today"
        />
        <StatCard
          ic="stethoscope"
          tone="green"
          label="Active doctors"
          value={summary?.totalDoctors != null ? String(summary.totalDoctors) : '...'}
          foot="On duty today"
        />
        <StatCard
          ic="receipt"
          tone="amber"
          label="Revenue today"
          value={summary?.totalRevenue != null ? `₹${Number(summary.totalRevenue).toLocaleString('en-IN')}` : '...'}
          delta="+8%"
          up
          foot="Consultations + procedures"
        />
      </div>

      {/* Chart + Queue row */}
      <div className="dash-grid">
        {/* Tokens this week bar chart */}
        <div className="card">
          <div className="card-h">
            <div>
              <h2>Tokens this week</h2>
              <div className="sub">Daily token vs visit volume</div>
            </div>
            <div className="chart-legend">
              <span>
                <span
                  className="swatch"
                  style={{ background: 'var(--brand-gradient)' }}
                />
                Tokens
              </span>
            </div>
          </div>
          {chartDays.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--fg-muted)', fontSize: 13 }}>
              No data available
            </div>
          ) : (
            <div className="bars">
              {chartDays.map((day: any) => {
                const tokH = Math.round((day.tokens / maxTokens) * 100)
                return (
                  <div key={day.label} className="bar-col">
                    <div className="bar-stack">
                      <div
                        className="bar"
                        style={{ height: `${tokH}%` }}
                        title={`${day.tokens} tokens`}
                      />
                    </div>
                    <div className="bar-lbl">{day.label}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pending bills summary */}
        <div className="card">
          <div className="card-h">
            <div>
              <h2>Billing overview</h2>
              <div className="sub">Pending collections</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setRoute('billing')}>
              View all
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg-section)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>Pending bills</div>
                <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 2 }}>Awaiting payment</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--amber-600)' }}>
                {summary?.pendingBills != null ? summary.pendingBills : '...'}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg-section)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>Total appointments</div>
                <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 2 }}>All time</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--teal-600)' }}>
                {summary?.totalAppointments != null ? summary.totalAppointments : '...'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts + Dept load */}
      <div className="dash-grid">
        {/* Alerts */}
        <div className="card">
          <div className="card-h">
            <div>
              <h2>Alerts</h2>
              <div className="sub">{ALERTS.length} active alerts</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ALERTS.map((a: AlertItem, i: number) => {
              const cfg = ALERT_ICONS[a.kind] ?? ALERT_ICONS.info
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '10px 12px',
                    background: 'var(--bg-section)',
                    borderRadius: 12,
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div className={`av ${cfg.cls}`} style={{ flexShrink: 0 }}>
                    <Icon name={cfg.ic} size={15} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>
                      {a.t}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 2 }}>
                      {a.s}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {a.when}
                  </div>
                  <span className={`badge ${alertToBadge(a.kind)}`}>
                    {a.kind === 'danger' ? 'Critical' : a.kind === 'warn' ? 'Warning' : 'Info'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Department load */}
        <div className="card">
          <div className="card-h">
            <div>
              <h2>Department load</h2>
              <div className="sub">Current capacity utilization</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {DEPT_LOAD.map(d => (
              <div key={d.dept}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>
                    {d.dept}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-secondary)' }}>
                    {d.pct}%
                  </span>
                </div>
                <div style={{
                  height: 7,
                  background: 'var(--bg-section)',
                  borderRadius: 99,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${d.pct}%`,
                    background: d.color,
                    borderRadius: 99,
                    transition: 'width 0.6s var(--ease-out)',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
