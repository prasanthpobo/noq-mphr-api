import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  route: string
  authed: boolean
  logoutOpen: boolean
  selectedId: string | null
  setRoute: (route: string) => void
  setAuthed: (authed: boolean) => void
  setLogoutOpen: (open: boolean) => void
  confirmLogout: () => void
  setSelectedId: (id: string | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      route: 'dashboard',
      authed: false,
      logoutOpen: false,
      selectedId: null,
      setRoute: (route) => set({ route }),
      setAuthed: (authed) => set({ authed }),
      setLogoutOpen: (logoutOpen) => set({ logoutOpen }),
      confirmLogout: () => set({ logoutOpen: false, authed: false, route: 'login' }),
      setSelectedId: (selectedId) => set({ selectedId }),
    }),
    {
      name: 'noq-web-store',
      partialize: (state) => ({ route: state.route, authed: state.authed }),
    }
  )
)

// Listen for 401 auth:logout events dispatched by the axios interceptor
window.addEventListener('auth:logout', () => {
  useAppStore.getState().setAuthed(false)
  useAppStore.getState().setRoute('login')
})
