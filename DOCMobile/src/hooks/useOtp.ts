import { useCallback, useEffect, useRef, useState } from 'react'

const OTP_RESEND_SECONDS = 30

export function useOtp() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timer, setTimer] = useState(OTP_RESEND_SECONDS)
  const [canResend, setCanResend] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startTimer = useCallback(() => {
    setTimer(OTP_RESEND_SECONDS)
    setCanResend(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!)
          setCanResend(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
  }, [])

  useEffect(() => {
    startTimer()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [startTimer])

  const updateDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    setOtp((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const reset = () => setOtp(['', '', '', '', '', ''])

  const value = otp.join('')
  const isComplete = value.length === 6

  return { otp, updateDigit, reset, value, isComplete, timer, canResend, startTimer }
}
