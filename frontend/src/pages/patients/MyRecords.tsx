import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import { useAuthStore } from '@/store/auth'
import { appointmentsService } from '@/services/appointments.service'

const PHR_APP_URL = 'https://testapp.zerotoken.in/'

/**
 * Patient-facing medical-records summary.
 * The deep record set (vitals, family members, consent, full prescriptions) lives
 * on PHRMobile — this is a lightweight view inside the admin SPA.
 */
export default function MyRecords() {
  const user = useAuthStore((s) => s.user)
  const [past,    setPast]    = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    appointmentsService.mine({ filter: 'past' })
      .then((res: any) => setPast(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const withRx = past.filter((a) => Array.isArray(a.prescription) && a.prescription.length > 0)

  return (
    <>
      <Header title="My medical records" crumbs="Visit history, prescriptions, vitals" />

      <div className="main">
        {/* Profile snapshot */}
        <div className="card" style={{ padding: 18, marginBottom: 18, display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2C6ED5 0%, #1FA3A8 100%)',
            color: '#FFFFFF', fontWeight: 900, fontSize: 18,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {(user?.name || 'U').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{user?.name || 'Patient'}</div>
            <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginTop: 2 }}>
              {user?.email || '—'} {user?.phone && <>· <span style={{ fontFamily: 'var(--font-mono)' }}>{user.phone}</span></>}
            </div>
          </div>
          <a
            href={PHR_APP_URL}
            target="_blank" rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ textDecoration: 'none' }}
          >
            <Icon name="link" size={13} /> Manage in mobile app
          </a>
        </div>

        {/* Visit history */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 18px', borderBottom: '1px solid var(--border-light)',
          }}>
            <span style={{
              width: 32, height: 32, borderRadius: 10,
              background: '#EBF2FF', border: '1px solid #DBE7F8',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="folder" size={15} style={{ color: '#1E4FA3' }} />
            </span>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg-primary)', flex: 1 }}>
              Visit history
            </span>
            <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
              {loading ? 'Loading…' : `${past.length} visit${past.length === 1 ? '' : 's'}`}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: 24, fontSize: 13, color: 'var(--fg-muted)', textAlign: 'center' }}>Loading…</div>
          ) : past.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <Icon name="folder" size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-secondary)' }}>No visits yet</div>
              <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginTop: 4 }}>
                Past consultations and prescriptions will appear here.
              </div>
            </div>
          ) : (
            <table className="data" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Doctor</th>
                  <th>Diagnosis / Symptoms</th>
                  <th>Prescription</th>
                </tr>
              </thead>
              <tbody>
                {past.map((a: any) => (
                  <tr key={a._id}>
                    <td>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.date ? dayjs(a.date).format('DD MMM YYYY') : '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{a.time || ''}</div>
                    </td>
                    <td style={{ fontSize: 13.5 }}>{a.doctorId?.name || '—'}</td>
                    <td style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>
                      {Array.isArray(a.symptoms) && a.symptoms.length ? a.symptoms.join(', ') : (a.notes || '—')}
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {Array.isArray(a.prescription) && a.prescription.length > 0
                        ? <span style={{ color: '#15803D', fontWeight: 600 }}>{a.prescription.length} item{a.prescription.length === 1 ? '' : 's'}</span>
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Prescriptions count */}
        {!loading && withRx.length > 0 && (
          <div style={{
            marginTop: 14, padding: '12px 16px', borderRadius: 12,
            background: '#EFF6FF', border: '1px solid #BFDBFE',
            fontSize: 13, color: '#1E4FA3',
          }}>
            <Icon name="info" size={13} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            You have <b>{withRx.length}</b> visit{withRx.length === 1 ? '' : 's'} with a prescription. Open the mobile app to download or share the Rx.
          </div>
        )}
      </div>
    </>
  )
}
