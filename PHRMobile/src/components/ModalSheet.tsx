import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

interface ModalSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function ModalSheet({ isOpen, onClose, children }: ModalSheetProps) {
  const portal = document.getElementById('modal-portal')
  if (!portal) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.45)',
              zIndex: 1, pointerEvents: 'auto',
            }}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: '#FFFFFF',
              borderRadius: '24px 24px 0 0',
              padding: '24px 20px 40px',
              zIndex: 2,
              maxHeight: '90%',
              overflowY: 'auto',
              pointerEvents: 'auto',
            }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portal
  )
}
