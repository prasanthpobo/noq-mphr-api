import { useEffect, useRef } from 'react'
import { useQueueStore } from '@/stores/queueStore'
import { useAuthStore } from '@/stores/authStore'
import { queueService } from '@/services/queueService'
import { unwrapList, clinicId } from '@/services/api'
import type { QueueToken } from '@/types'

const POLL_INTERVAL_MS = 10_000

export function useQueue() {
  const clinic = useAuthStore((s) => s.selectedClinic)
  const { setTokens, setLoading, setError } = useQueueStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchQueue = async () => {
    const cid = clinicId(clinic)
    if (!cid) return
    try {
      const res = await queueService.getQueue(cid)
      setTokens(unwrapList<QueueToken>(res.data))
    } catch {
      setError('Failed to load queue')
    }
  }

  useEffect(() => {
    if (!clinic) return
    setLoading(true)
    fetchQueue().finally(() => setLoading(false))

    intervalRef.current = setInterval(fetchQueue, POLL_INTERVAL_MS)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [clinic?.id])

  return useQueueStore()
}
