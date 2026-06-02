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

export function StatusBadge({ status, emergency }: { status: TokenStatus | string; emergency?: boolean }) {
  if (emergency) return <Badge variant="warning" dot>Priority</Badge>
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    'in-room':        { label: 'In room',          variant: 'blue' },
    'in-consultation':{ label: 'In consultation',   variant: 'blue' },
    waiting:          { label: 'Waiting',           variant: 'warning' },
    priority:         { label: 'Priority',          variant: 'warning' },
    'not-visited':    { label: 'Not Visited',       variant: 'gray' },
    'no-show':        { label: 'Not Visited',       variant: 'gray' },
    completed:        { label: 'Completed',         variant: 'success' },
    cancelled:        { label: 'Cancelled',         variant: 'danger' },
    scheduled:        { label: 'Scheduled',         variant: 'blue' },
    'in-progress':    { label: 'In progress',       variant: 'warning' },
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
