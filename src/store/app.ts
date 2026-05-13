import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  route: string
  authed: boolean
  logoutOpen: boolean
  setRoute: (route: string) => void
  setAuthed: (authed: boolean) => void
  setLogoutOpen: (open: boolean) => void
  confirmLogout: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      route: 'dashboard',
      authed: true,
      logoutOpen: false,
      setRoute: (route) => set({ route }),
      setAuthed: (authed) => set({ authed }),
      setLogoutOpen: (logoutOpen) => set({ logoutOpen }),
      confirmLogout: () => set({ logoutOpen: false, authed: false, route: 'dashboard' }),
    }),
    {
      name: 'noq-web-store',
      partialize: (state) => ({ route: state.route, authed: state.authed }),
    }
  )
)
