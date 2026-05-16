import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import Icon from '@/components/ui/Icon'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'
import dayjs from 'dayjs'

function greeting(name: string): string {
  const h = new Date().getHours()
  const period = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
  return `Good ${period}, Dr. ${name}`
}

interface Appt {
  time: string
  patient: string
  age: string
  kind: string
  status: 'done' | 'in' | 'next' | 'waiting'
}

const SCHEDULE: Appt[] = [
  { time: '08:30', patient: 'Rohan Singh',         age: '40 · M', kind: 'Follow-up',      status: 'done'    },
  { time: '08:45', patient: 'Tanvi Joshi',          age: '36 · F', kind: 'Consultation',   status: 'done'    },
  { time: '09:00', patient: 'Aarav Sharma',         age: '34 · M', kind: 'Consultation',   status: 'in'      },
  { time: '09:20', patient: 'Meera Iyer',           age: '28 · F', kind: 'Review',         status: 'next'    },
  { time: '09:40', patient: 'Karthik Nair',         age: '45 · M', kind: 'Follow-up',      status: 'waiting' },
  { time: '10:00', patient: 'Ishaan Verma',         age: '31 · M', kind: 'Consultation',   status: 'waiting' },
  { time: '10:20', patient: 'Aanya Bhattacharya',   age: '24 · F', kind: 'Consultation',   status: 'waiting' },
]

interface WeekDay { d: string; n: number }
const WEEK_DAYS: WeekDay[] = [
  { d: 'Mon', n: 14 },
  { d: 'Tue', n: 20 },
  { d: 'Wed', n: 17 },
  { d: 'Thu', n: 22 },
  { d: 'Fri', n: 26 },
  { d: 'Sat', n: 18 },
  { d: 'Sun', n: 0  },
]

const MIX: { label: string; count: number; color: string }[] = [
  { label: 'Hypertension',   count: 6, color: 'var(--brand-gradient)'                   },
  { label: 'Diabetes',       count: 4, color: 'linear-gradient(90deg,#7C3AED,#A78BFA)'  },
  { label: 'Cardiac review', count: 3, color: 'linear-gradient(90deg,#EC4899,#F9A8D4)'  },
  { label: 'Routine',        count: 3, color: 'linear-gradient(90deg,#059669,#6EE7B7)'  },
  { label: 'Other',          count: 2, color: 'linear-gradient(90deg,#B45309,#FCD34D)'  },
]
const maxMix = Math.max(...MIX.map(m => m.count))

const STARS = [5, 4, 3, 2, 1]
const STAR_COUNTS: Record<number, number> = { 5: 24, 4: 8, 3: 2, 2: 1, 1: 0 }
const totalReviews = Object.values(STAR_COUNTS).reduce((a, b) => a + b, 0)

const maxWeek = Math.max(...WEEK_DAYS.map(d => d.n))

function statusBadge(s: Appt['status']): { cls: string; label: string } {
  if (s === 'done')    return { cls: 'blue',    label: 'Done'    }
  if (s === 'in')      return { cls: 'danger',  label: 'In room' }
  if (s === 'next')    return { cls: 'warning', label: 'Next up' }
  return                      { cls: 'muted',   label: 'Waiting' }
}

