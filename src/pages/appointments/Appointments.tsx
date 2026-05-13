import { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import { StatusBadge } from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'
import { appointmentsService } from '@/services/appointments.service'
import { toast } from '@/store/toast'

const PAGE_SIZE = 8

const STATUS_FILTERS = ['All', 'Scheduled', 'In progress', 'Completed', 'Cancelled', 'No-show']

const CHIP_TO_API: Record<string, string> = {
  'Scheduled':   'scheduled',
  'In progress': 'in-progress',
  'Completed':   'completed',
  'Cancelled':   'cancelled',
  'No-show':     'no-show',
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i}>
          <div style={{
            height: 14,
            borderRadius: 6,
            background: 'linear-gradient(90deg, var(--bg-section) 25%, var(--border-light) 50%, var(--bg-section) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
            width: i === 0 ? '60%' : i === 6 ? '80%' : '90%',
          }} />
        </td>
      ))}
    </tr>
  )
}

export default function Appointments() {
  const { setRoute } = useAppStore()
  const [activeFilter, setActiveFilter] = useState('All')
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(1)
  const [items, setItems]               = useState<any[]>([])
  const [total, setTotal]               = useState(0)
  const [loading, setLoading]           = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {
        page:  String(page),
        limit: String(PAGE_SIZE),
      }
      if (activeFilter !== 'All') params.status = CHIP_TO_API[activeFilter] ?? activeFilter
      if (search.trim())          params.search = search.trim()

      const res = await appointmentsService.list(params)
      setItems(res.data ?? [])
      setTotal(res.count ?? 0)
    } catch (err) {
      toast.error('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }, [activeFilter, search, page])

  useEffect(() => { load() }, [load])

  const handleFilterChange = (f: string) => { setActiveFilter(f); setPage(1) }
  const handleSearch       = (v: string) => { setSearch(v);        setPage(1) }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <>
      <Header
        title="Appointments & tokens"
        crumbs={`${total} total tokens today`}
        onAdd={() => setRoute('book')}
        addLabel="Book appointment"
      />

      <div className="main">
        <div className="table-card">
          {/* Toolbar */}
          <div className="table-toolbar">
            <div className="table-search">
              <Icon name="search" size={15} />
              <input
                placeholder="Search patient or token…"
                value={search}
                onChange={e => handleSearch(e.target.value)}
              />
            </div>
            <div className="filters">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f}
                  className={`chip ${activeFilter === f ? 'active' : ''}`}
                  onClick={() => handleFilterChange(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <table className="data">
            <thead>
              <tr>
                <th>Token / ID</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Time</th>
                <th>Type</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--fg-muted)' }}>
                      <Icon name="ticket" size={32} />
                      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600 }}>No appointments found</div>
                      <div style={{ marginTop: 4, fontSize: 12 }}>Try adjusting your search or filter</div>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item._id}>
                    <td>
                      <span className="cell-token">{item._id?.slice(-6).toUpperCase()}</span>
                    </td>
                    <td>
                      <div className="cell-person">
                        <div className="av blue">
                          {(item.patientId?.name ?? 'UN').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="info">
                          <div className="n">{item.patientId?.name ?? 'Unknown'}</div>
                          <div className="s">{dayjs(item.date).format('DD MMM YYYY')}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-primary)' }}>
                        {item.doctorId?.name ?? '-'}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-secondary)' }}>
                      {item.time ?? '-'}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>
                      {item.type ?? '-'}
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="act" title="View" onClick={() => setRoute('appt-view')}>
                          <Icon name="eye" size={14} />
                        </button>
                        <button className="act" title="Edit" onClick={() => setRoute('appt-edit')}>
                          <Icon name="edit" size={14} />
                        </button>
                        <button className="act danger" title="Cancel">
                          <Icon name="x" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderTop: '1px solid var(--border-light)',
            fontSize: 12.5,
            color: 'var(--fg-secondary)',
          }}>
            <span>
              Showing {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} appointments
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <Icon name="chevL" size={13} /> Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  style={{
                    width: 30, height: 30, borderRadius: 8, border: '1px solid',
                    borderColor: p === page ? 'transparent' : 'var(--border-soft)',
                    background: p === page ? 'var(--brand-gradient)' : 'var(--bg-surface)',
                    color: p === page ? 'white' : 'var(--fg-secondary)',
                    fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                  }}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next <Icon name="chevR" size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
