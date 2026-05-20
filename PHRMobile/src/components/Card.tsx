import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

type PaddingSize = 'sm' | 'md' | 'lg'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  padding?: PaddingSize
}

const paddingMap: Record<PaddingSize, string> = {
  sm: '12px',
  md: '16px',
  lg: '20px',
}

export default function Card({
  children,
  className,
  onClick,
  padding = 'md',
}: CardProps) {
  const paddingValue = paddingMap[padding]

  const baseStyle: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(30,79,163,0.08)',
    padding: paddingValue,
    position: 'relative',
    overflow: 'hidden',
  }

  if (onClick) {
    return (
      <motion.div
        className={clsx(className)}
        style={{ ...baseStyle, cursor: 'pointer' }}
        onClick={onClick}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onClick()
        }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className={clsx(className)} style={baseStyle}>
      {children}
    </div>
  )
}
