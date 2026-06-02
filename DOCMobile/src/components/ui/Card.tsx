import { motion } from 'framer-motion'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  animate?: boolean
}

export function Card({ children, className = '', onClick, animate = true }: CardProps) {
  const base = `bg-white rounded-card shadow-card p-4 ${onClick ? 'cursor-pointer active:scale-[0.98] tap-none' : ''} ${className}`

  if (animate) {
    return (
      <motion.div
        className={base}
        onClick={onClick}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    )
  }

  return <div className={base} onClick={onClick}>{children}</div>
}
