import clsx from 'clsx'
import type { Tone } from '@/types'

interface AvatarProps {
  initials: string
  tone?: Tone
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
  className?: string
}

export default function Avatar({ initials, tone, size = 'md', className }: AvatarProps) {
  return (
    <div className={clsx('av', tone, size !== 'md' && size, className)}>
      {initials}
    </div>
  )
}
