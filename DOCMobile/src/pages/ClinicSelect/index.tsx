import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useClinicStore } from '@/stores/clinicStore'
import { clinicService } from '@/services/clinicService'
import { Card } from '@/components/ui/Card'
import type { Clinic } from '@/types'

export function ClinicSelect() {
  const navigate = useNavigate()
  const setClinic = useAuthStore((s) => s.setClinic)
  const { clinics, setClinics, isLoading, setLoading } = useClinicStore()

  useEffect(() => {
    setLoading(true)
    clinicService.list()
      .then((res) => {
        const payload = res.data as unknown as { data: Clinic[] }
        setClinics(Array.isArray(res.data) ? res.data : (payload.data ?? []))
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = (clinic: Clinic) => {
    setClinic(clinic)
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-primary-dark flex flex-col">
      <div className="flex-1 flex items-end justify-center pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center px-6"
        >
          <h1 className="text-white text-2xl font-bold">Select Clinic</h1>
          <p className="text-light-blue text-sm mt-1">Choose where you're consulting today</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-t-3xl px-5 pt-6 pb-12 min-h-[60vh]"
      >
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {clinics.map((clinic) => (
              <Card key={clinic._id} onClick={() => handleSelect(clinic)} animate>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center shrink-0">
                    <span className="text-xl">🏥</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-primary-dark text-sm">{clinic.name}</p>
                    <p className="text-xs text-light-blue truncate mt-0.5">{clinic.address}</p>
                    {clinic.city && <p className="text-xs text-light-blue">{clinic.city}</p>}
                  </div>
                  <ChevronIcon />
                </div>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

function ChevronIcon() {
  return (
    <svg className="w-4 h-4 text-light-blue shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}
