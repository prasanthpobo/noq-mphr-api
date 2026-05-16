import { create } from 'zustand'

export type TokenStatus = 'waiting' | 'active' | 'done' | 'skipped'

export interface Token {
  id: string
  number: number
  status: TokenStatus
  patientName: string
  doctorName: string
  clinicName: string
  estimatedTime?: string
  position?: number
}

interface QueueState {
  currentToken: Token | null
  queueList: Token[]
  myTokens: Token[]
}

interface QueueActions {
  setCurrentToken: (token: Token | null) => void
  setQueueList: (list: Token[]) => void
  setMyTokens: (tokens: Token[]) => void
}

type QueueStore = QueueState & QueueActions

export const useQueueStore = create<QueueStore>()((set) => ({
  currentToken: null,
  queueList: [],
  myTokens: [],

  setCurrentToken: (currentToken: Token | null) => set({ currentToken }),

  setQueueList: (queueList: Token[]) => set({ queueList }),

  setMyTokens: (myTokens: Token[]) => set({ myTokens }),
}))
