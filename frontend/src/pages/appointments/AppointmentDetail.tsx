import { useState, useEffect, useRef } from 'react'
import dayjs from 'dayjs'
import Icon from '@/components/ui/Icon'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'
import { appointmentsService } from '@/services/appointments.service'
import { masterdataService } from '@/services/masterdata.service'
import { labService } from '@/services/lab.service'
import { tokensService } from '@/services/tokens.service'
import { billingService } from '@/services/billing.service'
import { toast } from '@/store/toast'

interface Props {
  mode: 'view' | 'edit'
}

const TABS: Array<{ label: string; icon: string }> = [
  { label: 'Appointment info',  icon: 'calendar'    },
  { label: 'Consultation info', icon: 'stethoscope' },
  { label: 'Rx info',           icon: 'pill'        },
  { label: 'Medical documents', icon: 'folder'      },
  { label: 'Reports',           icon: 'chart'       },
  { label: 'Follow-up',         icon: 'bell'        },
  { label: 'Billing',           icon: 'receipt'     },
]
const MED_UNITS    = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Cream', 'Inhaler', 'Sachet', 'Patch', 'Ointment']
const STATUS_OPTIONS = ['scheduled','in-progress','completed','cancelled','no-show']

/* ── Document types ──────────────────────────────────────────────────────── */
const DOC_TYPES = [
  'Lab Report', 'Radiology Scan', 'Prescription', 'Discharge Summary',
  'Medical Certificate', 'Insurance Document', 'Referral Letter', 'Other',
]

interface DocItem {
  id:        string
  name:      string
  docType:   string
  fileType:  string
  size:      number
  date:      string
  objectUrl: string
}

function fileTypeLabel(mime: string): string {
  if (mime.includes('pdf'))   return 'PDF'
  if (mime.includes('image')) return mime.split('/')[1].toUpperCase()
  if (mime.includes('word') || mime.includes('document')) return 'DOC'
  if (mime.includes('sheet') || mime.includes('excel'))   return 'XLS'
  return mime.split('/').pop()?.toUpperCase() ?? 'FILE'
}

function fileTypeVariant(mime: string): 'danger' | 'blue' | 'success' | 'muted' {
  if (mime.includes('pdf'))   return 'danger'
  if (mime.includes('image')) return 'blue'
  if (mime.includes('word') || mime.includes('document')) return 'muted'
  return 'success'
}

function fmtSize(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const APPT_STATUS_VARIANT: Record<string, string> = {
  'scheduled':   'info',
  'in-progress': 'warning',
  'completed':   'success',
  'cancelled':   'danger',
  'no-show':     'muted',
}
const APPT_STATUS_LABEL: Record<string, string> = {
  'no-show': 'Not Visited',
}
function ApptStatusBadge({ status }: { status: string }) {
  const variant = (APPT_STATUS_VARIANT[status] ?? 'muted') as any
  const label   = APPT_STATUS_LABEL[status] ?? status
  return <Badge variant={variant}><span className="d" />{label}</Badge>
}

/** Card-section header used across the Appointment Info tab. */
function ApptSectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <span style={{
        width: 32, height: 32, borderRadius: 10,
        background: '#EBF2FF', border: '1px solid #DBE7F8',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon name={icon} size={15} style={{ color: '#1E4FA3' }} />
      </span>
      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg-primary)' }}>{title}</span>
    </div>
  )
}

/** Read-only field display: label above a soft slate "input" tile. */
function ApptReadField({
  label, value, icon, mono = false, valueSize = 13.5,
}: { label: string; value: React.ReactNode; icon?: string; mono?: boolean; valueSize?: number }) {
  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--fg-secondary)', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px',
        background: '#F1F5F9', borderRadius: 10,
        fontSize: valueSize, fontWeight: 600, color: 'var(--fg-primary)',
        fontFamily: mono ? 'var(--font-mono)' : undefined,
        minHeight: 40,
      }}>
        {icon && <Icon name={icon} size={14} style={{ color: 'var(--fg-muted)', flexShrink: 0 }} />}
        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
      </div>
    </div>
  )
}

/** Open a printable invoice in a new window. Users can Print → "Save as PDF" or hit ⌘P / Ctrl-P. */
function downloadInvoice(b: any, appt: any) {
  const fmt = (n: number) => `₹${(n ?? 0).toFixed(2)}`
  const fmtDate = (d?: string | Date) => d ? dayjs(d).format('DD MMM YYYY · hh:mm A') : '—'
  const invoiceNo = b.invoiceNumber || (b._id ? String(b._id).slice(-8).toUpperCase() : '——')
  const escape = (s: any) => String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))

  const itemRows = (b.items ?? []).map((it: any, i: number) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escape(it.description) || '—'}</td>
      <td class="r">${it.quantity ?? 0}</td>
      <td class="r">${fmt(it.rate)}</td>
      <td class="r">${fmt(it.amount)}</td>
    </tr>`).join('')

  const clinic  = appt?.clinicId?.name  || 'NoQ Health Clinic'
  const patient = appt?.patientId?.name || '—'
  const doctor  = appt?.doctorId?.name  || '—'
  const phone   = appt?.patientId?.phone || ''

  const html = `<!doctype html>