export default function DoctorDashboard() {
  const { setRoute } = useAppStore()
  const user         = useAuthStore(s => s.user)

  return (
    <>
      <Header
        title={greeting(user?.name ?? 'Doctor')}
        crumbs={`${dayjs().format('dddd, D MMM YYYY')} · Your OPD`}
      />
      <div className="main">
        {/* Stat cards */}
        <div className="stats-grid">
          <StatCard
            ic="users"
            tone="blue"
            label="Today's patients"
            value="18"
            foot="Scheduled for today"
          />
          <StatCard
            ic="user"
            label="Currently in room"
            value="1"
            accent
            foot="Aarav Sharma"
          />
          <StatCard
            ic="clock"
            tone="amber"
            label="Avg consult time"
            value="14 min"
            foot="Last 7 days average"
          />
          <StatCard
            ic="check"
            tone="green"
            label="Completed"
            value="2/18"
            foot="Today so far"
          />
        </div>

        {/* Schedule + This week */}
        <div className="dash-grid">
          {/* Today's schedule */}
          <div className="card">
            <div className="card-h">
              <div>
                <h2>Today's schedule</h2>
                <div className="sub">7 appointments · OPD-2</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setRoute('appointments')}>
                Full view
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SCHEDULE.map((a: Appt, i: number) => {
                const badge = statusBadge(a.status)
                const isIn  = a.status === 'in'
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '9px 12px',
                      borderRadius: 10,
                      background: isIn ? 'rgba(245,158,11,0.08)' : 'var(--bg-section)',
                      border: `1px solid ${isIn ? 'rgba(245,158,11,0.25)' : 'var(--border-light)'}`,
                    }}
                  >
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--fg-secondary)',
                      minWidth: 38,
                      flexShrink: 0,
                    }}>
                      {a.time}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>
                        {a.patient}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--fg-secondary)', marginTop: 1 }}>
                        {a.age} · {a.kind}
                      </div>
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

          {/* This week + quick stats */}
          <div className="card">
            <div className="card-h">
              <div>
                <h2>This week</h2>
                <div className="sub">Daily patient count</div>
              </div>
            </div>
            <div className="bars" style={{ height: 120 }}>
              {WEEK_DAYS.map((d: WeekDay) => {
                const h = maxWeek > 0 ? Math.round((d.n / maxWeek) * 100) : 0
                return (
                  <div key={d.d} className="bar-col">
                    <div className="bar-stack">
                      <div
                        className="bar"
                        style={{ height: `${h}%`, flex: 'none', width: '100%' }}
                        title={`${d.n} patients`}
                      />
                    </div>
                    <div className="bar-lbl">{d.d}</div>
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {([
                { ic: 'repeat',    color: 'amber', label: 'Follow-ups due',       val: '4' },
                { ic: 'flask',     color: 'blue',  label: 'Lab results pending',   val: '2' },
                { ic: 'clipboard', color: 'plum',  label: 'Prescription drafts',   val: '3' },
              ] as const).map(row => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    background: 'var(--bg-section)',
                    borderRadius: 10,
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div className={`av ${row.color}`} style={{ width: 28, height: 28, borderRadius: 8, fontSize: 12 }}>
                    <Icon name={row.ic} size={13} />
                  </div>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--fg-primary)' }}>
                    {row.label}
                  </span>
                  <span style={{
                    fontSize: 14, fontWeight: 800, color: 'var(--fg-primary)',
                    background: 'var(--bg-surface)', borderRadius: 6,
                    padding: '1px 8px', border: '1px solid var(--border-soft)',
                  }}>
                    {row.val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Patient mix + Feedback */}
        <div className="dash-grid">
          {/* Patient mix */}
          <div className="card">
            <div className="card-h">
              <div>
                <h2>Patient mix</h2>
                <div className="sub">Today's case breakdown</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {MIX.map(m => (
                <div key={m.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>
                      {m.label}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-secondary)' }}>
                      {m.count} patients
                    </span>
                  </div>
                  <div style={{ height: 7, background: 'var(--bg-section)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.round((m.count / maxMix) * 100)}%`,
                      background: m.color,
                      borderRadius: 99,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Patient feedback */}
          <div className="card">
            <div className="card-h">
              <div>
                <h2>Patient feedback</h2>
                <div className="sub">{totalReviews} reviews this month</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--fg-primary)', lineHeight: 1 }}>
                  4.8
                </div>
                <div style={{ fontSize: 13, color: 'var(--warning-500)', marginTop: 4, letterSpacing: 1 }}>
                  ★★★★★
                </div>
                <div style={{ fontSize: 11, color: 'var(--fg-secondary)', marginTop: 4 }}>
                  out of 5
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {STARS.map(s => {
                  const pct = totalReviews > 0 ? Math.round((STAR_COUNTS[s] / totalReviews) * 100) : 0
                  return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-secondary)', minWidth: 10 }}>
                        {s}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--warning-500)' }}>★</span>
                      <div style={{ flex: 1, height: 6, background: 'var(--bg-section)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: 'var(--brand-gradient)',
                          borderRadius: 99,
                        }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--fg-muted)', minWidth: 20, textAlign: 'right' }}>
                        {STAR_COUNTS[s]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div style={{
              padding: '12px 14px',
              background: 'var(--bg-section)',
              borderRadius: 10,
              borderLeft: '3px solid var(--brand-gradient-start)',
            }}>
              <p style={{ fontSize: 12.5, color: 'var(--fg-secondary)', fontStyle: 'italic', lineHeight: 1.6 }}>
                "Dr. Khanna was incredibly thorough and patient. He explained everything clearly and made me feel at ease."
              </p>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 6 }}>
                — Meera I. · 2 days ago
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
