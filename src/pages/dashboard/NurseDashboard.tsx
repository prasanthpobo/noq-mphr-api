import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import Icon from '@/components/ui/Icon'
import { useAppStore } from '@/store/app'
import { nursesService } from '@/services/nurses.service'

interface Task {
  time: string
  task: string
  patient: string
  priority: 'high' | 'medium' | 'low'
}

const TASKS: Task[] = [
  { time: '10:15', task: 'Administer insulin',        patient: 'Suresh Patel · ICU-A Bed 3',    priority: 'high'   },
  { time: '10:30', task: 'Vital signs check',         patient: 'Aanya Bhattacharya · ICU-A Bed 1', priority: 'high' },
  { time: '10:45', task: 'IV line change',            patient: 'Karthik Nair · ICU-A Bed 2',    priority: 'medium' },
  { time: '11:00', task: 'Medication round',          patient: 'All ICU-A patients',             priority: 'high'   },
  { time: '11:30', task: 'Dressing change — wound',  patient: 'Rohan Singh · Ward-5 Bed 8',     priority: 'low'    },
]

interface WardBar {
  ward: string
  occupied: number
  total: number
  color: string
}

const WARD_BARS: WardBar[] = [
  { ward: 'ICU-A',   occupied: 6,  total: 8,  color: 'var(--brand-gradient)'                  },
  { ward: 'ER',      occupied: 9,  total: 12, color: 'linear-gradient(90deg,#EC4899,#F9A8D4)' },
  { ward: 'Peds-2',  occupied: 7,  total: 10, color: 'linear-gradient(90deg,#059669,#6EE7B7)' },
  { ward: 'Mat-1',   occupied: 4,  total: 6,  color: 'linear-gradient(90deg,#B45309,#FCD34D)' },
  { ward: 'Ward-5',  occupied: 14, total: 20, color: 'linear-gradient(90deg,#0369A1,#7DD3FC)' },
]

interface Vital {
  patient: string
  bed: string
  bp: string
  hr: number
  temp: number
  bpOk: boolean
  hrOk: boolean
  tempOk: boolean
}

const VITALS: Vital[] = [
  { patient: 'Aanya B.',   bed: 'Bed 1', bp: '118/76', hr: 72,  temp: 36.8, bpOk: true,  hrOk: true,  tempOk: true  },
  { patient: 'Karthik N.', bed: 'Bed 2', bp: '148/92', hr: 96,  temp: 37.4, bpOk: false, hrOk: false, tempOk: true  },
  { patient: 'Suresh P.',  bed: 'Bed 3', bp: '162/104',hr: 110, temp: 38.2, bpOk: false, hrOk: false, tempOk: false },
  { patient: 'Meera I.',   bed: 'Bed 4', bp: '122/80', hr: 68,  temp: 36.6, bpOk: true,  hrOk: true,  tempOk: true  },
]

interface HandoffNote {
  time: string
  note: string
  by: string
}

const HANDOFF: HandoffNote[] = [
  { time: '06:45', note: 'Suresh Patel — BP elevated, cardiologist notified',         by: 'Night shift' },
  { time: '07:10', note: 'ICU-A Bed 2 IV replaced, no complications',                  by: 'Night shift' },
  { time: '07:30', note: 'Dr. Vikram on call for Cardio until 08:00',                  by: 'Charge nurse' },
  { time: '08:00', note: 'Morning meds administered, Bed 3 patient fasting',           by: 'Sister Mary' },
]

function priorityBadge(p: Task['priority']): { cls: string; label: string } {
  if (p === 'high')   return { cls: 'danger',  label: 'High'   }
  if (p === 'medium') return { cls: 'warning', label: 'Medium' }
  return                     { cls: 'muted',   label: 'Low'    }
}

function vitalColor(ok: boolean): string {
  return ok ? 'var(--success-600, #059669)' : 'var(--danger-500, #EF4444)'
}