<html><head>
<meta charset="utf-8" />
<title>Invoice ${escape(invoiceNo)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;margin:0;padding:32px;background:#fff}
  .hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1E4FA3;padding-bottom:16px;margin-bottom:24px}
  .brand{font-size:22px;font-weight:800;color:#1E4FA3;letter-spacing:-0.02em}
  .brand small{display:block;font-size:11px;font-weight:500;color:#64748b;letter-spacing:0.04em;margin-top:4px}
  .meta{text-align:right;font-size:12.5px;color:#475569;line-height:1.6}
  .meta b{color:#0f172a;font-size:13.5px;letter-spacing:0.04em}
  h2{font-size:11px;letter-spacing:0.10em;text-transform:uppercase;color:#64748b;margin:24px 0 8px;font-weight:700}
  .row{display:flex;gap:48px;font-size:13px;margin-bottom:8px}
  .row div{flex:1}
  .row b{display:block;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;margin-bottom:2px}
  table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}
  th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #e2e8f0}
  th{background:#f1f5f9;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#475569;font-weight:700}
  td.r,th.r{text-align:right}
  .totals{margin-top:16px;margin-left:auto;width:300px;font-size:13px}
  .totals .l{display:flex;justify-content:space-between;padding:6px 0;color:#475569}
  .totals .l.grand{border-top:2px solid #1E4FA3;margin-top:8px;padding-top:10px;font-size:16px;font-weight:800;color:#0f172a}
  .pill{display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em}
  .pill.paid{background:#dcfce7;color:#15803d}
  .pill.partial{background:#fef3c7;color:#92400e}
  .pill.pending{background:#dbeafe;color:#1e40af}
  .pill.cancelled{background:#f1f5f9;color:#64748b}
  .ftr{margin-top:48px;padding-top:14px;border-top:1px solid #e2e8f0;font-size:11.5px;color:#94a3b8;text-align:center}
  @media print{body{padding:18px}@page{margin:14mm}}
</style>
</head><body>
  <div class="hdr">
    <div class="brand">${escape(clinic)}<small>TAX INVOICE</small></div>
    <div class="meta">
      <b>Invoice ${escape(invoiceNo)}</b><br/>
      Issued: ${escape(fmtDate(b.createdAt))}<br/>
      Status: <span class="pill ${escape(b.status || 'pending')}">${escape(b.status || 'pending')}</span>
    </div>
  </div>

  <div class="row">
    <div><b>Billed to</b>${escape(patient)}${phone ? '<br/>' + escape(phone) : ''}</div>
    <div><b>Doctor</b>${escape(doctor)}</div>
    <div><b>Appointment</b>${escape(appt?._id ? String(appt._id).slice(-8).toUpperCase() : '—')}<br/>${escape(appt?.date ? dayjs(appt.date).format('DD MMM YYYY') : '')} ${escape(appt?.time || '')}</div>
  </div>

  <h2>Line items</h2>
  <table>
    <thead><tr><th style="width:40px">#</th><th>Description</th><th class="r" style="width:70px">Qty</th><th class="r" style="width:110px">Rate</th><th class="r" style="width:120px">Amount</th></tr></thead>
    <tbody>${itemRows || `<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:24px">No line items</td></tr>`}</tbody>
  </table>

  <div class="totals">
    <div class="l"><span>Subtotal</span><span>${fmt(b.subtotal)}</span></div>
    <div class="l"><span>Discount</span><span>− ${fmt(b.discount)}</span></div>
    <div class="l"><span>Tax</span><span>${fmt(b.tax)}</span></div>
    <div class="l grand"><span>Total</span><span>${fmt(b.total)}</span></div>
    <div class="l"><span>Paid (${escape(b.paymentMethod || '—')})</span><span>${fmt(b.paidAmount)}</span></div>
    <div class="l"><span>Balance</span><span><b>${fmt((b.total ?? 0) - (b.paidAmount ?? 0))}</b></span></div>
  </div>

  ${b.notes ? `<h2>Notes</h2><div style="font-size:13px;color:#334155;line-height:1.6">${escape(b.notes)}</div>` : ''}

  <div class="ftr">Generated on ${escape(dayjs().format('DD MMM YYYY · hh:mm A'))} — Print or "Save as PDF" from your browser.</div>

  <script>window.onload = () => { setTimeout(() => window.print(), 250) }</script>
</body></html>`

  const w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1100')
  if (!w) { toast.error('Popup blocked — allow popups to download invoices'); return }
  w.document.open()
  w.document.write(html)
  w.document.close()
}

interface RxItem {
  id:       number
  name:     string
  dosage:   string
  quantity: number
  unit:     string
  rate:     number
  amount:   number
}

function emptyRx(): RxItem {
  return { id: Date.now(), name: '', dosage: '', quantity: 0, unit: 'Tablet', rate: 0, amount: 0 }
}

function rxFromApi(p: any, idx: number): RxItem {
  return {
    id:       idx,
    name:     p.medicine ?? '',
    dosage:   p.dosage   ?? '0-0-0-0',
    quantity: p.quantity ?? 0,
    unit:     p.unit     ?? 'Tablet',
    rate:     p.rate     ?? 0,
    amount:   p.amount   ?? 0,
  }
}

function rxToApi(r: RxItem) {
  return {
    medicine: r.name,
    dosage:   r.dosage,
    quantity: r.quantity,
    unit:     r.unit,
    rate:     r.rate,
    amount:   r.amount,
    instructions: '',
  }
}

/* ── Medicine combobox ───────────────────────────────────────────────────── */
interface MedicinePick {
  label:    string
  generic?: string
  brand?:   string
  icd10?:   string
  dosage?:  string
  form?:    string
  strength?:string
}
function MedicineCombobox({ value, onChange, onPickFull }: { value: string; onChange: (v: string) => void; onPickFull?: (m: MedicinePick) => void }) {
  const [query,   setQuery]   = useState(value)
  const [results, setResults] = useState<any[]>([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const debRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const search = async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const res = await masterdataService.list({ category: 'medicine', search: q })
      setResults(res.data ?? [])
      setOpen(true)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleInput = (v: string) => {
    setQuery(v); onChange(v)
    if (debRef.current) clearTimeout(debRef.current)
    debRef.current = setTimeout(() => search(v), 250)
  }

  const select = (item: any) => {
    const m = item.metadata || {}
    setQuery(item.label); onChange(item.label); setOpen(false); setResults([])
    onPickFull?.({
      label:    item.label,
      generic:  m.genericName,
      brand:    m.brandName,
      icd10:    m.icd10,
      dosage:   m.dosage,
      form:     m.form,
      strength: m.strength,
    })
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <input
        className="form-input"
        style={{ width: '100%' }}
        value={query}
        onChange={e => handleInput(e.target.value)}
        onFocus={() => { if (results.length) setOpen(true) }}
        placeholder="Search medicine…"
        autoComplete="off"
      />
      {loading && (
        <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--fg-muted)' }}>…</div>
      )}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg-surface)', border: '1px solid var(--border-soft)',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
          zIndex: 200, maxHeight: 220, overflowY: 'auto',
        }}>
          {results.map((r, i) => {
            const m = r.metadata || {}
            return (
              <button
                key={r._id}
                type="button"
                onMouseDown={() => select(r)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 14px', border: 'none', background: 'transparent',
                  fontSize: 13, cursor: 'pointer', color: 'var(--fg-primary)',
                  borderBottom: i < results.length - 1 ? '1px solid var(--border-light)' : 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-section)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700 }}>{r.label}</span>
                  {m.icd10 && (
                    <span style={{
                      fontSize: 10.5, fontWeight: 800, color: '#1E4FA3',
                      background: '#EBF2FF', border: '1px solid #DBE7F8',
                      padding: '2px 6px', borderRadius: 999, fontFamily: 'var(--font-mono)',
                    }}>{m.icd10}</span>
                  )}
                </div>
                {(m.genericName || m.brandName) && (
                  <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>
                    {m.genericName && <span><b style={{ color: 'var(--fg-secondary)' }}>Generic:</b> {m.genericName}</span>}
                    {m.genericName && m.brandName && ' · '}
                    {m.brandName   && <span><b style={{ color: 'var(--fg-secondary)' }}>Brand:</b> {m.brandName}</span>}
                  </div>
                )}
                {m.dosage && (
                  <div style={{ fontSize: 11.5, color: 'var(--fg-secondary)', marginTop: 2, fontStyle: 'italic' }}>
                    {m.dosage}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
      {open && !loading && query.trim().length > 1 && results.length === 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg-surface)', border: '1px solid var(--border-soft)',
          borderRadius: 10, padding: '10px 14px', fontSize: 12.5, color: 'var(--fg-muted)',
          zIndex: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
        }}>
          No medicines found — type a custom name
        </div>
      )}
    </div>
  )
}

/* ── Lab test types ──────────────────────────────────────────────────────── */
interface LabTestItem {
  name:     string
  code?:    string
  category?: string
  rate:     number
  amount:   number
  priority: 'routine' | 'urgent' | 'stat'
  status:   'pending'
}

function emptyTest(name = '', code = '', category = '', rate = 0): LabTestItem {
  return { name, code, category, rate, amount: rate, priority: 'routine', status: 'pending' }
}

/* ── Test combobox ───────────────────────────────────────────────────────── */
function TestCombobox({ onSelect, selectedNames }: { onSelect: (t: any) => void; selectedNames: string[] }) {
  const [q,        setQ]        = useState('')
  const [allTests, setAllTests] = useState<any[]>([])  // initial full-load snapshot
  const [results,  setResults]  = useState<any[]>([])  // server-side hits when searching
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const debRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // First load: show everything for browse mode (no query).
  useEffect(() => {
    setLoading(true)
    masterdataService.list({ category: 'test' })
      .then(res => setAllTests(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Debounced server search — covers LOINC/category/sample/short-code too.
  useEffect(() => {
    if (!q.trim()) { setResults([]); return }
    if (debRef.current) clearTimeout(debRef.current)
    debRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await masterdataService.list({ category: 'test', search: q.trim() })
        setResults(res.data ?? [])
      } finally { setLoading(false) }
    }, 220)
  }, [q])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const filtered = (q.trim() ? results : allTests).filter(t => !selectedNames.includes(t.label))

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--bg-section)', borderRadius: 10,
        padding: '9px 14px', border: '1.5px solid var(--border-soft)',
      }}>
        <Icon name="search" size={15} style={{ color: 'var(--fg-muted)', flexShrink: 0 }} />
        <input
          style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, flex: 1, color: 'var(--fg-primary)' }}
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={loading ? 'Loading tests…' : 'Search and add test...'}
          autoComplete="off"
        />
      </div>
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg-surface)', border: '1px solid var(--border-soft)',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
          zIndex: 200, maxHeight: 220, overflowY: 'auto',
        }}>
          {filtered.map((t, i) => {
            const m = t.metadata || {}
            return (
              <button
                key={t._id}
                type="button"
                onMouseDown={() => { onSelect(t); setQ(''); setOpen(false) }}
                style={{
                  display: 'block', width: '100%',
                  padding: '10px 14px', border: 'none', background: 'transparent',
                  fontSize: 13, cursor: 'pointer', color: 'var(--fg-primary)', textAlign: 'left',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border-light)' : 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-section)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, flex: 1 }}>{t.label}</span>
                  {m.shortCode && (
                    <span style={{
                      fontSize: 10.5, fontWeight: 800, color: '#1E4FA3',
                      background: '#EBF2FF', border: '1px solid #DBE7F8',
                      padding: '2px 6px', borderRadius: 999, fontFamily: 'var(--font-mono)',
                    }}>{m.shortCode}</span>
                  )}
                  {m.price != null && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#15803D', whiteSpace: 'nowrap' }}>
                      ₹{m.price}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4, fontSize: 11.5, color: 'var(--fg-muted)' }}>
                  {m.category && <span><b style={{ color: 'var(--fg-secondary)' }}>{m.category}</b></span>}
                  {m.sample   && <span>· {m.sample}</span>}
                  {m.tat      && <span>· TAT {m.tat}</span>}
                  {m.fasting  ? <span>· Fasting {m.fasting}h</span> : null}
                  {m.loinc    && <span style={{ fontFamily: 'var(--font-mono)' }}>· LOINC {m.loinc}</span>}
                </div>
              </button>
            )
          })}
        </div>
      )}
      {open && !loading && q.trim().length > 0 && filtered.length === 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg-surface)', border: '1px solid var(--border-soft)',
          borderRadius: 10, padding: '10px 14px', fontSize: 12.5, color: 'var(--fg-muted)',
          zIndex: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
        }}>
          No tests found for "{q}"
        </div>
      )}
    </div>
  )
}

/* ── Follow-up reason options ────────────────────────────────────────────── */
const FOLLOWUP_REASONS = [
  'Review & monitoring',
  'Medication follow-up',
  'Lab results review',
  'Wound dressing / post-op',
  'Physiotherapy',
  'Vaccination / injection',
  'Chronic disease management',
  'Post-discharge review',
  'Mental health check',
  'Other',
]

/* ── FollowUpTab ─────────────────────────────────────────────────────────── */
function FollowUpTab({ appt, selectedId, editMode }: { appt: any; selectedId: string | null; editMode: boolean }) {
  const { setRoute, setSelectedId } = useAppStore()

  // shared list state (both modes)
  const [followUps,     setFollowUps]     = useState<any[]>([])
  const [loadFollowUps, setLoadFollowUps] = useState(false)

  // edit mode — create form toggle + fields
  const [showForm, setShowForm]   = useState(false)
  const [fuDate,    setFuDate]    = useState('')
  const [fuTime,    setFuTime]    = useState('')
  const [fuReason,  setFuReason]  = useState(FOLLOWUP_REASONS[0])
  const [fuNotes,   setFuNotes]   = useState('')
  const [slots,     setSlots]     = useState<{ time: string; available: boolean }[]>([])
  const [loadSlots, setLoadSlots] = useState(false)
  const [creating,  setCreating]  = useState(false)

  const doctorId = appt?.doctorId?._id

  const loadList = () => {
    if (!selectedId) return
    setLoadFollowUps(true)
    appointmentsService.list({ followUpOf: selectedId } as any)
      .then(res => setFollowUps(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoadFollowUps(false))
  }

  useEffect(() => { loadList() }, [selectedId])

  // Load slots when date changes
  useEffect(() => {
    if (!fuDate || !doctorId) { setSlots([]); return }
    setLoadSlots(true)
    setFuTime('')
    appointmentsService.slots(doctorId, fuDate)
      .then(res => setSlots(res.data ?? []))
      .catch(() => toast.error('Failed to load slots'))
      .finally(() => setLoadSlots(false))
  }, [fuDate, doctorId])

  const resetForm = () => {
    setFuDate(''); setFuTime(''); setFuReason(FOLLOWUP_REASONS[0])
    setFuNotes(''); setSlots([])
  }

  const handleCreate = async () => {
    if (!fuDate)   { toast.error('Select a follow-up date'); return }
    if (!fuTime)   { toast.error('Select a time slot'); return }
    if (!fuReason) { toast.error('Select a reason'); return }
    if (!appt)     return

    setCreating(true)
    try {
      const clinicId = appt.clinicId?._id ?? appt.clinicId
      await appointmentsService.create({
        patientId:      appt.patientId?._id,
        doctorId:       appt.doctorId?._id,
        clinicId,
        date:           fuDate,
        time:           fuTime,
        type:           'follow-up',
        status:         'scheduled',
        notes:          fuNotes,
        followUpOf:     selectedId,
        followUpReason: fuReason,
      })
      toast.success('Follow-up appointment created')
      resetForm()
      setShowForm(false)
      loadList()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create follow-up')
    } finally {
      setCreating(false)
    }
  }

  const today = dayjs().format('YYYY-MM-DD')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Create form (edit mode only, toggled) ── */}
      {editMode && showForm && (
        <div className="card" style={{ border: '1.5px solid var(--teal-200, #99f6e4)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 20,
          }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)' }}>New follow-up appointment</span>
            <button
              className="act"
              onClick={() => { setShowForm(false); resetForm() }}
              title="Close"
            >
              <Icon name="x" size={14} />
            </button>
          </div>

          {/* Date + Slots side-by-side */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 20 }}>

            {/* Date picker */}
            <div style={{ minWidth: 200 }}>
              <div className="form-group">
                <label className="form-label">Follow-up date</label>
                <input
                  type="date"
                  className="form-input"
                  min={today}
                  value={fuDate}
                  onChange={e => setFuDate(e.target.value)}
                />
              </div>
            </div>

            {/* Slot picker */}
            <div style={{ flex: 1 }}>
              <label className="form-label">
                Time slot
                {fuDate && <span style={{ marginLeft: 8, fontWeight: 400, color: 'var(--fg-muted)' }}>{dayjs(fuDate).format('dddd, DD MMM YYYY')}</span>}
              </label>
              {!fuDate ? (
                <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', padding: '10px 0' }}>Select a date to see available slots</div>
              ) : loadSlots ? (
                <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', padding: '10px 0' }}>Loading slots…</div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {slots.map(s => (
                      <button
                        key={s.time}
                        type="button"
                        disabled={!s.available}
                        onClick={() => s.available && setFuTime(s.time)}
                        style={{
                          padding: '6px 12px', borderRadius: 8, border: '1.5px solid',
                          fontSize: 12.5, fontWeight: 600, cursor: s.available ? 'pointer' : 'not-allowed',
                          fontFamily: 'var(--font-mono)', transition: 'all 100ms',
                          borderColor: !s.available ? 'var(--border-light)' : fuTime === s.time ? 'transparent' : 'var(--border-soft)',
                          background: !s.available ? 'var(--bg-section)' : fuTime === s.time ? 'var(--brand-gradient)' : 'var(--bg-surface)',
                          color: !s.available ? 'var(--fg-muted)' : fuTime === s.time ? 'white' : 'var(--fg-primary)',
                          textDecoration: !s.available ? 'line-through' : 'none',
                          opacity: !s.available ? 0.45 : 1,
                        }}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 11.5, color: 'var(--fg-muted)' }}>
                    <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--brand-gradient)', marginRight: 4 }} />Selected</span>
                    <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, border: '1.5px solid var(--border-soft)', marginRight: 4 }} />Available</span>
                    <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--bg-section)', marginRight: 4 }} />Booked</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Reason */}
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Follow-up reason</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {FOLLOWUP_REASONS.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFuReason(r)}
                  style={{
                    padding: '6px 13px', borderRadius: 20, border: '1.5px solid',
                    fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 100ms',
                    borderColor: fuReason === r ? 'transparent' : 'var(--border-soft)',
                    background: fuReason === r ? 'var(--brand-gradient)' : 'var(--bg-surface)',
                    color: fuReason === r ? 'white' : 'var(--fg-secondary)',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Notes <span style={{ fontWeight: 400, color: 'var(--fg-muted)' }}>(optional)</span></label>
            <textarea
              className="form-textarea"
              rows={2}
              value={fuNotes}
              onChange={e => setFuNotes(e.target.value)}
              placeholder="Special instructions or context…"
              style={{ width: '100%' }}
            />
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4, borderTop: '1px solid var(--border-light)' }}>
            <div style={{ flex: 1, display: 'flex', gap: 20, fontSize: 13 }}>
              <span style={{ color: fuDate ? 'var(--fg-primary)' : 'var(--fg-muted)', fontWeight: 600 }}>
                {fuDate ? dayjs(fuDate).format('DD MMM YYYY') : 'No date'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', color: fuTime ? 'var(--fg-primary)' : 'var(--fg-muted)', fontWeight: 600 }}>
                {fuTime || 'No slot'}
              </span>
              <span style={{ color: 'var(--fg-secondary)' }}>{fuReason}</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); resetForm() }}>Cancel</button>
            <button
              className="btn btn-primary btn-sm"
              disabled={creating || !fuDate || !fuTime}
              onClick={handleCreate}
            >
              <Icon name="calendar" size={13} />
              {creating ? 'Creating…' : 'Create follow-up'}
            </button>
          </div>
        </div>
      )}

      {/* ── Follow-up list ── */}
      <div className="table-card">
        <div className="table-toolbar">
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)', flex: 1 }}>
            Follow-up appointments
          </span>
          {!loadFollowUps && (
            <span style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>
              {followUps.length} record{followUps.length !== 1 ? 's' : ''}
            </span>
          )}
          {editMode && !showForm && (
            <button
              className="btn btn-primary btn-sm"
              style={{ flexShrink: 0 }}
              onClick={() => setShowForm(true)}
            >
              <Icon name="plus" size={14} /> Add follow-up
            </button>
          )}
        </div>

        <table className="data">
          <thead>
            <tr>
              <th>Date &amp; Time</th>
              <th>Doctor</th>
              <th>Reason</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadFollowUps ? (
              <tr><td colSpan={5}><div style={{ textAlign: 'center', padding: '32px', color: 'var(--fg-muted)', fontSize: 13 }}>Loading…</div></td></tr>
            ) : followUps.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--fg-muted)' }}>
                    <Icon name="calendar" size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-secondary)' }}>No follow-ups yet</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      {editMode ? 'Click "Add follow-up" to schedule one' : 'No follow-up appointments have been scheduled'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : followUps.map(fu => (
              <tr key={fu._id}>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{fu.date ? dayjs(fu.date).format('DD MMM YYYY') : '—'}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{fu.time || '—'}</div>
                </td>
                <td style={{ fontSize: 13.5, color: 'var(--fg-secondary)' }}>{fu.doctorId?.name ?? '—'}</td>
                <td style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>{fu.followUpReason || '—'}</td>
                <td><ApptStatusBadge status={fu.status ?? 'scheduled'} /></td>
                <td>
                  <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setSelectedId(fu._id); setRoute('appt-view') }}
                    >
                      <Icon name="eye" size={13} /> View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}

export default function AppointmentDetail({ mode }: Props) {
  const { setRoute, setSelectedId, selectedId } = useAppStore()
  const { user } = useAuthStore()

  const [tab,       setTab]       = useState(0)
  const [editMode,  setEditMode]  = useState(mode === 'edit')
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [appt,      setAppt]      = useState<any>(null)

  // Editable appointment fields
  const [status,    setStatus]    = useState('scheduled')
  const [apptDate,  setApptDate]  = useState('')
  const [apptTime,  setApptTime]  = useState('')

  // Vitals
  const [vitals, setVitals] = useState({ temp: '', bp: '', weight: '', pulse: '' })

  // Doctor notes
  const [notes,     setNotes]     = useState({ symptoms: '', diagnosis: '', notes: '' })
  // Rx state
  const [rxList,  setRxList]  = useState<RxItem[]>([emptyRx()])
  const [rxNotes, setRxNotes] = useState('')

  // Documents / reports state
  const [docs,        setDocs]        = useState<DocItem[]>([])
  const [uploadType,  setUploadType]  = useState('Lab Report')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Lab tests state
  const [labTests,       setLabTests]       = useState<LabTestItem[]>([])
  const [labNotes,       setLabNotes]       = useState('')
  const [existingLabId,  setExistingLabId]  = useState<string | null>(null)
  const [creatingOrder,  setCreatingOrder]  = useState(false)

  // Token state
  const [token, setToken] = useState<any | null>(null)

  // Billing state
  const [bills,        setBills]        = useState<any[]>([])
  const [loadingBills, setLoadingBills] = useState(false)

  // New-bill wizard state (Step 3 — bill details; patient/doctor/clinic come from this appt)
  const [newBillOpen,    setNewBillOpen]    = useState(false)
  const [editingBillId,  setEditingBillId]  = useState<string | null>(null)
  const [billItems,    setBillItems]    = useState<Array<{ description: string; quantity: number; rate: number; amount: number }>>([
    { description: 'Consultation fee', quantity: 1, rate: 0, amount: 0 },
  ])
  const [billDiscountPct, setBillDiscountPct] = useState(0)
  const [billTaxPct,      setBillTaxPct]      = useState(18)
  const [billNotes,       setBillNotes]       = useState('')
  const [billPayMethod,   setBillPayMethod]   = useState<'cash' | 'card' | 'upi' | 'insurance' | 'online'>('cash')
  const [billPaidAmount,  setBillPaidAmount]  = useState(0)
  const [savingBill,      setSavingBill]      = useState(false)

  // ── Load appointment from API ────────────────────────────────────────────
  useEffect(() => {
    if (!selectedId) { setLoading(false); return }
    setLoading(true)
    appointmentsService.get(selectedId)
      .then(data => {
        setAppt(data)
        setStatus(data.status ?? 'scheduled')
        setApptDate(data.date ? dayjs(data.date).format('YYYY-MM-DD') : '')
        setApptTime(data.time ?? '')
        setVitals({
          temp:   String(data.vitals?.temp   ?? ''),
          bp:     String(data.vitals?.bp     ?? ''),
          weight: String(data.vitals?.weight ?? ''),
          pulse:  String(data.vitals?.pulse  ?? ''),
        })
        setNotes({
          symptoms:  (data.symptoms ?? []).join(', '),
          diagnosis: '',
          notes:     data.notes ?? '',
        })
        const rx = data.prescription ?? []
        setRxList(rx.length > 0 ? rx.map(rxFromApi) : [emptyRx()])
        setRxNotes(data.rxNotes ?? '')
      })
      .catch(() => toast.error('Failed to load appointment'))
      .finally(() => setLoading(false))
  }, [selectedId])

  // ── Load token for this appointment ─────────────────────────────────────
  useEffect(() => {
    if (!selectedId) return
    tokensService.list({ appointmentId: selectedId })
      .then(res => {
        const list = res.data ?? []
        if (list.length > 0) setToken(list[0])
      })
      .catch(() => {})
  }, [selectedId])

  // ── Load billings for this appointment ──────────────────────────────────
  useEffect(() => {
    if (!selectedId) return
    setLoadingBills(true)
    billingService.list({ appointmentId: selectedId })
      .then(res => setBills(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingBills(false))
  }, [selectedId])

  // ── Load existing lab order for this appointment ────────────────────────
  useEffect(() => {
    if (!selectedId) return
    labService.list({ appointmentId: selectedId! })
      .then(res => {
        const orders = res.data ?? []
        if (orders.length > 0) {
          const o = orders[0]
          setExistingLabId(o._id)
          setLabTests((o.tests ?? []).map((t: any) => ({
            name:     t.name,
            code:     t.code,
            category: t.category,
            rate:     t.rate ?? 0,
            amount:   t.amount ?? t.rate ?? 0,
            priority: t.priority ?? 'routine',
            status:   t.status ?? 'pending',
          })))
          setLabNotes(o.notes ?? '')
        }
      })
      .catch(() => {})
  }, [selectedId])

  // ── Save handlers ────────────────────────────────────────────────────────
  const saveAll = async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      await appointmentsService.update(selectedId, {
        status,
        date:     apptDate,
        time:     apptTime,
        symptoms: notes.symptoms ? notes.symptoms.split(',').map(s => s.trim()).filter(Boolean) : [],
        notes:    notes.notes,
      })
      await appointmentsService.updateVitals(selectedId, {
        bp:     vitals.bp     || undefined,
        pulse:  vitals.pulse  ? Number(vitals.pulse)  : undefined,
        temp:   vitals.temp   ? Number(vitals.temp)   : undefined,
        weight: vitals.weight ? Number(vitals.weight) : undefined,
      })
      await appointmentsService.updatePrescription(selectedId, rxList.filter(r => r.name.trim()).map(rxToApi))
      toast.success('Appointment updated')
      setEditMode(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleMarkCompleted = async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      await appointmentsService.update(selectedId, { status: 'completed' })
      setStatus('completed')
      toast.success('Marked as completed')
      setEditMode(false)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelAppt = async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      await appointmentsService.update(selectedId, { status: 'cancelled' })
      setStatus('cancelled')
      toast.success('Appointment cancelled')
      setEditMode(false)
    } catch {
      toast.error('Failed to cancel')
    } finally {
      setSaving(false)
    }
  }

  // ── Rx helpers ───────────────────────────────────────────────────────────
  const addRx = () => setRxList(l => [...l, emptyRx()])

  const updateRx = (id: number, patch: Partial<RxItem>) => {
    setRxList(l => l.map(r => {
      if (r.id !== id) return r
      const updated = { ...r, ...patch }
      updated.amount = updated.quantity * updated.rate
      return updated
    }))
  }

  const deleteRx = (id: number) => {
    setRxList(l => l.length === 1 ? [emptyRx()] : l.filter(r => r.id !== id))
  }

  // ── Document helpers ─────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const newDocs: DocItem[] = files.map(f => ({
      id:        `${Date.now()}-${Math.random()}`,
      name:      f.name,
      docType:   uploadType,
      fileType:  f.type || 'application/octet-stream',
      size:      f.size,
      date:      new Date().toISOString(),
      objectUrl: URL.createObjectURL(f),
    }))
    setDocs(prev => [...prev, ...newDocs])
    toast.success(`${newDocs.length} file${newDocs.length > 1 ? 's' : ''} uploaded`)
    e.target.value = ''
  }

  const handleViewDoc = (doc: DocItem) => {
    window.open(doc.objectUrl, '_blank', 'noopener,noreferrer')
  }

  const handleDeleteDoc = (id: string) => {
    setDocs(prev => {
      const doc = prev.find(d => d.id === id)
      if (doc) URL.revokeObjectURL(doc.objectUrl)
      return prev.filter(d => d.id !== id)
    })
    toast.success('Document removed')
  }

  // ── Lab test helpers ─────────────────────────────────────────────────────
  const addTest = (t: any) => {
    setLabTests(prev => [...prev, emptyTest(t.label, t.value, t.metadata?.category, t.metadata?.price ?? 0)])
  }

  const updateTest = (i: number, patch: Partial<LabTestItem>) => {
    setLabTests(prev => prev.map((t, idx) => idx !== i ? t : { ...t, ...patch, amount: patch.rate ?? t.rate }))
  }

  const removeTest = (i: number) => {
    setLabTests(prev => prev.filter((_, idx) => idx !== i))
  }

  const handleCreateLabOrder = async () => {
    if (labTests.length === 0) { toast.error('Add at least one test'); return }
    if (!appt) return
    setCreatingOrder(true)
    try {
      const payload: Record<string, unknown> = {
        patientId:     appt.patientId?._id,
        doctorId:      appt.doctorId?._id,
        appointmentId: selectedId,
        tests:         labTests,
        notes:         labNotes,
      }
      const clinicId = appt.clinicId?._id ?? user?.clinicId
      if (clinicId) payload.clinicId = clinicId

      if (existingLabId) {
        await labService.update(existingLabId, { tests: labTests, notes: labNotes })
        toast.success('Lab order updated')
      } else {
        const created = await labService.create(payload)
        setExistingLabId(created._id)
        toast.success(`Lab order created — ${created.orderId}`)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save lab order')
    } finally {
      setCreatingOrder(false)
    }
  }

  const labSubtotal = labTests.reduce((s, t) => s + (t.amount ?? 0), 0)

  // ── Derived display values ───────────────────────────────────────────────
  const patientName  = appt?.patientId?.name  ?? '—'
  const patientPhone = appt?.patientId?.phone ?? ''
  const doctorName   = appt?.doctorId?.name   ?? '—'
  const doctorSpec   = appt?.doctorId?.specialization ?? ''
  const clinicName   = appt?.clinicId?.name   ?? '—'
  const apptNo       = selectedId ? selectedId.slice(-6).toUpperCase() : '——'
  const tokenNo      = token?.tokenNumber ? String(token.tokenNumber).padStart(3, '0') : '——'

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--fg-muted)', fontSize: 14 }}>
        Loading appointment…
      </div>
    )
  }

  if (!appt && !loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'var(--fg-muted)' }}>
        <Icon name="ticket" size={40} />
        <div style={{ fontSize: 15, fontWeight: 600 }}>Appointment not found</div>
        <button className="btn btn-secondary btn-sm" onClick={() => setRoute('appointments')}>Back to list</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Top Strip */}
      {(() => {
        const initials = patientName
          ? patientName.trim().split(/\s+/).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
          : '—'
        const divider = (
          <span style={{
            width: 1, alignSelf: 'stretch',
            background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.22) 50%, transparent 100%)',
            margin: '0 4px',
          }} />
        )
        const iconTile = (icon: string) => (
          <span style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.18)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon name={icon} size={18} style={{ color: '#FFFFFF' }} />
          </span>
        )
        const ghostBtn = (extra: React.CSSProperties = {}): React.CSSProperties => ({
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '9px 16px', borderRadius: 10,
          background: 'rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.22)',
          color: '#FFFFFF', fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit',
          cursor: 'pointer', flexShrink: 0,
          ...extra,
        })

        return (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 22px',
            background: 'linear-gradient(90deg, #0F2F66 0%, #1E4FA3 35%, #2C6ED5 65%, #1FA3A8 100%)',
            boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}>
            {/* Back */}
            <button
              onClick={() => setRoute('appointments')}
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 10, width: 40, height: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFFFFF', cursor: 'pointer', flexShrink: 0,
              }}
            >
              <Icon name="chevL" size={16} />
            </button>

            {/* Patient — avatar w/ status dot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <span style={{ position: 'relative', flexShrink: 0 }}>
                <span style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8DA9FF 0%, #5B7EE6 100%)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 900, color: '#FFFFFF',
                  border: '2px solid rgba(255,255,255,0.30)',
                  boxShadow: '0 2px 6px rgba(15,23,42,0.20)',
                }}>
                  {initials}
                </span>
                <span style={{
                  position: 'absolute', right: -2, bottom: -2,
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#22C55E', border: '2px solid #1E4FA3',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="check" size={8} style={{ color: '#FFFFFF' }} />
                </span>
              </span>
              <div style={{ minWidth: 0, lineHeight: 1.2 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {patientName}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', marginTop: 2 }}>
                  {patientPhone || '—'}
                </div>
              </div>
            </div>

            {divider}

            {/* Doctor */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              {iconTile('stethoscope')}
              <div style={{ minWidth: 0, lineHeight: 1.2 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {doctorName}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', marginTop: 2 }}>
                  {doctorSpec || '—'}
                </div>
              </div>
            </div>

            {divider}

            {/* Appointment # */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {iconTile('calendar')}
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                  Appt #
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginTop: 2 }}>
                  {apptNo}
                </div>
              </div>
            </div>

            {divider}

            {/* Token */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {iconTile('ticket')}
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                  Token
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginTop: 2 }}>
                  {tokenNo}
                </div>
              </div>
            </div>

            {divider}

            {/* Status pill (solid white) — moved here so it sits right after Token */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 999,
              background: '#FFFFFF', color: '#1E4FA3',
              fontSize: 13.5, fontWeight: 800, textTransform: 'capitalize',
              flexShrink: 0,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: status === 'cancelled' ? '#DC2626'
                          : status === 'completed' ? '#15803D'
                          : status === 'in-progress' ? '#F59E0B'
                          : status === 'no-show' ? '#64748B' : '#1E4FA3',
              }} />
              {APPT_STATUS_LABEL[status] ?? status}
            </span>

            <div style={{ flex: 1 }} />

            <button onClick={() => window.print()} style={ghostBtn()}>
              <Icon name="printer" size={14} /> Print Rx
            </button>
            <button
              onClick={() => setEditMode(e => !e)}
              style={ghostBtn(editMode ? { background: '#FFFFFF', color: '#1E4FA3', borderColor: '#FFFFFF' } : {})}
            >
              <Icon name="edit" size={14} /> {editMode ? 'Editing' : 'Edit'}
            </button>
          </div>
        )
      })()}

      {/* Tab Strip */}
      <div style={{
        display: 'flex', gap: 0, background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-soft)', flexShrink: 0, padding: '0 24px',
      }}>
        {TABS.map((t, i) => {
          const active = tab === i
          return (
            <button key={t.label} onClick={() => setTab(i)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 18px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13.5, fontWeight: active ? 700 : 500,
              color: active ? '#1E4FA3' : 'var(--fg-secondary)',
              borderBottom: active ? '2px solid #1E4FA3' : '2px solid transparent',
              transition: 'all 140ms', whiteSpace: 'nowrap', fontFamily: 'inherit',
            }}>
              <Icon name={t.icon as any} size={15} style={{ color: active ? '#1E4FA3' : 'var(--fg-muted)' }} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', paddingBottom: 80 }}>

        {/* Tab 1: Appointment Info */}
        {tab === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── Basic Details ─────────────────────────────────────────── */}
            <div className="card" style={{ padding: 20 }}>
              <ApptSectionHeader icon="calendar" title="Basic Details" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                <ApptReadField
                  label="Appointment ID"
                  value={selectedId ?? '—'}
                  mono
                  valueSize={12}
                />
                <ApptReadField label="Patient" value={patientName} />
                <ApptReadField label="Doctor"  value={doctorName} />
                <ApptReadField label="Clinic"  value={clinicName} />

                <ApptReadField label="Type" value={appt?.type ?? '—'} />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--fg-secondary)', marginBottom: 6 }}>Date</div>
                  {editMode ? (
                    <input type="date" className="form-input" value={apptDate} onChange={e => setApptDate(e.target.value)} />
                  ) : (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 12px',
                      background: '#F1F5F9', borderRadius: 10,
                      fontSize: 13.5, fontWeight: 600, color: 'var(--fg-primary)',
                      minHeight: 40,
                    }}>
                      <Icon name="calendar" size={14} style={{ color: 'var(--fg-muted)' }} />
                      {apptDate ? dayjs(apptDate).format('DD MMM YYYY') : '—'}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--fg-secondary)', marginBottom: 6 }}>Time</div>
                  {editMode ? (
                    <input className="form-input" value={apptTime} onChange={e => setApptTime(e.target.value)} placeholder="e.g. 09:30 AM" />
                  ) : (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 12px',
                      background: '#F1F5F9', borderRadius: 10,
                      fontSize: 13.5, fontWeight: 600, color: 'var(--fg-primary)',
                      fontFamily: 'var(--font-mono)',
                      minHeight: 40,
                    }}>
                      <Icon name="clock" size={14} style={{ color: 'var(--fg-muted)' }} />
                      {apptTime || '—'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Status ────────────────────────────────────────────────── */}
            <div className="card" style={{ padding: 20 }}>
              <ApptSectionHeader icon="sliders" title="Status" />
              <div style={{ maxWidth: 320 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--fg-secondary)', marginBottom: 8 }}>
                  Appointment status
                </div>
                {editMode ? (
                  <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <ApptStatusBadge status={status} />
                )}
              </div>
            </div>

            {/* ── Token Information ─────────────────────────────────────── */}
            <div className="card" style={{ padding: 20 }}>
              <ApptSectionHeader icon="ticket" title="Token Information" />
              {token ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                  {/* Token number hero */}
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(135deg, #2C6ED5 0%, #1FA3A8 100%)',
                    borderRadius: 14, padding: '22px 16px', gap: 4,
                    boxShadow: '0 6px 16px rgba(30,79,163,0.20)',
                  }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.10em', color: 'rgba(255,255,255,0.85)',
                    }}>
                      Token No.
                    </div>
                    <div style={{
                      fontSize: 42, fontWeight: 900, color: '#FFFFFF',
                      fontFamily: 'var(--font-mono)', lineHeight: 1,
                    }}>
                      {String(token.tokenNumber).padStart(3, '0')}
                    </div>
                  </div>

                  <ApptReadField
                    label="Status"
                    value={
                      <Badge
                        variant={(token.status === 'completed' ? 'success' : token.status === 'in-consultation' ? 'warning' : token.status === 'cancelled' ? 'muted' : 'info') as any}
                        dot
                      >
                        {token.status}
                      </Badge>
                    }
                  />
                  <ApptReadField
                    label="Priority"
                    value={
                      <Badge
                        variant={(token.priority === 'emergency' ? 'danger' : token.priority === 'priority' ? 'warning' : 'muted') as any}
                        dot
                      >
                        {token.priority}
                      </Badge>
                    }
                  />
                  <ApptReadField
                    label="Issued at"
                    icon="calendar"
                    value={token.issuedAt ? dayjs(token.issuedAt).format('DD MMM YYYY · hh:mm A') : '—'}
                  />

                  <ApptReadField
                    label="Called at"
                    icon="calendar"
                    value={token.calledAt ? dayjs(token.calledAt).format('DD MMM YYYY · hh:mm A') : '—'}
                  />
                  <ApptReadField
                    label="Completed at"
                    icon="calendar"
                    value={token.completedAt ? dayjs(token.completedAt).format('DD MMM YYYY · hh:mm A') : '—'}
                  />
                  <ApptReadField label="Notes" value={token.notes || '—'} />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 24px', color: 'var(--fg-muted)' }}>
                  <Icon name="ticket" size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-secondary)' }}>No token linked</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>A token will appear here once it is issued for this appointment</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Consultation Info */}
        {tab === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <div className="card-h"><h2>Vitals</h2></div>
              <div className="grid-4" style={{ gap: 12 }}>
                {[
                  { key: 'temp'   as const, label: 'Temperature',   unit: '°F',  icon: 'thermometer' },
                  { key: 'bp'     as const, label: 'Blood pressure', unit: 'mmHg',icon: 'activity'    },
                  { key: 'weight' as const, label: 'Weight',         unit: 'kg',  icon: 'pulse'       },
                  { key: 'pulse'  as const, label: 'Pulse',          unit: 'bpm', icon: 'heart'       },
                ].map(v => (
                  <div key={v.key} style={{ background: 'var(--bg-section)', borderRadius: 14, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: 'var(--teal-600)' }}>
                      <Icon name={v.icon} size={16} />
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-secondary)' }}>{v.label}</span>
                    </div>
                    {editMode
                      ? <input className="form-input" value={vitals[v.key]} onChange={e => setVitals(vt => ({ ...vt, [v.key]: e.target.value }))} placeholder={`e.g. ${v.key === 'bp' ? '120/80' : '98'}`} />
                      : (
                        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--fg-primary)', letterSpacing: '-0.03em' }}>
                          {vitals[v.key] || '—'} {vitals[v.key] && <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)' }}>{v.unit}</span>}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-h"><h2>Doctor notes</h2></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { key: 'symptoms'  as const, label: 'Symptoms / chief complaint' },
                  { key: 'diagnosis' as const, label: 'Diagnosis' },
                  { key: 'notes'     as const, label: 'Clinical notes' },
                ].map(f => (
                  <div key={f.key} className="form-group">
                    <label className="form-label">{f.label}</label>
                    {editMode
                      ? <textarea className="form-input form-textarea" value={notes[f.key]} onChange={e => setNotes(n => ({ ...n, [f.key]: e.target.value }))} />
                      : <div style={{ padding: '10px 12px', background: 'var(--bg-section)', borderRadius: 10, fontSize: 13.5, lineHeight: 1.6, minHeight: 52 }}>{notes[f.key] || '—'}</div>}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: Rx Info */}
        {tab === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

              {/* Card header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px', borderBottom: '1px solid var(--border-light)',
              }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)' }}>Medicines</span>
                {editMode && (
                  <button className="btn btn-secondary btn-sm" onClick={addRx}>
                    <Icon name="plus" size={13} /> Add medicine
                  </button>
                )}
              </div>

              {/* Medicines table */}
              <table className="data" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th style={{ width: 140 }}>Dosage</th>
                    <th style={{ width: 80, textAlign: 'center' }}>Qty</th>
                    <th style={{ width: 130 }}>Unit</th>
                    <th style={{ width: 120 }}>Rate (₹)</th>
                    <th style={{ width: 110 }}>Amount (₹)</th>
                    {editMode && <th style={{ width: 44 }} />}
                  </tr>
                </thead>
                <tbody>
                  {rxList.map(rx => (
                    <tr key={rx.id}>
                      <td>
                        {editMode
                          ? <MedicineCombobox
                              value={rx.name}
                              onChange={v => updateRx(rx.id, { name: v })}
                              onPickFull={(m) => {
                                // Auto-populate dosage from master if the row is still blank.
                                if (m.dosage && (!rx.dosage || rx.dosage === '0-0-0-0')) {
                                  // Try to parse "1 tab TDS x 5 days" → dosage label kept as-is in dosage field.
                                  updateRx(rx.id, { dosage: m.dosage })
                                }
                              }}
                            />
                          : <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-primary)' }}>{rx.name || '—'}</div>}
                      </td>
                      <td>
                        {editMode ? (
                          <input
                            className="form-input"
                            style={{ width: '100%', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
                            value={rx.dosage}
                            onChange={e => {
                              const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 4)
                              updateRx(rx.id, { dosage: digits.split('').join('-') })
                            }}
                            onBlur={() => {
                              if (!rx.dosage) return
                              const digits = rx.dosage.replace(/[^0-9]/g, '').padEnd(4, '0').slice(0, 4)
                              updateRx(rx.id, { dosage: digits.split('').join('-') })
                            }}
                            placeholder="0-0-0-0"
                            title="Morning · Afternoon · Evening · Night"
                          />
                        ) : (
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.05em', color: 'var(--fg-primary)' }}>{rx.dosage || '—'}</div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {editMode
                          ? <input className="form-input" type="number" min={0} style={{ width: 60, textAlign: 'center' }} value={rx.quantity === 0 ? '' : rx.quantity} placeholder="0" onChange={e => updateRx(rx.id, { quantity: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)) })} />
                          : <div style={{ fontSize: 13.5, fontWeight: 600, textAlign: 'center' }}>{rx.quantity}</div>}
                      </td>
                      <td>
                        {editMode
                          ? <select className="form-input" style={{ width: '100%', padding: '6px 8px' }} value={rx.unit} onChange={e => updateRx(rx.id, { unit: e.target.value })}>
                              {MED_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          : <div style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>{rx.unit}</div>}
                      </td>
                      <td>
                        {editMode
                          ? <input className="form-input" type="number" min={0} style={{ width: 108 }} value={rx.rate === 0 ? '' : rx.rate} placeholder="0.00" onChange={e => updateRx(rx.id, { rate: e.target.value === '' ? 0 : Number(e.target.value) })} />
                          : <div style={{ fontSize: 13.5, fontWeight: 600 }}>₹{rx.rate.toFixed(2)}</div>}
                      </td>
                      <td style={{
                        fontWeight: 700, fontSize: 14,
                        background: 'var(--brand-gradient)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      }}>
                        ₹{rx.amount.toFixed(2)}
                      </td>
                      {editMode && (
                        <td>
                          <button className="act danger" onClick={() => deleteRx(rx.id)} title="Remove">
                            <Icon name="trash" size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Notes */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-light)' }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.06em', color: 'var(--fg-muted)', marginBottom: 10,
                }}>
                  Notes
                </div>
                {editMode
                  ? <textarea className="form-textarea" rows={3} value={rxNotes} onChange={e => setRxNotes(e.target.value)} placeholder="Special instructions, allergies, remarks…" style={{ width: '100%' }} />
                  : <div style={{ padding: '10px 12px', background: 'var(--bg-section)', borderRadius: 10, fontSize: 13.5, lineHeight: 1.6, minHeight: 48, color: rxNotes ? 'var(--fg-primary)' : 'var(--fg-muted)' }}>{rxNotes || 'No notes'}</div>}
              </div>

            </div>
          </div>
        )}

        {/* Tab 4: Medical Documents — Lab Tests */}
        {tab === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Tests card */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Card header with inline search */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 20px', borderBottom: '1px solid var(--border-light)',
              }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-primary)', flexShrink: 0 }}>Tests</span>
                {editMode && (
                  <TestCombobox
                    onSelect={addTest}
                    selectedNames={labTests.map(t => t.name)}
                  />
                )}
              </div>

              {/* Test list / empty state */}
              {labTests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--fg-muted)' }}>
                  <Icon name="flask" size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-secondary)' }}>No tests added</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Search and add tests above</div>
                </div>
              ) : (
                <div>
                  <table className="data" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Test name</th>
                        <th>Category</th>
                        <th style={{ width: 90 }}>Priority</th>
                        <th style={{ width: 110 }}>Rate (₹)</th>
                        {editMode && <th style={{ width: 44 }} />}
                      </tr>
                    </thead>
                    <tbody>
                      {labTests.map((t, i) => (
                        <tr key={i}>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.name}</div>
                            {t.code && <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 1 }}>{t.code}</div>}
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>
                            {t.category || '—'}
                          </td>
                          <td>
                            {editMode
                              ? <select className="form-input" style={{ padding: '4px 8px', fontSize: 12 }} value={t.priority} onChange={e => updateTest(i, { priority: e.target.value as any })}>
                                  <option value="routine">Routine</option>
                                  <option value="urgent">Urgent</option>
                                  <option value="stat">STAT</option>
                                </select>
                              : <Badge variant={t.priority === 'stat' ? 'danger' : t.priority === 'urgent' ? 'warning' : 'info'} dot>{t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}</Badge>}
                          </td>
                          <td>
                            {editMode
                              ? <input className="form-input" type="number" min={0} style={{ width: 98 }} value={t.rate === 0 ? '' : t.rate} placeholder="0.00" onChange={e => updateTest(i, { rate: e.target.value === '' ? 0 : Number(e.target.value), amount: e.target.value === '' ? 0 : Number(e.target.value) })} />
                              : <div style={{ fontSize: 13.5, fontWeight: 600 }}>₹{t.rate.toFixed(2)}</div>}
                          </td>
                          {editMode && (
                            <td>
                              <button className="act danger" onClick={() => removeTest(i)} title="Remove test">
                                <Icon name="trash" size={13} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Subtotal row */}
                  <div style={{
                    display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                    gap: 24, padding: '10px 20px',
                    borderTop: '1px solid var(--border-light)',
                    background: 'var(--bg-section)',
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>
                      {labTests.length} test{labTests.length !== 1 ? 's' : ''}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)' }}>
                      Subtotal: <span style={{ background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        ₹{labSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </span>
                  </div>
                </div>
              )}

              {/* Notes section */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-primary)', marginBottom: 10 }}>
                  Notes <span style={{ fontWeight: 400, color: 'var(--fg-muted)', fontSize: 12 }}>(optional)</span>
                </div>
                {editMode
                  ? <textarea className="form-textarea" rows={3} value={labNotes} onChange={e => setLabNotes(e.target.value)} placeholder="Special instructions, fasting requirements…" style={{ width: '100%' }} />
                  : <div style={{ padding: '10px 12px', background: 'var(--bg-section)', borderRadius: 10, fontSize: 13.5, lineHeight: 1.6, minHeight: 48, color: labNotes ? 'var(--fg-primary)' : 'var(--fg-muted)' }}>{labNotes || 'No notes'}</div>}
              </div>

              {/* Action footer */}
              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: 10,
                padding: '12px 20px', borderTop: '1px solid var(--border-light)',
                background: 'var(--bg-section)',
              }}>
                {existingLabId && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setSelectedId(existingLabId); setRoute('lab-detail') }}
                  >
                    <Icon name="flask" size={13} /> View Lab Order
                  </button>
                )}
                {editMode && (
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={creatingOrder || labTests.length === 0}
                    onClick={handleCreateLabOrder}
                  >
                    <Icon name="check" size={13} />
                    {creatingOrder ? 'Saving…' : existingLabId ? 'Update Lab Order' : 'Create Lab Order'}
                  </button>
                )}
              </div>
            </div>


          </div>
        )}

        {/* Tab 5: Reports & Documents */}
        {tab === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div className="table-card">

              {/* Toolbar */}
              <div className="table-toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)', flexShrink: 0 }}>
                    Reports & Documents
                  </span>
                  {editMode && (
                    <select
                      className="form-input"
                      style={{ width: 180, padding: '6px 10px', fontSize: 13 }}
                      value={uploadType}
                      onChange={e => setUploadType(e.target.value)}
                    >
                      {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                {editMode && (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flexShrink: 0 }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Icon name="upload" size={14} /> Upload document
                  </button>
                )}
              </div>

              {/* Table */}
              <table className="data">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th style={{ width: 160 }}>Type</th>
                    <th style={{ width: 80 }}>Size</th>
                    <th style={{ width: 180 }}>Date &amp; Time</th>
                    <th style={{ width: 90, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div style={{ textAlign: 'center', padding: '52px 24px', color: 'var(--fg-muted)' }}>
                          <Icon name="upload" size={32} style={{ opacity: 0.35, marginBottom: 12 }} />
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-secondary)' }}>No documents uploaded</div>
                          <div style={{ fontSize: 12, marginTop: 4 }}>Select a document type and click "Upload document"</div>
                        </div>
                      </td>
                    </tr>
                  ) : docs.map(doc => (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'var(--bg-section)',
                            fontSize: 10, fontWeight: 800, color: 'var(--fg-secondary)',
                          }}>
                            {fileTypeLabel(doc.fileType)}
                          </div>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-primary)' }}>{doc.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge variant={fileTypeVariant(doc.fileType) as any} dot>
                          {doc.docType}
                        </Badge>
                      </td>
                      <td style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>
                        {fmtSize(doc.size)}
                      </td>
                      <td style={{ fontSize: 12.5, color: 'var(--fg-secondary)' }}>
                        <div>{dayjs(doc.date).format('DD MMM YYYY')}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 1 }}>
                          {dayjs(doc.date).format('hh:mm A')}
                        </div>
                      </td>
                      <td>
                        <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="act"
                            title="View"
                            onClick={() => handleViewDoc(doc)}
                            style={{ color: 'var(--teal-600)' }}
                          >
                            <Icon name="eye" size={14} />
                          </button>
                          {editMode && (
                            <button
                              className="act danger"
                              title="Delete"
                              onClick={() => handleDeleteDoc(doc.id)}
                            >
                              <Icon name="trash" size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer count */}
              {docs.length > 0 && (
                <div style={{
                  padding: '10px 20px', borderTop: '1px solid var(--border-light)',
                  fontSize: 12.5, color: 'var(--fg-muted)', background: 'var(--bg-section)',
                }}>
                  {docs.length} document{docs.length !== 1 ? 's' : ''}
                </div>
              )}

            </div>
          </div>
        )}

        {/* Tab 6: Follow-up */}
        {tab === 5 && <FollowUpTab appt={appt} selectedId={selectedId} editMode={editMode} />}

        {/* Tab 7: Billing */}
        {tab === 6 && (() => {
          const billSubtotal    = billItems.reduce((s, it) => s + (it.amount ?? 0), 0)
          const billDiscountAmt = (billSubtotal * billDiscountPct) / 100
          const billAfterDisc   = billSubtotal - billDiscountAmt
          const billTaxAmt      = (billAfterDisc * billTaxPct) / 100
          const billTotal       = billAfterDisc + billTaxAmt

          const addBillItem    = () => setBillItems(prev => [...prev, { description: '', quantity: 1, rate: 0, amount: 0 }])
          const removeBillItem = (i: number) => setBillItems(prev => prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i))
          const updateBillItem = (i: number, patch: Partial<{ description: string; quantity: number; rate: number }>) => {
            setBillItems(prev => prev.map((it, idx) => {
              if (idx !== i) return it
              const merged = { ...it, ...patch }
              merged.amount = (merged.quantity ?? 0) * (merged.rate ?? 0)
              return merged
            }))
          }
          const resetNewBill = () => {
            setBillItems([{ description: 'Consultation fee', quantity: 1, rate: 0, amount: 0 }])
            setBillDiscountPct(0); setBillTaxPct(18); setBillNotes('')
            setBillPayMethod('cash'); setBillPaidAmount(0)
            setEditingBillId(null)
          }
          const openEditBill = (b: any) => {
            setEditingBillId(b._id)
            setBillItems((b.items?.length ? b.items : [{ description: '', quantity: 1, rate: 0, amount: 0 }])
              .map((it: any) => ({
                description: it.description ?? '',
                quantity:    it.quantity ?? 1,
                rate:        it.rate ?? 0,
                amount:      it.amount ?? (it.quantity ?? 0) * (it.rate ?? 0),
              })))
            const sub = (b.items ?? []).reduce((s: number, it: any) => s + (it.amount ?? 0), 0)
            setBillDiscountPct(sub > 0 ? Math.round(((b.discount ?? 0) / sub) * 100) : 0)
            const afterDisc = sub - (b.discount ?? 0)
            setBillTaxPct(afterDisc > 0 ? Math.round(((b.tax ?? 0) / afterDisc) * 100) : 0)
            setBillNotes(b.notes ?? '')
            setBillPayMethod((b.paymentMethod ?? 'cash') as any)
            setBillPaidAmount(b.paidAmount ?? 0)
            setNewBillOpen(true)
          }
          const createBill = async () => {
            const valid = billItems.filter(it => it.description.trim())
            if (valid.length === 0) { toast.error('Add at least one bill item'); return }
            if (!appt?.patientId?._id || !appt?.doctorId?._id) { toast.error('Appointment missing patient or doctor'); return }
            const clinicId = appt.clinicId?._id ?? appt.clinicId ?? user?.clinicId
            if (!clinicId) { toast.error('No clinic on session — cannot create bill'); return }
            setSavingBill(true)
            try {
              const status = billPaidAmount >= billTotal && billTotal > 0 ? 'paid'
                            : billPaidAmount > 0 ? 'partial' : 'pending'
              const payload: Record<string, unknown> = {
                patientId:     appt.patientId._id,
                doctorId:      appt.doctorId._id,
                clinicId,
                appointmentId: selectedId,
                items:         valid,
                discount:      billDiscountAmt,
                tax:           billTaxAmt,
                notes:         billNotes,
                status,
                paidAmount:    billPaidAmount,
              }
              if (billPaidAmount > 0) payload.paymentMethod = billPayMethod
              if (editingBillId) {
                await billingService.update(editingBillId, payload)
                toast.success('Bill updated')
              } else {
                await billingService.create(payload)
                toast.success('Bill created')
              }
              resetNewBill()
              setNewBillOpen(false)
              // refresh list
              setLoadingBills(true)
              const res = await billingService.list({ appointmentId: selectedId! })
              setBills(res.data ?? [])
              setLoadingBills(false)
            } catch (err: any) {
              toast.error(err.response?.data?.message || 'Failed to create bill')
            } finally {
              setSavingBill(false)
            }
          }

          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* New Bill trigger — only when no invoice exists yet for this appointment */}
            {editMode && bills.length === 0 && !loadingBills && (
              <div className="card" style={{
                padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12,
                border: '1.5px solid #BFDBFE',
              }}>
                <span style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: '#EBF2FF', border: '1px solid #DBE7F8',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="plus" size={15} style={{ color: '#1E4FA3' }} />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg-primary)' }}>New Bill</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                    Enter bill details (patient &amp; doctor are taken from this appointment)
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => { resetNewBill(); setNewBillOpen(true) }}>
                  <Icon name="plus" size={13} /> Create bill
                </button>
              </div>
            )}

            {/* New / Edit bill modal */}
            {newBillOpen && (
              <Modal
                size="xl"
                onClose={() => { setNewBillOpen(false); resetNewBill() }}
                title={
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span style={{
                      width: 32, height: 32, borderRadius: 10,
                      background: '#EBF2FF', border: '1px solid #DBE7F8',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon name={editingBillId ? 'edit' : 'plus'} size={15} style={{ color: '#1E4FA3' }} />
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25, minWidth: 0 }}>
                      <span style={{ fontSize: 16, fontWeight: 800 }}>
                        {editingBillId ? 'Edit Bill' : 'New Bill'}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontWeight: 500, whiteSpace: 'normal' }}>
                        Enter bill details (patient &amp; doctor are taken from this appointment)
                      </span>
                    </span>
                  </span>
                }
              >
                <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>

                  {/* Items table */}
                  <div style={{ flex: '1 1 460px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ApptSectionHeader icon="card" title="Bill Items" />
                      <div style={{ flex: 1 }} />
                      <button className="btn btn-secondary btn-sm" onClick={addBillItem}>
                        <Icon name="plus" size={13} /> Add item
                      </button>
                    </div>

                    <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: 10 }}>
                      <table className="data" style={{ margin: 0, minWidth: 480 }}>
                        <thead>
                          <tr>
                            <th>Description</th>
                            <th style={{ width: 70, textAlign: 'center' }}>Qty</th>
                            <th style={{ width: 100 }}>Rate (₹)</th>
                            <th style={{ width: 100 }}>Amount (₹)</th>
                            <th style={{ width: 40 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {billItems.map((it, i) => (
                            <tr key={i}>
                              <td>
                                <input
                                  className="form-input"
                                  style={{ width: '100%', minWidth: 140 }}
                                  value={it.description}
                                  onChange={e => updateBillItem(i, { description: e.target.value })}
                                  placeholder="e.g. Consultation Fee"
                                />
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <input
                                  className="form-input"
                                  type="number" min={1}
                                  style={{ width: 60, textAlign: 'center' }}
                                  value={it.quantity}
                                  onChange={e => updateBillItem(i, { quantity: Math.max(1, Number(e.target.value)) })}
                                />
                              </td>
                              <td>
                                <input
                                  className="form-input"
                                  type="number" min={0}
                                  style={{ width: 92 }}
                                  value={it.rate === 0 ? '' : it.rate}
                                  placeholder="0.00"
                                  onChange={e => updateBillItem(i, { rate: e.target.value === '' ? 0 : Number(e.target.value) })}
                                />
                              </td>
                              <td style={{ fontWeight: 700, color: 'var(--teal-800)', whiteSpace: 'nowrap' }}>₹{(it.amount ?? 0).toFixed(2)}</td>
                              <td>
                                <button
                                  className="act danger"
                                  onClick={() => removeBillItem(i)}
                                  disabled={billItems.length === 1}
                                  title="Remove item"
                                >
                                  <Icon name="trash" size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: 6 }}>Notes</div>
                      <textarea
                        className="form-textarea"
                        rows={2}
                        value={billNotes}
                        onChange={e => setBillNotes(e.target.value)}
                        placeholder="Any remarks or special instructions…"
                      />
                    </div>
                  </div>

                  {/* Summary sidebar */}
                  <div style={{
                    flex: '1 1 280px', minWidth: 260, maxWidth: 320,
                    background: '#FFFFFF', border: '1px solid var(--border-soft)',
                    borderRadius: 12, padding: 18,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: '#EBF2FF', border: '1px solid #DBE7F8',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon name="receipt" size={13} style={{ color: '#1E4FA3' }} />
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800 }}>Bill Summary</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13.5 }}>
                      <span style={{ color: 'var(--fg-secondary)' }}>Subtotal</span>
                      <span style={{ fontWeight: 700 }}>₹{billSubtotal.toFixed(2)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                      <span style={{ fontSize: 13.5, color: 'var(--fg-secondary)' }}>Discount (%)</span>
                      <input
                        type="number" className="form-input"
                        style={{ width: 72, padding: '4px 8px', fontSize: 13, textAlign: 'right' }}
                        value={billDiscountPct} min={0} max={100}
                        onChange={e => setBillDiscountPct(Number(e.target.value))}
                      />
                    </div>
                    {billDiscountAmt > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 12.5, color: 'var(--fg-muted)' }}>
                        <span>  Discount amount</span>
                        <span>− ₹{billDiscountAmt.toFixed(2)}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                      <span style={{ fontSize: 13.5, color: 'var(--fg-secondary)' }}>GST (%)</span>
                      <input
                        type="number" className="form-input"
                        style={{ width: 72, padding: '4px 8px', fontSize: 13, textAlign: 'right' }}
                        value={billTaxPct} min={0} max={28}
                        onChange={e => setBillTaxPct(Number(e.target.value))}
                      />
                    </div>
                    {billTaxAmt > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 12.5, color: 'var(--fg-muted)' }}>
                        <span>  Tax amount</span>
                        <span>+ ₹{billTaxAmt.toFixed(2)}</span>
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid var(--border-soft)', margin: '12px 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 15, fontWeight: 800 }}>Total</span>
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#1E4FA3' }}>₹{billTotal.toFixed(2)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                      <span style={{ fontSize: 13.5, color: 'var(--fg-secondary)' }}>Paid amount</span>
                      <input
                        type="number" className="form-input"
                        style={{ width: 100, padding: '4px 8px', fontSize: 13, textAlign: 'right' }}
                        value={billPaidAmount === 0 ? '' : billPaidAmount} min={0}
                        placeholder="0.00"
                        onChange={e => setBillPaidAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                      />
                    </div>

                    {billPaidAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                        <span style={{ fontSize: 13.5, color: 'var(--fg-secondary)' }}>Method</span>
                        <select
                          className="form-select"
                          style={{ width: 130, padding: '4px 8px', fontSize: 13 }}
                          value={billPayMethod}
                          onChange={e => setBillPayMethod(e.target.value as any)}
                        >
                          {(['cash','upi','card','insurance','online'] as const).map(m => (
                            <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                      <button
                        className="btn btn-secondary"
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => { setNewBillOpen(false); resetNewBill() }}
                        disabled={savingBill}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary"
                        style={{ flex: 1, justifyContent: 'center' }}
                        disabled={savingBill || billItems.every(it => !it.description.trim())}
                        onClick={createBill}
                      >
                        <Icon name="check" size={14} />
                        {savingBill
                          ? (editingBillId ? 'Updating…' : 'Creating…')
                          : (editingBillId ? 'Update bill' : 'Create bill')}
                      </button>
                    </div>
                  </div>
                </div>
              </Modal>
            )}

            {/* Summary card */}
            <div className="card" style={{ padding: 20 }}>
              <ApptSectionHeader icon="receipt" title="Billing Summary" />
              {loadingBills ? (
                <div style={{ padding: '24px 0', fontSize: 13, color: 'var(--fg-muted)', textAlign: 'center' }}>Loading invoices…</div>
              ) : bills.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 24px', color: 'var(--fg-muted)' }}>
                  <Icon name="receipt" size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-secondary)' }}>No invoice yet</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Invoices created for this appointment will appear here</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                  {(() => {
                    const total      = bills.reduce((s, b) => s + (b.total      ?? 0), 0)
                    const paid       = bills.reduce((s, b) => s + (b.paidAmount ?? 0), 0)
                    const balance    = total - paid
                    const lastStatus = bills[0]?.status ?? 'pending'
                    return (
                      <>
                        <ApptReadField label="Invoices"     icon="receipt"  value={String(bills.length)} />
                        <ApptReadField label="Total billed" icon="chart"    value={`₹${total.toFixed(2)}`} />
                        <ApptReadField label="Paid"         icon="check"    value={`₹${paid.toFixed(2)}`} />
                        <ApptReadField label="Balance"      icon="hourglass" value={`₹${balance.toFixed(2)}`} />
                        <div style={{ gridColumn: '1 / -1' }}>
                          <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--fg-secondary)', marginBottom: 6 }}>
                            Latest status
                          </div>
                          <Badge
                            variant={(lastStatus === 'paid' ? 'success' : lastStatus === 'partial' ? 'warning' : lastStatus === 'cancelled' ? 'muted' : 'info') as any}
                            dot
                          >
                            {lastStatus}
                          </Badge>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}
            </div>

            {/* Invoice list */}
            {bills.length > 0 && (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
                  <ApptSectionHeader icon="sheet" title="Invoices" />
                </div>
                <table className="data" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                      <th style={{ textAlign: 'right' }}>Discount</th>
                      <th style={{ textAlign: 'right' }}>Tax</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th style={{ textAlign: 'right' }}>Paid</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((b) => (
                      <tr key={b._id}>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 700 }}>
                            <Icon name="receipt" size={13} style={{ color: 'var(--fg-muted)' }} />
                            {b.invoiceNumber || b._id.slice(-8).toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                            <Icon name="calendar" size={13} style={{ color: 'var(--fg-muted)' }} />
                            {b.createdAt ? dayjs(b.createdAt).format('DD MMM YYYY · hh:mm A') : '—'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontSize: 13 }}>₹{(b.subtotal ?? 0).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontSize: 13 }}>₹{(b.discount ?? 0).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontSize: 13 }}>₹{(b.tax ?? 0).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontSize: 13.5, fontWeight: 700 }}>₹{(b.total ?? 0).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontSize: 13 }}>₹{(b.paidAmount ?? 0).toFixed(2)}</td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--fg-secondary)' }}>
                            <Icon name="card" size={13} style={{ color: 'var(--fg-muted)' }} />
                            {b.paymentMethod ?? '—'}
                          </span>
                        </td>
                        <td>
                          <Badge
                            variant={(b.status === 'paid' ? 'success' : b.status === 'partial' ? 'warning' : b.status === 'cancelled' ? 'muted' : 'info') as any}
                            dot
                          >
                            {b.status}
                          </Badge>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              title="Download invoice"
                              onClick={() => downloadInvoice(b, appt)}
                            >
                              <Icon name="download" size={13} /> Download
                            </button>
                            {editMode && (
                              <button
                                className="btn btn-secondary btn-sm"
                                title="Edit bill"
                                onClick={() => openEditBill(b)}
                              >
                                <Icon name="edit" size={13} /> Edit
                              </button>
                            )}
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => { setSelectedId(b._id); setRoute('billing-view') }}
                            >
                              <Icon name="eye" size={13} /> View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Items detail per invoice */}
            {bills.map((b) => (b.items?.length > 0 ? (
              <div key={`items-${b._id}`} className="card" style={{ padding: 20 }}>
                <ApptSectionHeader icon="card" title={`Items · ${b.invoiceNumber || b._id.slice(-8).toUpperCase()}`} />
                <table className="data" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th style={{ textAlign: 'right', width: 80 }}>Qty</th>
                      <th style={{ textAlign: 'right', width: 110 }}>Rate</th>
                      <th style={{ textAlign: 'right', width: 120 }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.items.map((it: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontSize: 13.5 }}>{it.description || '—'}</td>
                        <td style={{ textAlign: 'right', fontSize: 13 }}>{it.quantity ?? 0}</td>
                        <td style={{ textAlign: 'right', fontSize: 13 }}>₹{(it.rate ?? 0).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontSize: 13.5, fontWeight: 700 }}>₹{(it.amount ?? 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null))}
          </div>
          )
        })()}

      </div>

      {/* Sticky action bar — only in edit mode. View mode actions live in the top strip. */}
      {editMode && (
        <div style={{ position: 'sticky', bottom: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-soft)', boxShadow: '0 -4px 12px rgba(0,0,0,0.06)', flexShrink: 0, zIndex: 10 }}>
          <button className="btn btn-secondary" disabled={saving} onClick={() => setEditMode(false)}><Icon name="x" size={14} /> Cancel</button>
          <button className="btn btn-danger" disabled={saving} onClick={handleCancelAppt}><Icon name="x" size={14} /> Cancel appointment</button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-secondary" disabled={saving} style={{ borderColor: 'var(--success-500)', color: 'var(--success-500)' }} onClick={handleMarkCompleted}>
            <Icon name="check" size={14} /> Mark completed
          </button>
          <button className="btn btn-primary" disabled={saving} onClick={saveAll}>
            <Icon name="check" size={14} /> {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      )}
    </div>
  )
}
