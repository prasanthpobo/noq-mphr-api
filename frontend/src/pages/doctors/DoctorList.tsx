import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import Icon from '@/components/ui/Icon'
import Pagination from '@/components/ui/Pagination'
import { useAppStore } from '@/store/app'
import { doctorsService } from '@/services/doctors.service'
import { toast } from '@/store/toast'

const PAGE_SIZE = 10

export default function DoctorList() {
  const { setRoute, setSelectedId } = useAppStore()
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const load = async (q?: string) => {
    try {
      setLoading(true)
      setError(null)
      const params: Record<string, string> = {}
      if (q) params.search = q
      const data = await doctorsService.list(params)
      setItems(data.data || [])
    } catch {
      setError('Failed to load doctors')
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    setPage(1)
    const timer = setTimeout(() => load(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this doctor?')) return
    try {
      await doctorsService.remove(id)
      load(search)
      toast.success('Deleted successfully')
    } catch {
      setError('Failed to delete doctor')
      toast.error('Failed to delete')
    }
  }

  const filtered  = items
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const total   = items.length
  const active  = items.filter(d => d.status === 'active').length
  const onLeave = items.filter(d => d.status === 'on-leave').length
  const specs   = new Set(items.map(d => d.specialization).filter(Boolean)).size

  return (
    <>
      <Header
        title="Doctor management"
        crumbs={`${active} active · ${total} total · ${onLeave} on leave`}
      />

      <div className="main">
      <div className="stats-grid">
        <StatCard ic="stethoscope" tone="blue"  label="Total doctors"   value={`${total}`}  foot="Registered doctors" />
        <StatCard ic="check"       tone="green" label="Active"          value={`${active}`} foot="Currently on duty" accent />
        <StatCard ic="hourglass"   tone="amber" label="On leave"        value={`${onLeave}`} foot="Unavailable today" />
        <StatCard ic="activity"    tone="pink"  label="Specialties"     value={`${specs}`}  foot="Unique specializations" />
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="table-search">
            <Icon name="search" size={15} />
            <input
              placeholder="Search by name or specialty…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={() => setRoute('doctor-new')}
          >
            <Icon name="plus" size={14} /> Add doctor
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', color: 'var(--danger)', fontSize: 13 }}>{error}</div>
        )}

        <table className="data">
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Specialization</th>
              <th>Qualification</th>
              <th>Experience</th>
              <th>Fee</th>
              <th>Phone</th>
              <th>Shift</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                {[1,2,3,4,5].map(i => (
                  <tr key={i}>
                    {[1,2,3,4,5,6,7,8,9].map(j => (
                      <td key={j}>
                        <div style={{ height: 14, background: 'var(--bg-section)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ) : (
              paginated.map(doc => {
                const displayName = doc.name ? (doc.name.startsWith('Dr.') ? doc.name : `Dr. ${doc.name}`) : 'Doctor'
                const initials    = (doc.name || '').replace(/^Dr\.?\s*/i, '').split(/\s+/).map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() || 'DR'
                const id          = doc._id || doc.id
                return (
                  <tr key={id}>
                    <td>
                      <div className="cell-person">
                        <div className={`av ${doc.tone || 'blue'}`} style={{ borderRadius: '50%', flexShrink: 0 }}>
                          {initials}
                        </div>
                        <div className="info">
                          <div className="n">{displayName}</div>
                          <div className="s">{doc.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{doc.specialization || '—'}</td>
                    <td style={{ fontSize: 13 }}>{doc.qualification || '—'}</td>
                    <td style={{ fontSize: 13 }}>{doc.experience != null ? `${doc.experience} yr` : '—'}</td>
                    <td style={{ fontSize: 13 }}>{doc.consultationFee != null ? `₹${doc.consultationFee}` : '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{doc.phone || '—'}</td>
                    <td style={{ fontSize: 13, textTransform: 'capitalize' }}>{doc.shift || '—'}</td>
                    <td>
                      {doc.status === 'active'   && <Badge variant="success" dot>Active</Badge>}
                      {doc.status === 'inactive' && <Badge variant="gray"    dot>Inactive</Badge>}
                      {doc.status === 'on-leave' && <Badge variant="warning" dot>On leave</Badge>}
                      {!doc.status               && <Badge variant="gray"    dot>—</Badge>}
                    </td>
                    <td>
                      <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                        <button className="act" title="View" onClick={() => { setSelectedId(id); setRoute('doctor-view') }}><Icon name="eye" size={14} /></button>
                        <button className="act" title="Edit" onClick={() => { setSelectedId(id); setRoute('doctor-edit') }}><Icon name="edit" size={14} /></button>
                        <button className="act danger" title="Delete" onClick={() => handleDelete(id)}><Icon name="trash" size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--fg-muted)' }}>No doctors found</td></tr>
            )}
          </tbody>
        </table>
        <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>
      </div>
    </>
  )
}