export default function NurseDashboard() {
  const { setRoute } = useAppStore()
  const [onDutyNurses, setOnDutyNurses] = useState<any[]>([])

  useEffect(() => {
    nursesService.list({ status: 'active' }).then(res => {
      setOnDutyNurses((res.data || []).slice(0, 5))
    }).catch(() => {})
  }, [])

  return (
    <>
      <Header
        title="Hello, Sister Mary"
        crumbs="Saturday, 9 May 2026 · ICU-A · Morning shift"
      />
      <div className="main">
        {/* Stat cards */}
        <div className="stats-grid">
          <StatCard
            ic="heart"
            tone="pink"
            label="Patients on watch"
            value="12"
            foot="ICU-A active patients"
          />
          <StatCard
            ic="hourglass"
            label="Tasks due in 1h"
            value="5"
            accent
            foot="Requires immediate action"
          />
          <StatCard
            ic="alert"
            tone="amber"
            label="Alerts"
            value="3"
            foot="2 vitals, 1 medication"
          />
          <StatCard
            ic="check"
            tone="green"
            label="Completed today"
            value="14"
            foot="Tasks finished this shift"
          />
        </div>

        {/* Task list + Ward occupancy */}
        <div className="dash-grid">
          {/* Task list */}
          <div className="card">
            <div className="card-h">
              <div>
                <h2>Task list</h2>
                <div className="sub">Next 5 pending tasks</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setRoute('nurses')}>
                All tasks
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {TASKS.map((t: Task, i: number) => {
                const badge = priorityBadge(t.priority)
                const isHigh = t.priority === 'high'
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '9px 12px',
                      borderRadius: 10,
                      background: isHigh ? 'rgba(239,68,68,0.06)' : 'var(--bg-section)',
                      border: `1px solid ${isHigh ? 'rgba(239,68,68,0.2)' : 'var(--border-light)'}`,
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
                      {t.time}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>
                        {t.task}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--fg-secondary)', marginTop: 1 }}>
                        {t.patient}
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

          {/* Ward occupancy + On duty */}
          <div className="card">
            <div className="card-h">
              <div>
                <h2>Ward occupancy</h2>
                <div className="sub">Current bed utilization</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {WARD_BARS.map((w: WardBar) => {
                const pct = Math.round((w.occupied / w.total) * 100)
                return (
                  <div key={w.ward}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>
                        {w.ward}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>
                        <strong style={{ fontWeight: 700 }}>{w.occupied}</strong>/{w.total} beds · {pct}%
                      </span>
                    </div>
                    <div style={{ height: 7, background: 'var(--bg-section)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: w.color,
                        borderRadius: 99,
                        transition: 'width 0.6s var(--ease-out)',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* On duty now */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                On duty now
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {onDutyNurses.map((n, idx) => (
                  <div
                    key={n._id}
                    className={`av ${['blue','teal','pink','amber','green'][idx % 5]}`}
                    title={n.name}
                    style={{
                      marginLeft: idx === 0 ? 0 : -8,
                      border: '2px solid var(--bg-surface)',
                      borderRadius: '50%',
                      zIndex: onDutyNurses.length - idx,
                      position: 'relative',
                      flexShrink: 0,
                    }}
                  >
                    {n.name?.slice(0, 2) || 'NU'}
                  </div>
                ))}
                <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--fg-secondary)', fontWeight: 500 }}>
                  {onDutyNurses.length} nurses on shift
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Patient vitals + Handoff notes */}
        <div className="dash-grid">
          {/* Patient vitals */}
          <div className="card">
            <div className="card-h">
              <div>
                <h2>Patient vitals · ICU-A</h2>
                <div className="sub">Last reading — updated 4 min ago</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Header row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 80px 80px 80px',
                gap: 8,
                padding: '0 12px',
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Patient</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>BP</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>HR</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Temp</span>
              </div>
              {VITALS.map((v: Vital) => (
                <div
                  key={v.patient}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 80px 80px 80px',
                    gap: 8,
                    padding: '10px 12px',
                    background: 'var(--bg-section)',
                    borderRadius: 10,
                    border: '1px solid var(--border-light)',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>
                      {v.patient}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--fg-secondary)', marginTop: 1 }}>
                      ICU-A · {v.bed}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: vitalColor(v.bpOk) }}>
                      {v.bp}
                    </span>
                    <div style={{ fontSize: 10, color: 'var(--fg-muted)' }}>mmHg</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: vitalColor(v.hrOk) }}>
                      {v.hr}
                    </span>
                    <div style={{ fontSize: 10, color: 'var(--fg-muted)' }}>bpm</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: vitalColor(v.tempOk) }}>
                      {v.temp}°C
                    </span>
                    <div style={{ fontSize: 10, color: 'var(--fg-muted)' }}>temp</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shift handoff notes */}
          <div className="card">
            <div className="card-h">
              <div>
                <h2>Shift handoff notes</h2>
                <div className="sub">From night shift · 4 entries</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setRoute('nurses')}>
                Add note
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {HANDOFF.map((h: HandoffNote, i: number) => (
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
                  <div className="av blue" style={{ flexShrink: 0 }}>
                    <Icon name="clipboard" size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-primary)', lineHeight: 1.4 }}>
                      {h.note}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--fg-secondary)', marginTop: 3 }}>
                      {h.by}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>
                    {h.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
