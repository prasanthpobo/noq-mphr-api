import { create } from 'zustand'
import type { QueueToken } from '../services/queueService'

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
  activeToken: QueueToken | null
}

interface QueueActions {
  setCurrentToken: (token: Token | null) => void
  setQueueList: (list: Token[]) => void
  setMyTokens: (tokens: Token[]) => void
  setActiveToken: (token: QueueToken | null) => void
}

type QueueStore = QueueState & QueueActions

export const useQueueStore = create<QueueStore>()((set) => ({
  currentToken: null,
  queueList: [],
  myTokens: [],
  activeToken: null,

  setCurrentToken: (currentToken) => set({ currentToken }),
  setQueueList:    (queueList)    => set({ queueList }),
  setMyTokens:     (myTokens)     => set({ myTokens }),
  setActiveToken:  (activeToken)  => set({ activeToken }),
}))
