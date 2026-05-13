import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import { useAppStore } from '@/store/app'
import { CLINICS, DOCTORS, NURSES } from '@/data'
import type { Clinic } from '@/types'

const UTIL_COLORS: string[] = [
  'var(--brand-gradient)',
  'linear-gradient(90deg,#7C3AED,#A78BFA)',
  'linear-gradient(90deg,#EC4899,#F9A8D4)',
  'linear-gradient(90deg,#059669,#6EE7B7)',
  'linear-gradient(90deg,#B45309,#FCD34D)',
  'linear-gradient(90deg,#0369A1,#7DD3FC)',
  'linear-gradient(90deg,#1FA3A8,#7FCDD0)',
  'linear-gradient(90deg,#6D28D9,#C4B5FD)',
]

// Synthetic utilization percentages per clinic
const UTIL_MAP: Record<string, number> = {
  'C-001': 88, 'C-002': 74, 'C-003': 61,
  'C-004': 95, 'C-005': 42, 'C-006': 57,
  'C-007': 79, 'C-008': 33,
}

// Clinic type breakdown for donut
const TYPE_DATA: { label: string; count: number; color: string }[] = [
  { label: 'Multi-specialty', count: 3, color: '#2C6ED5' },
  { label: 'Hospital',        count: 2, color: '#7C3AED' },
  { label: 'Specialty',       count: 2, color: '#EC4899' },
  { label: 'Polyclinic',      count: 1, color: '#059669' },
]

function DonutChart() {
  const total   = TYPE_DATA.reduce((s, d) => s + d.count, 0)
  const r       = 44
  const cx      = 60
  const cy      = 60
  const circ    = 2 * Math.PI * r
  let offset    = 0

  const slices = TYPE_DATA.map(d => {
    const dash  = (d.count / total) * circ
    const gap   = circ - dash
    const slice = { ...d, dash, gap, offset }
    offset += dash
    return slice
  })

  return (
    <svg viewBox="0 0 120 120" width={120} height={120}>
      {slices.map(s => (
        <circle
          key={s.label}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={s.color}
          strokeWidth={14}
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={18} fontWeight={800} fill="var(--fg-primary)">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9}  fontWeight={600} fill="var(--fg-secondary)">Clinics</text>
    </svg>
  )
}

const totalDoctors = DOCTORS.length
const activeClinics = CLINICS.filter((c: Clinic) => c.status === 'active').length
const totalRooms = CLINICS.reduce((s: number, c: Clinic) => s + c.rooms, 0)

const topClinics = [...CLINICS]
  .filter((c: Clinic) => c.status !== 'pending')
  .sort((a: Clinic, b: Clinic) => b.rating - a.rating)
  .slice(0, 5)

const staffingData = [
  { label: 'Doctors',    count: DOCTORS.length,  color: 'var(--brand-gradient)' },
  { label: 'Nurses',     count: NURSES.length,   color: 'linear-gradient(90deg,#EC4899,#F9A8D4)' },
  { label: 'Front desk', count: 7,               color: 'linear-gradient(90deg,#059669,#6EE7B7)' },
]
const maxStaff = Math.max(...staffingData.map(d => d.count))

export default function ClinicDashboard() {
  const { setRoute } = useAppStore()

  return (
    <div className="main">
      <Header
        title="Clinic dashboard"
        crumbs="Network overview"
      />

      {/* Stat cards */}
      <div className="stats-grid">
        <StatCard
          ic="building"
          tone="blue"
          label="Total clinics"
          value="8"
          foot="Across Bengaluru"
        />
        <StatCard
          ic="activity"
          label="Active right now"
          value={String(activeClinics)}
          accent
          foot="Clinics open today"
        />
        <StatCard
          ic="stethoscope"
          tone="plum"
          label="Doctors enrolled"
          value={String(totalDoctors)}
          foot="Across all clinics"
        />
        <StatCard
          ic="clipboard"
          tone="amber"
          label="Consult rooms"
          value={String(totalRooms)}
          foot="Total across network"
        />
      </div>

      {/* Utilization + Donut */}
      <div className="dash-grid">
        {/* Clinic utilization */}
        <div className="card">
          <div className="card-h">
            <div>
              <h2>Clinic utilization</h2>
              <div className="sub">Current capacity %</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setRoute('clinics')}>
              All clinics
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {CLINICS.map((c: Clinic, i: number) => {
              const pct = UTIL_MAP[c.id] ?? 50
              const color = UTIL_COLORS[i % UTIL_COLORS.length]
              return (
                <div key={c.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>
                        {c.name}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--fg-secondary)', marginLeft: 8 }}>
                        {c.type}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-secondary)' }}>
                      {pct}%
                    </span>
                  </div>
                  <div style={{ height: 7, background: 'var(--bg-section)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: color,
                      borderRadius: 99,
                      transition: 'width 0.6s var(--ease-out)',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Network mix donut */}
        <div className="card">
          <div className="card-h">
            <div>
              <h2>Network mix</h2>
              <div className="sub">Clinic type breakdown</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <DonutChart />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {TYPE_DATA.map(d => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-primary)', flex: 1 }}>
                    {d.label}
                  </span>
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    background: 'var(--bg-section)',
                    borderRadius: 6,
                    padding: '2px 8px',
                    color: 'var(--fg-secondary)',
                  }}>
                    {d.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top clinics + Staffing */}
      <div className="dash-grid">
        {/* Top performing clinics */}
        <div className="card">
          <div className="card-h">
            <div>
              <h2>Top performing clinics</h2>
              <div className="sub">Sorted by patient rating</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topClinics.map((c: Clinic, i: number) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  background: 'var(--bg-section)',
                  borderRadius: 12,
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: 8,
                  background: i === 0 ? 'var(--brand-gradient)' : 'var(--ink-100)',
                  color: i === 0 ? 'white' : 'var(--fg-secondary)',
                  fontSize: 11, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div className={`av ${c.tone}`} style={{ borderRadius: 10, flexShrink: 0 }}>
                  {c.logo}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-secondary)', marginTop: 2 }}>
                    {c.type} · {c.area}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: 'var(--warning-500)', flexShrink: 0 }}>
                  ★ {c.rating}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Staffing snapshot */}
        <div className="card">
          <div className="card-h">
            <div>
              <h2>Staffing snapshot</h2>
              <div className="sub">Enrolled across network</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 8 }}>
            {staffingData.map(s => (
              <div key={s.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>
                    {s.label}
                  </span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--fg-primary)', letterSpacing: '-0.03em' }}>
                    {s.count}
                  </span>
                </div>
                <div style={{ height: 10, background: 'var(--bg-section)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.round((s.count / maxStaff) * 100)}%`,
                    background: s.color,
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
