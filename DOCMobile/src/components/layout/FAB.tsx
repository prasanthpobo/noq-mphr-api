import { motion } from 'framer-motion'

interface FABProps {
  onClick: () => void
  label?: string
  icon?: React.ReactNode
}

export function FAB({ onClick, label = 'Add', icon }: FABProps) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.93 }}
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40
                 flex items-center gap-2 bg-teal text-white
                 px-5 py-3 rounded-full shadow-modal
                 text-sm font-semibold tap-none"
      aria-label={label}
    >
      {icon ?? <PlusIcon />}
      <span>{label}</span>
    </motion.button>
  )
}

function PlusIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  )
}
