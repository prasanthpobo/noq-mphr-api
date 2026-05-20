import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiArrowLeft } from 'react-icons/hi'

interface MobileHeaderProps {
  title: string
  showBack?: boolean
  rightAction?: ReactNode
  transparent?: boolean
}

export default function MobileHeader({
  title,
  showBack = false,
  rightAction,
  transparent = false,
}: MobileHeaderProps) {
  const navigate = useNavigate()

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px',
        paddingLeft: '16px',
        paddingRight: '16px',
        background: transparent ? 'transparent' : '#FFFFFF',
        borderBottom: transparent ? 'none' : '1px solid #EEF2F7',
        boxShadow: transparent ? 'none' : '0 1px 4px rgba(30,79,163,0.04)',
      }}
    >
      {/* Left: back button or spacer */}
      <div style={{ width: '40px', display: 'flex', alignItems: 'center' }}>
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: transparent ? 'rgba(255,255,255,0.15)' : '#F5F8FC',
              cursor: 'pointer',
              color: transparent ? '#FFFFFF' : '#1E4FA3',
            }}
            aria-label="Go back"
          >
            <HiArrowLeft size={20} />
          </button>
        )}
      </div>

      {/* Center: title */}
      <h1
        style={{
          flex: 1,
          textAlign: 'center',
          fontSize: '17px',
          fontWeight: 600,
          color: transparent ? '#FFFFFF' : '#2C6ED5',
          margin: 0,
          letterSpacing: '-0.2px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          paddingLeft: '8px',
          paddingRight: '8px',
        }}
      >
        {title}
      </h1>

      {/* Right: optional action or spacer */}
      <div
        style={{
          width: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        {rightAction ?? null}
      </div>
    </header>
  )
}
