import type { TokenStatus, AppointmentStatus } from '@/types'

type Status = TokenStatus | AppointmentStatus

const STYLES: Record<string, string> = {
  waiting:     'bg-yellow-50 text-yellow-700 border-yellow-200',
  'in-progress':'bg-blue-50 text-blue-700 border-blue-200',
  done:        'bg-green-50 text-green-700 border-green-200',
  scheduled:   'bg-surface text-primary border-primary/20',
  cancelled:   'bg-red-50 text-red-500 border-red-200',
  skipped:     'bg-gray-50 text-gray-400 border-gray-200',
}

const LABELS: Record<string, string> = {
  'in-progress': 'In Progress',
}

interface StatusBadgeProps {
  status: Status
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STYLES[status] ?? 'bg-gray-50 text-gray-500 border-gray-200'
  const label = LABELS[status] ?? status.charAt(0).toUpperCase() + status.slice(1)

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {label}
    </span>
  )
}
