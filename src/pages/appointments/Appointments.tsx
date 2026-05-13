import { useState } from 'react'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import { StatusBadge } from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'
import { TOKENS, TOKEN_FILTERS } from '@/data'
import type { Token } from '@/types'

const PAGE_SIZE = 8

function filterStatus(t: Token, chip: string): boolean {
  if (chip === 'All') return true
  if (chip === 'Waiting') return t.status === 'waiting'
  if (chip === 'In room') return t.status === 'in-room'
  if (chip === 'Completed') return t.status === 'completed'
  if (chip === 'Cancelled') return t.status === 'cancelled'
  if (chip === 'Emergency') return t.emergency
  return true
}

function chipCount(tokens: Token[], chip: string): number {
  return tokens.filter(t => filterStatus(t, chip)).length
}

export default function Appointments() {
  const { setRoute } = useAppStore()
  const [activeFilter, setActiveFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = TOKENS.filter(t => {
    const matchFilter = filterStatus(t, activeFilter)
    const q = search.toLowerCase()
    const matchSearch = !q || t.patient.toLowerCase().includes(q) || t.token.toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleFilterChange = (f: string) => {
    setActiveFilter(f)
    setPage(1)
  }

  const handleSearch = (v: string) => {
    setSearch(v)
    setPage(1)
  }

  return (
    <>
      <Header
        title="Appointments & tokens"
        crumbs={`${TOKENS.length} total tokens today`}
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
              {TOKEN_FILTERS.map(f => (
                <button
                  key={f}
                  className={`chip ${activeFilter === f ? 'active' : ''}`}
                  onClick={() => handleFilterChange(f)}
                >
                  {f}
                  <span className="count">{chipCount(TOKENS, f)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <table className="data">
            <thead>
              <tr>
                <th>Token</th>
                <th>Patient</th>
                <th>Doctor / Dept</th>
                <th>Time</th>
                <th>Status</th>
                <th>Wait</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--fg-muted)' }}>
                      <Icon name="ticket" size={32} />
                      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600 }}>No tokens found</div>
                      <div style={{ marginTop: 4, fontSize: 12 }}>Try adjusting your search or filter</div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map(t => (
                  <tr key={t.token}>
                    <td>
                      <span className={`cell-token ${t.emergency ? 'emergency' : ''}`}>{t.token}</span>
                    </td>
                    <td>
                      <div className="cell-person">
                        <div className={`av ${t.tone}`}>{t.av}</div>
                        <div className="info">
                          <div className="n">{t.patient}</div>
                          <div className="s">{t.age}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-primary)' }}>{t.doctor}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--fg-secondary)', marginTop: 2 }}>{t.dept}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-secondary)' }}>
                      {t.time}
                    </td>
                    <td>
                      <StatusBadge status={t.status} emergency={t.emergency} />
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--fg-secondary)', fontWeight: 500 }}>
                      {t.wait}
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
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} tokens
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
