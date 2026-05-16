interface PaginationProps {
  page: number
  total: number
  pageSize: number
  onChange: (page: number) => void
}

export default function Pagination({ page, total, pageSize, onChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '12px 16px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)' }}>
      <button
        className="btn btn-ghost btn-sm"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >← Prev</button>
      {pages.map((p, i) =>
        p === '...'
          ? <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--fg-muted)' }}>…</span>
          : <button
              key={p}
              className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => onChange(p as number)}
              style={{ minWidth: 32 }}
            >{p}</button>
      )}
      <button
        className="btn btn-ghost btn-sm"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
      >Next →</button>
      <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--fg-muted)' }}>
        {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
      </span>
    </div>
  )
}
