import { formatToken } from '@/utils/formatters'

interface TokenBadgeProps {
  number: number
  size?: 'sm' | 'md' | 'lg'
}

const SIZE = {
  sm: 'w-10 h-10 text-base',
  md: 'w-16 h-16 text-2xl',
  lg: 'w-28 h-28 text-5xl',
}

export function TokenBadge({ number, size = 'md' }: TokenBadgeProps) {
  return (
    <div className={`${SIZE[size]} rounded-2xl bg-primary flex items-center justify-center font-bold text-white shadow-card`}>
      {formatToken(number)}
    </div>
  )
}
