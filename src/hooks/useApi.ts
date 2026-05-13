import { useState, useCallback } from 'react'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  execute: (...args: any[]) => Promise<T | null>
}

export function useApi<T>(fn: (...args: any[]) => Promise<T>): UseApiState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (...args: any[]) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fn(...args)
      setData(result)
      return result
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred')
      return null
    } finally {
      setLoading(false)
    }
  }, [fn])

  return { data, loading, error, execute }
}
