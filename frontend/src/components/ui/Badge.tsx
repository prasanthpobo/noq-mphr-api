import type { BadgeVariant, TokenStatus } from '@/types'
import clsx from 'clsx'

interface BadgeProps {
  variant?: BadgeVariant
  dot?: boolean
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function Badge({ variant = 'muted', dot, children, className, style }: BadgeProps) {
  return (
    <span className={clsx('badge', variant, className)} style={style}>
      {dot && <span className="d" />}
      {children}
    </span>
  )
}

export function StatusBadge({ status, emergency }: { status: TokenStatus; emergency?: boolean }) {
  if (emergency) return <Badge variant="warning" dot>Priority</Badge>
  const map: Record<TokenStatus, { label: string; variant: BadgeVariant }> = {
    'in-room':        { label: 'In room',          variant: 'blue' },
    'in-consultation':{ label: 'In consultation',   variant: 'blue' },
    waiting:          { label: 'Waiting',           variant: 'warning' },
    priority:         { label: 'Priority',          variant: 'warning' },
    'not-visited':    { label: 'Not visited',       variant: 'gray' },
    completed:        { label: 'Completed',         variant: 'success' },
    cancelled:        { label: 'Cancelled',         variant: 'danger' },
  }
  const m = map[status] ?? { label: status, variant: 'muted' as BadgeVariant }
  return <Badge variant={m.variant} dot>{m.label}</Badge>
}

export function PatientTagBadge({ tag }: { tag: string }) {
  const map: Record<string, BadgeVariant> = {
    active: 'success', new: 'blue', 'follow-up': 'warning', critical: 'danger',
  }
  return <Badge variant={map[tag] ?? 'muted'}>{tag}</Badge>
}

export function UserStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    active: 'success', inactive: 'gray', 'on-leave': 'warning', pending: 'warning',
  }
  return <Badge variant={map[status] ?? 'muted'} dot>{status}</Badge>
}
