import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import { reportsService } from '@/services/reports.service'
import dayjs from 'dayjs'

// ─── Types ────────────────────────────────────────────────────────────────────

type DateRange = 'Today' | '7d' | '30d' | 'Custom'
type SortKey = 'token' | 'date' | 'patient' | 'doctor' | 'dept' | 'fee' | 'status'
type SortDir = 'asc' | 'desc'

// ─── Mock data ────────────────────────────────────────────────────────────────

interface ApptRow {
  token: string
  date: string
  patient: string
  doctor: string
  dept: string
  fee: number
  status: 'Completed' | 'Waiting' | 'Cancelled' | 'No-show'
}

interface RevRow {
  invoiceId: string
  date: string
  patient: string
  amount: number
  method: 'UPI' | 'Card' | 'Cash' | 'Insurance'
  status: 'Paid' | 'Pending' | 'Refunded'
}

const APPT_ROWS: ApptRow[] = [
  { token: 'A-024', date: 'Today 09:30', patient: 'Aarav Sharma',       doctor: 'Dr. Ananya Rao',   dept: 'OPD',     fee: 400, status: 'Completed' },
  { token: 'A-025', date: 'Today 09:45', patient: 'Meera Iyer',         doctor: 'Dr. Ananya Rao',   dept: 'OPD',     fee: 400, status: 'Waiting'   },
  { token: 'E-002', date: 'Today 09:50', patient: 'Suresh Patel',       doctor: 'Dr. Vikram Mehta', dept: 'Cardio',  fee: 800, status: 'Completed' },
  { token: 'A-026', date: 'Today 10:00', patient: 'Riya Kapoor',        doctor: 'Dr. Rahul Khanna', dept: 'Peds',    fee: 500, status: 'Waiting'   },
  { token: 'B-013', date: 'Today 10:15', patient: 'Karthik Nair',       doctor: 'Dr. Vikram Mehta', dept: 'Cardio',  fee: 800, status: 'Completed' },
  { token: 'A-027', date: 'Today 10:30', patient: 'Ishaan Verma',       doctor: 'Dr. Ananya Rao',   dept: 'OPD',     fee: 400, status: 'Waiting'   },
  { token: 'C-008', date: 'Today 10:45', patient: 'Aanya Bhattacharya', doctor: 'Dr. Priya Iyer',   dept: 'Derm',    fee: 600, status: 'Cancelled' },
  { token: 'A-022', date: 'Today 08:45', patient: 'Rohan Singh',        doctor: 'Dr. Ananya Rao',   dept: 'OPD',     fee: 400, status: 'Completed' },
  { token: 'D-004', date: 'Yesterday',   patient: 'Tanvi Joshi',        doctor: 'Dr. Neha Sharma',  dept: 'Gyn',     fee: 700, status: 'Completed' },
  { token: 'F-006', date: 'Yesterday',   patient: 'Devansh Gupta',      doctor: 'Dr. Arjun Desai',  dept: 'Ortho',   fee: 750, status: 'No-show'   },
]

const REV_ROWS: RevRow[] = [
  { invoiceId: 'INV-20260513-001', date: 'Today 09:30', patient: 'Aarav Sharma',       amount: 400,  method: 'UPI',       status: 'Paid'     },
  { invoiceId: 'INV-20260513-002', date: 'Today 09:50', patient: 'Suresh Patel',       amount: 800,  method: 'Card',      status: 'Paid'     },
  { invoiceId: 'INV-20260513-003', date: 'Today 10:15', patient: 'Karthik Nair',       amount: 800,  method: 'Insurance', status: 'Pending'  },
  { invoiceId: 'INV-20260513-004', date: 'Today 08:45', patient: 'Rohan Singh',        amount: 400,  method: 'Cash',      status: 'Paid'     },
  { invoiceId: 'INV-20260512-001', date: 'Yesterday',   patient: 'Tanvi Joshi',        amount: 700,  method: 'UPI',       status: 'Paid'     },
  { invoiceId: 'INV-20260512-002', date: 'Yesterday',   patient: 'Meera Iyer',         amount: 1200, method: 'Card',      status: 'Paid'     },
  { invoiceId: 'INV-20260511-001', date: '11 May',      patient: 'Devansh Gupta',      amount: 750,  method: 'Cash',      status: 'Refunded' },
  { invoiceId: 'INV-20260511-002', date: '11 May',      patient: 'Aanya Bhattacharya', amount: 600,  method: 'UPI',       status: 'Pending'  },
]

// ─── Chart helpers ────────────────────────────────────────────────────────────

