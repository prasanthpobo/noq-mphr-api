import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuthStore } from '@/stores/authStore'

interface HeaderProps {
  title?: string
  showSearch?: boolean
  onSearch?: (query: string) => void
}

export function Header({ title, showSearch = true, onSearch }: HeaderProps) {
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  // Propagate debounced search up
  useState(() => { onSearch?.(debounced) })

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-3 md:px-6">
      <div className="flex items-center gap-3">
        {/* Title — desktop shows page name, mobile shows app name */}
        <h1 className="font-semibold text-primary-dark text-base flex-1 truncate">
          {title ?? 'NoQ · Doctor'}
        </h1>

        {/* Search bar */}
        {showSearch && (
          <div className="relative hidden md:block">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patients…"
              className="w-56 pl-9 pr-4 py-2 text-sm bg-surface rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-blue" />
          </div>
        )}

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-surface transition-colors tap-none">
          <BellIcon className="w-5 h-5 text-primary-dark" />
        </button>

        {/* Avatar */}
        <button
          onClick={() => navigate('/profile')}
          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold tap-none"
        >
          {user?.name?.[0] ?? 'D'}
        </button>
      </div>

      {/* Mobile search row */}
      {showSearch && (
        <div className="relative mt-2 md:hidden">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-surface rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-blue" />
        </div>
      )}
    </header>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
    </svg>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17H9m6 0a3 3 0 01-6 0m6 0H5.5A1.5 1.5 0 014 15.5c0-.47.22-.9.6-1.18A7 7 0 0112 5a7 7 0 017.4 9.32c.38.28.6.71.6 1.18A1.5 1.5 0 0118.5 17H15z" />
    </svg>
  )
}
