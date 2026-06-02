import { create } from 'zustand'
import type { QueueToken, TokenStatus } from '@/types'

interface QueueState {
  tokens: QueueToken[]
  currentToken: QueueToken | null
  isLoading: boolean
  error: string | null
}

interface QueueActions {
  setTokens: (tokens: QueueToken[]) => void
  setCurrentToken: (token: QueueToken | null) => void
  updateTokenStatus: (tokenId: string, status: TokenStatus) => void
  callNext: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useQueueStore = create<QueueState & QueueActions>((set, get) => ({
  tokens: [],
  currentToken: null,
  isLoading: false,
  error: null,

  setTokens: (tokens) => set({ tokens }),

  setCurrentToken: (token) => set({ currentToken: token }),

  updateTokenStatus: (tokenId, status) =>
    set((state) => ({
      tokens: state.tokens.map((t) =>
        t.id === tokenId ? { ...t, status } : t
      ),
    })),

  callNext: () => {
    const { tokens } = get()
    const next = tokens.find((t) => t.status === 'waiting')
    if (next) set({ currentToken: next })
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))