const CHART_W = 480
const CHART_H = 160
const PAD = { top: 16, right: 16, bottom: 28, left: 44 }
const innerW = CHART_W - PAD.left - PAD.right
const innerH = CHART_H - PAD.top - PAD.bottom

function scaleX(i: number, total: number) {
  return PAD.left + (i / (total - 1)) * innerW
}

function makePolyline(values: number[], maxVal: number): string {
  return values.map((v, i) =>
    `${scaleX(i, values.length)},${PAD.top + innerH - (v / maxVal) * innerH}`
  ).join(' ')
}

const REVENUE_BY_DAY = [42400, 55200, 48600, 61800, 73200, 82400, 56100]
const maxRev = Math.max(...REVENUE_BY_DAY)

// ─── Donut chart ──────────────────────────────────────────────────────────────

interface DonutSlice {
  label: string
  pct: number
  count: number
  color: string
}

const DONUT_SLICES: DonutSlice[] = [
  { label: 'Completed', pct: 72, count: 1340, color: '#1FA3A8' },
  { label: 'Waiting',   pct: 15, count: 276,  color: '#3B82F6' },
  { label: 'Cancelled', pct: 10, count: 184,  color: '#EF4444' },
  { label: 'No-show',   pct: 3,  count: 47,   color: '#9CA3AF' },
]

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToXY(cx, cy, r, startAngle)
  const end   = polarToXY(cx, cy, r, endAngle)
  const large = endAngle - startAngle > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`
}

function DonutChart() {
  const cx = 100, cy = 100, r = 72, innerR = 46
  let cumDeg = 0
  const total = DONUT_SLICES.reduce((s, sl) => s + sl.count, 0)

  return (
    <svg width={200} height={200} viewBox="0 0 200 200">
      {DONUT_SLICES.map(sl => {
        const deg = (sl.pct / 100) * 360
        const startA = cumDeg
        const endA = cumDeg + deg - 1.5
        cumDeg += deg
        const pathD = describeArc(cx, cy, r, startA, endA)
        return (
          <path
            key={sl.label}
            d={pathD}
            fill="none"
            stroke={sl.color}
            strokeWidth={28}
            strokeLinecap="butt"
          />
        )
      })}
      {/* Inner circle mask */}
      <circle cx={cx} cy={cy} r={innerR} fill="var(--bg-surface)" />
      {/* Center label */}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize={11} fill="var(--fg-muted)" fontFamily="inherit">Total</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={18} fontWeight="800" fill="var(--fg-primary)" fontFamily="inherit">
        {(total / 1000).toFixed(1)}k
      </text>
    </svg>
  )
}

// ─── Revenue bar chart ────────────────────────────────────────────────────────

const BAR_W = 480
const BAR_H = 160
const BAR_PAD = { top: 16, right: 16, bottom: 28, left: 56 }
const BAR_INNER_W = BAR_W - BAR_PAD.left - BAR_PAD.right
const BAR_INNER_H = BAR_H - BAR_PAD.top - BAR_PAD.bottom
const BAR_COUNT = REVENUE_BY_DAY.length
const BAR_SLOT = BAR_INNER_W / BAR_COUNT
const BAR_WIDTH = BAR_SLOT * 0.55
const peakIdx = REVENUE_BY_DAY.indexOf(maxRev)

function BarChart({ chartDays }: { chartDays: any[] }) {
  const labels = chartDays.length > 0 ? chartDays : REVENUE_BY_DAY.map((_, i) => ({ label: `D${i + 1}` }))
  return (
    <svg width="100%" viewBox={`0 0 ${BAR_W} ${BAR_H}`} style={{ display: 'block' }}>
      {/* Gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map(f => {
        const y = BAR_PAD.top + BAR_INNER_H * (1 - f)
        return (
          <g key={f}>
            <line x1={BAR_PAD.left} x2={BAR_W - BAR_PAD.right} y1={y} y2={y} stroke="var(--border-soft)" strokeWidth={1} />
            <text x={BAR_PAD.left - 6} y={y + 4} textAnchor="end" fontSize={9} fill="var(--fg-muted)" fontFamily="inherit">
              {Math.round((maxRev * f) / 1000)}k
            </text>
          </g>
        )
      })}
      {/* Bars */}
      {REVENUE_BY_DAY.map((v, i) => {
        const bh = (v / maxRev) * BAR_INNER_H
        const x = BAR_PAD.left + i * BAR_SLOT + (BAR_SLOT - BAR_WIDTH) / 2
        const y = BAR_PAD.top + BAR_INNER_H - bh
        const fill = i === peakIdx ? '#F59E0B' : 'url(#barGrad)'
        return (
          <g key={i}>
            <rect x={x} y={y} width={BAR_WIDTH} height={bh} fill={fill} rx={3} />
            <text x={x + BAR_WIDTH / 2} y={BAR_H - BAR_PAD.bottom + 12} textAnchor="middle" fontSize={9} fill="var(--fg-muted)" fontFamily="inherit">
              {labels[i]?.label ?? `D${i + 1}`}
            </text>
          </g>
        )
      })}
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1FA3A8" />
          <stop offset="100%" stopColor="#0F5F67" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ─── Appointments trend line chart ───────────────────────────────────────────

function LineChart({ chartDays }: { chartDays: any[] }) {
  const maxTokens = chartDays.length > 0 ? Math.max(...chartDays.map((d: any) => d.tokens), 1) : 1
  const tokensPoints = chartDays.length > 1 ? makePolyline(chartDays.map((d: any) => d.tokens), maxTokens) : ''
  const revPoints    = makePolyline(REVENUE_BY_DAY.map(v => v / 1000), maxRev / 1000)
  const chartLen = Math.max(chartDays.length, 2)

  return (
    <svg width="100%" viewBox={`0 0 ${CHART_W} ${CHART_H}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1FA3A8" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#1FA3A8" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map(f => {
        const y = PAD.top + innerH * (1 - f)
        return (
          <g key={f}>
            <line x1={PAD.left} x2={CHART_W - PAD.right} y1={y} y2={y} stroke="var(--border-soft)" strokeWidth={1} />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={9} fill="var(--fg-muted)" fontFamily="inherit">
              {Math.round(maxTokens * f)}
            </text>
          </g>
        )
      })}

      {/* Area under tokens line */}
      {tokensPoints && (
        <polygon
          points={`${tokensPoints} ${scaleX(chartDays.length - 1, chartLen)},${PAD.top + innerH} ${PAD.left},${PAD.top + innerH}`}
          fill="url(#areaGrad)"
        />
      )}

      {/* Token line (solid teal) */}
      {tokensPoints && (
        <polyline points={tokensPoints} fill="none" stroke="#1FA3A8" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      )}

      {/* Revenue line (dashed amber) */}
      <polyline points={revPoints} fill="none" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 3" strokeLinejoin="round" strokeLinecap="round" />

      {/* X axis labels */}
      {chartDays.map((d: any, i: number) => (
        <text key={i} x={scaleX(i, chartLen)} y={CHART_H - 4} textAnchor="middle" fontSize={9} fill="var(--fg-muted)" fontFamily="inherit">
          {d.label}
        </text>
      ))}

      {/* Dots on token line */}
      {chartDays.map((d: any, i: number) => {
        const x = scaleX(i, chartLen)
        const y = PAD.top + innerH - (d.tokens / maxTokens) * innerH
        return <circle key={i} cx={x} cy={y} r={3} fill="#1FA3A8" />
      })}
    </svg>
  )
}

