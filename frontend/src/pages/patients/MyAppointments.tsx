import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import { StatusBadge } from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'
import { appointmentsService } from '@/services/appointments.service'
import { toast } from '@/store/toast'

type Filter = 'upcoming' | 'past' | 'all'

const FILTERS: { key: Filter; label: string; icon: string }[] = [
  { key: 'upcoming', label: 'Upcoming', icon: 'clock'     },
  { key: 'past',     label: 'Past',     icon: 'hourglass' },
  { key: 'all',      label: 'All',      icon: 'sheet'     },
]

export default function MyAppointments() {
  const { setRoute } = useAppStore()
  const [filter,  setFilter]  = useState<Filter>('upcoming')
  const [items,   setItems]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string> = filter === 'all' ? {} : { filter }
    appointmentsService.mine(params)
      .then((res: any) => setItems(res.data ?? []))
      .catch(() => toast.error('Failed to load appointments'))
      .finally(() => setLoading(false))
  }, [filter])

  return (
    <>
      <Header
        title="My appointments"
        crumbs={`${items.length} ${filter === 'all' ? 'total' : filter}`}
      />

      <div className="main">
        <div className="table-card">
          {/* Filter tabs */}
          <div style={{
            display: 'flex', gap: 8, padding: '12px 16px 0',
            borderBottom: '1px solid var(--border-light)',
            flexWrap: 'wrap',
          }}>
            {FILTERS.map(f => {
              const active = filter === f.key
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px',
                    border: 'none', background: 'transparent',
                    color: active ? '#1E4FA3' : 'var(--fg-secondary)',
                    fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                    borderBottom: active ? '2.5px solid #1E4FA3' : '2.5px solid transparent',
                    marginBottom: -1,
                  }}>
                  <Icon name={f.icon} size={14} />
                  {f.label}
                </button>
              )
            })}
            <div style={{ flex: 1 }} />
            <button
              className="btn btn-primary btn-sm"
              style={{ margin: '8px 0' }}
              onClick={() => setRoute('book')}
            >
              <Icon name="plus" size={14} /> Book new
            </button>
          </div>

          <table className="data">
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>Doctor</th>
                <th>Clinic</th>
                <th>Type</th>
                <th>Token</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--fg-muted)' }}>Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                      <Icon name="calendar" size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-secondary)' }}>No appointments</div>
                      <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginTop: 4 }}>
                        {filter === 'upcoming' ? 'Book a slot to get started.' : 'Nothing here yet.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((a: any) => (
                  <tr key={a._id}>
                    <td>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.date ? dayjs(a.date).format('DD MMM YYYY') : '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{a.time || '—'}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.doctorId?.name || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{a.doctorId?.specialization || ''}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{a.clinicId?.name || '—'}</td>
                    <td style={{ fontSize: 13, textTransform: 'capitalize' }}>{a.type || 'consultation'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700 }}>
                      {a.token?.tokenNumber ? String(a.token.tokenNumber).padStart(3, '0') : '—'}
                    </td>
                    <td><StatusBadge status={a.status || 'scheduled'} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