// ─── Sort helpers ────────────────────────────────────────────────────────────

function apptStatusVariant(s: ApptRow['status']) {
  if (s === 'Completed') return 'success' as const
  if (s === 'Waiting') return 'blue' as const
  if (s === 'Cancelled') return 'danger' as const
  return 'warning' as const
}

function revStatusVariant(s: RevRow['status']) {
  if (s === 'Paid') return 'success' as const
  if (s === 'Refunded') return 'info' as const
  return 'warning' as const
}

function methodIcon(m: RevRow['method']): string {
  if (m === 'UPI') return 'phone'
  if (m === 'Card') return 'card'
  if (m === 'Insurance') return 'shield'
  return 'receipt'
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('7d')
  const [clinic, setClinic] = useState('All clinics')
  const [doctor, setDoctor] = useState('All doctors')
  const [chartDays, setChartDays] = useState<any[]>([])
  const [topDoctors, setTopDoctors] = useState<any[]>([])
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week')

  useEffect(() => {
    reportsService.tokens(period).then((data: any) => {
      setChartDays((data || []).map((d: any) => ({
        label: dayjs(d._id).format(period === 'week' ? 'ddd' : period === 'month' ? 'DD' : 'MMM'),
        tokens: d.count || 0,
      })))
    }).catch(() => {})
    reportsService.topDoctors().then(setTopDoctors).catch(() => {})
  }, [period])

  const [apptSort, setApptSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'token', dir: 'asc' })
  const [revSort,  setRevSort]  = useState<{ key: keyof RevRow; dir: SortDir }>({ key: 'invoiceId', dir: 'asc' })

  const toggleApptSort = (k: SortKey) => {
    setApptSort(prev => prev.key === k ? { key: k, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'asc' })
  }
  const toggleRevSort = (k: keyof RevRow) => {
    setRevSort(prev => prev.key === k ? { key: k, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'asc' })
  }

  const sortedAppts = [...APPT_ROWS].sort((a, b) => {
    const { key, dir } = apptSort
    const av = a[key] as string | number
    const bv = b[key] as string | number
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return dir === 'asc' ? cmp : -cmp
  })

  const sortedRevs = [...REV_ROWS].sort((a, b) => {
    const { key, dir } = revSort
    const av = a[key] as string | number
    const bv = b[key] as string | number
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return dir === 'asc' ? cmp : -cmp
  })

  const SortChip = ({ label, k }: { label: string; k: SortKey }) => (
    <button
      onClick={() => toggleApptSort(k)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 12.5, fontWeight: 600, color: apptSort.key === k ? 'var(--teal-600)' : 'var(--fg-secondary)',
        padding: 0,
      }}
    >
      {label}
      <Icon name={apptSort.key === k ? (apptSort.dir === 'asc' ? 'arrowUp' : 'arrowDown') : 'chevD'} size={11} />
    </button>
  )

  const RevSortChip = ({ label, k }: { label: string; k: keyof RevRow }) => (
    <button
      onClick={() => toggleRevSort(k)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 12.5, fontWeight: 600, color: revSort.key === k ? 'var(--teal-600)' : 'var(--fg-secondary)',
        padding: 0,
      }}
    >
      {label}
      <Icon name={revSort.key === k ? (revSort.dir === 'asc' ? 'arrowUp' : 'arrowDown') : 'chevD'} size={11} />
    </button>
  )

  const DATE_RANGES: DateRange[] = ['Today', '7d', '30d', 'Custom']

  return (
    <>
      <Header title="Reports" crumbs="Analytics & performance insights" />

      <div className="main">
        {/* Filter bar */}
        <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Date range seg */}
          <div className="seg-ctrl" style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-soft)' }}>
            {DATE_RANGES.map(d => (
              <button
                key={d}
                onClick={() => setDateRange(d)}
                style={{
                  padding: '6px 14px', fontSize: 12.5, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: dateRange === d ? 'var(--brand-gradient)' : 'var(--bg-surface)',
                  color: dateRange === d ? 'white' : 'var(--fg-secondary)',
                }}
              >
                {d}
              </button>
            ))}
          </div>

          <select className="form-select" style={{ fontSize: 13, padding: '6px 12px', minWidth: 160 }} value={clinic} onChange={e => setClinic(e.target.value)}>
            <option>All clinics</option>
            <option>Sunshine Clinic</option>
            <option>Fortis Hospital</option>
            <option>Apollo Clinic</option>
          </select>

          <select className="form-select" style={{ fontSize: 13, padding: '6px 12px', minWidth: 160 }} value={doctor} onChange={e => setDoctor(e.target.value)}>
            <option>All doctors</option>
            {topDoctors.map((d: any, i: number) => <option key={i}>{d.doctorName || 'Doctor'}</option>)}
          </select>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm"><Icon name="refresh" size={13} /> Refresh</button>
            <button className="btn btn-secondary btn-sm"><Icon name="sheet" size={13} /> Export Excel</button>
            <button className="btn btn-secondary btn-sm"><Icon name="download" size={13} /> PDF</button>
            <button className="btn btn-secondary btn-sm"><Icon name="printer" size={13} /> Print</button>
          </div>
        </div>

        {/* 6 KPI cards */}
        <div className="stats-grid" style={{ marginBottom: 20, gridTemplateColumns: 'repeat(6, 1fr)' }}>
          <StatCard ic="calendar" tone="blue"   label="Total appts"       value="1,847" delta="+12%" up />
          <StatCard ic="users"    tone="indigo"  label="Patients seen"     value="1,523" />
          <StatCard ic="check"    tone="mint"    label="Completed"         value="1,340" />
          <StatCard ic="x"        tone="amber"   label="Cancelled"         value="184"   />
          <StatCard ic="receipt"  tone="plum"    label="Revenue"           value="₹4.2L" delta="+8%" up />
          <StatCard ic="alert"    tone="pink"    label="Pending payments"  value="₹38,400" />
        </div>

        {/* Charts row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Line chart */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Appointments trend</div>
              <div style={{ display: 'flex', gap: 14, fontSize: 11.5 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 18, height: 2.5, background: '#1FA3A8', display: 'inline-block', borderRadius: 2 }} />
                  Tokens
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 18, height: 2, background: '#F59E0B', display: 'inline-block', borderRadius: 2, borderTop: '2px dashed #F59E0B' }} />
                  Revenue
                </span>
              </div>
            </div>
            <LineChart chartDays={chartDays} />
          </div>

          {/* Donut chart */}
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Appointment status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <DonutChart />
              <div style={{ flex: 1 }}>
                {DONUT_SLICES.map(sl => (
                  <div key={sl.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: sl.color, flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{sl.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>{sl.count.toLocaleString()}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: sl.color }}>{sl.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Charts row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Revenue bar chart */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Revenue overview</div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                <span style={{ color: '#F59E0B', fontWeight: 700 }}>Peak: </span>
                {chartDays[peakIdx]?.label ?? `Day ${peakIdx + 1}`} · ₹{(maxRev / 1000).toFixed(1)}k
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginBottom: 12 }}>
              <Icon name="trendUp" size={11} style={{ verticalAlign: 'middle', marginRight: 4, color: '#10B981' }} />
              +14% vs last week
            </div>
            <BarChart chartDays={chartDays} />
          </div>

          {/* Doctor performance */}
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Doctor performance</div>
            {topDoctors.map((doc: any, idx: number) => {
              const tones = ['pink', 'indigo', 'amber', 'mint', 'plum', 'blue']
              const tone = tones[idx % tones.length]
              const name: string = doc.doctorName || 'Doctor'
              const initials = name.slice(0, 2).toUpperCase()
              const count: number = doc.count || 0
              const maxCount = topDoctors.reduce((m: number, d: any) => Math.max(m, d.count || 0), 1)
              return (
                <div key={idx} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className={`av ${tone}`} style={{ width: 28, height: 28, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--fg-secondary)', fontWeight: 600 }}>{count} pts</span>
                    </div>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: 'var(--bg-section)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      width: `${(count / maxCount) * 100}%`,
                      background: 'var(--brand-gradient)',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Appointment report table */}
        <div className="table-card" style={{ marginBottom: 20 }}>
          <div className="table-toolbar">
            <div style={{ fontSize: 14, fontWeight: 700 }}>Appointment report</div>
            <button className="btn btn-secondary btn-sm"><Icon name="download" size={13} /> Export</button>
          </div>
          <table className="data">
            <thead>
              <tr>
                <th><SortChip label="Token"   k="token"   /></th>
                <th><SortChip label="Date"    k="date"    /></th>
                <th><SortChip label="Patient" k="patient" /></th>
                <th><SortChip label="Doctor"  k="doctor"  /></th>
                <th><SortChip label="Dept"    k="dept"    /></th>
                <th><SortChip label="Fee"     k="fee"     /></th>
                <th><SortChip label="Status"  k="status"  /></th>
              </tr>
            </thead>
            <tbody>
              {sortedAppts.map(row => (
                <tr key={row.token}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, background: 'var(--bg-section)', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                      {row.token}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>{row.date}</td>
                  <td style={{ fontWeight: 600, fontSize: 13.5 }}>{row.patient}</td>
                  <td style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>{row.doctor}</td>
                  <td>
                    <span style={{ padding: '2px 8px', background: 'var(--bg-section)', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{row.dept}</span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--teal-800)' }}>₹{row.fee}</td>
                  <td><Badge variant={apptStatusVariant(row.status)} dot>{row.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Revenue report table */}
        <div className="table-card">
          <div className="table-toolbar">
            <div style={{ fontSize: 14, fontWeight: 700 }}>Revenue report</div>
            <button className="btn btn-secondary btn-sm"><Icon name="download" size={13} /> Export</button>
          </div>
          <table className="data">
            <thead>
              <tr>
                <th><RevSortChip label="Invoice ID" k="invoiceId" /></th>
                <th><RevSortChip label="Date"       k="date"      /></th>
                <th><RevSortChip label="Patient"    k="patient"   /></th>
                <th><RevSortChip label="Amount"     k="amount"    /></th>
                <th><RevSortChip label="Method"     k="method"    /></th>
                <th><RevSortChip label="Status"     k="status"    /></th>
              </tr>
            </thead>
            <tbody>
              {sortedRevs.map(row => (
                <tr key={row.invoiceId}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--bg-section)', padding: '2px 8px', borderRadius: 6, color: 'var(--fg-secondary)' }}>
                      {row.invoiceId}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>{row.date}</td>
                  <td style={{ fontWeight: 600, fontSize: 13.5 }}>{row.patient}</td>
                  <td style={{ fontWeight: 700, color: 'var(--teal-800)' }}>₹{row.amount.toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--fg-secondary)' }}>
                      <Icon name={methodIcon(row.method)} size={13} />
                      {row.method}
                    </div>
                  </td>
                  <td><Badge variant={revStatusVariant(row.status)} dot>{row.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
