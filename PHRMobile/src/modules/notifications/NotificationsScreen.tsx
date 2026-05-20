import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiArrowLeft, HiBell, HiCalendar, HiCheck, HiCheckCircle } from 'react-icons/hi'
import { MdNotifications } from 'react-icons/md'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import isToday from 'dayjs/plugin/isToday'
import isYesterday from 'dayjs/plugin/isYesterday'
import {
  getNotifications, markRead, markAllRead,
  type AppNotification,
} from '../../services/notificationService'

dayjs.extend(relativeTime)
dayjs.extend(isToday)
dayjs.extend(isYesterday)

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

const TYPE_CFG: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  appointment_booked:      { icon: '✅', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  appointment_cancelled:   { icon: '❌', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  appointment_completed:   { icon: '🎉', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  appointment_rescheduled: { icon: '📅', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  appointment_reminder:    { icon: '⏰', color: '#2C6ED5', bg: '#EBF2FF', border: '#BFDBFE' },
}

type FilterTab = 'all' | 'unread'

function dateGroupLabel(iso: string): string {
  const d = dayjs(iso)
  if (d.isToday())     return 'Today'
  if (d.isYesterday()) return 'Yesterday'
  return d.format('ddd, D MMM YYYY')
}

function groupByDate(list: AppNotification[]): { label: string; items: AppNotification[] }[] {
  const map = new Map<string, AppNotification[]>()
  for (const n of list) {
    const key = dateGroupLabel(n.createdAt)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(n)
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
}

export default function NotificationsScreen() {
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading,       setLoading]        = useState(true)
  const [markingAll,    setMarkingAll]     = useState(false)
  const [activeTab,     setActiveTab]      = useState<FilterTab>('all')

  const unreadCount  = notifications.filter((n) => !n.read).length
  const totalCount   = notifications.length

  const bookedCount    = notifications.filter((n) => n.type === 'appointment_booked').length
  const cancelledCount = notifications.filter((n) => n.type === 'appointment_cancelled').length
  const otherCount     = notifications.filter((n) =>
    n.type !== 'appointment_booked' && n.type !== 'appointment_cancelled'
  ).length

  const load = useCallback(() => {
    setLoading(true)
    getNotifications()
      .then((r) => setNotifications(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleMarkRead = (n: AppNotification) => {
    if (n.read) return
    setNotifications((prev) => prev.map((x) => x._id === n._id ? { ...x, read: true } : x))
    markRead(n._id).catch(() => {
      setNotifications((prev) => prev.map((x) => x._id === n._id ? { ...x, read: false } : x))
    })
  }

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markingAll) return
    setMarkingAll(true)
    setNotifications((prev) => prev.map((x) => ({ ...x, read: true })))
    try { await markAllRead() }
    catch { load() }
    finally { setMarkingAll(false) }
  }

  const handleTap = (n: AppNotification) => {
    handleMarkRead(n)
    if (n.appointmentId) navigate(`/app/appointments/${n.appointmentId}`)
  }

  const filtered = activeTab === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications

  const groups = groupByDate(filtered)

  return (
    <div style={{ minHeight: '100dvh', background: '#F5F8FC', fontFamily: 'Roboto, system-ui, sans-serif', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* ── White nav bar ─────────────────────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF', padding: '12px 16px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #F0F4F8', flexShrink: 0,
      }}>
        <button onClick={() => navigate(-1)} style={{
          width: 36, height: 36, borderRadius: 10, background: '#F5F8FC',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <HiArrowLeft size={18} color="#1A1A1A" />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>Notifications</span>
        {unreadCount > 0 ? (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            style={{
              height: 36, borderRadius: 20, background: BRAND_GRADIENT, border: 'none',
              cursor: 'pointer', padding: '0 14px', fontSize: 13, fontWeight: 700,
              color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 4,
              boxShadow: '0 4px 12px rgba(44,110,213,0.35)', fontFamily: 'inherit',
              opacity: markingAll ? 0.7 : 1,
            }}
          >
            <HiCheck size={14} /> Mark all read
          </button>
        ) : (
          <div style={{ width: 36 }} />
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 96px' }}>

        {/* ── Merged hero card ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(30,79,163,0.14)', marginBottom: 20 }}
        >
          {/* Gradient hero */}
          <div style={{ background: BRAND_GRADIENT, padding: '20px 20px 22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
            <div style={{ position: 'absolute', bottom: -20, left: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'rgba(255,255,255,0.20)', border: '2px solid rgba(255,255,255,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <MdNotifications size={28} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 3 }}>My Notifications</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', marginBottom: 10 }}>
                  {loading ? 'Loading…' : unreadCount > 0 ? `${unreadCount} unread update${unreadCount !== 1 ? 's' : ''}` : 'All caught up ✓'}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, borderRadius: 20, padding: '3px 10px', background: 'rgba(255,255,255,0.20)', color: '#FFFFFF' }}>
                    {unreadCount} Unread
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, borderRadius: 20, padding: '3px 10px', background: 'rgba(255,255,255,0.20)', color: '#FFFFFF' }}>
                    {totalCount} Total
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* White stats + tab toggle */}
          <div style={{ background: '#FFFFFF', padding: 16 }}>
            {/* Stats row */}
            <div style={{ display: 'flex', marginBottom: 14 }}>
              {[
                { value: bookedCount,    label: 'CONFIRMED',  cfg: { dot: '#059669', bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' } },
                { value: cancelledCount, label: 'CANCELLED',  cfg: { dot: '#DC2626', bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' } },
                { value: otherCount,     label: 'UPDATES',    cfg: { dot: '#7C3AED', bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' } },
              ].map((s, i) => (
                <div key={s.label} style={{
                  flex: 1, textAlign: 'center', padding: '11px 4px',
                  background: s.cfg.bg, borderRadius: 14,
                  border: `1.5px solid ${s.cfg.border}`,
                  margin: i === 1 ? '0 8px' : 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.cfg.dot }} />
                    <span style={{ fontSize: 22, fontWeight: 800, color: s.cfg.text, lineHeight: 1 }}>{s.value}</span>
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: s.cfg.text, letterSpacing: '0.5px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Tab toggle pills */}
            <div style={{ display: 'flex', background: '#F5F8FC', borderRadius: 12, padding: 4, gap: 4 }}>
              {(['all', 'unread'] as FilterTab[]).map((tab) => {
                const isActive = activeTab === tab
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{
                    flex: 1, height: 36, borderRadius: 9,
                    border: 'none', cursor: 'pointer',
                    background: isActive ? BRAND_GRADIENT : 'transparent',
                    color: isActive ? '#FFFFFF' : '#6B7C93',
                    fontSize: 13, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    boxShadow: isActive ? '0 3px 10px rgba(44,110,213,0.30)' : 'none',
                    transition: 'all 0.2s', fontFamily: 'inherit',
                  }}>
                    {tab === 'all' ? 'All' : 'Unread'}
                    {tab === 'unread' && unreadCount > 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 800,
                        background: isActive ? 'rgba(255,255,255,0.25)' : '#EBF2FF',
                        color: isActive ? '#FFFFFF' : '#2C6ED5',
                        borderRadius: 20, padding: '1px 7px',
                      }}>
                        {unreadCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* ── List ──────────────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === 'all' ? -12 : 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {/* Loading skeletons */}
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} style={{ background: '#FFFFFF', borderRadius: 16, height: 90, boxShadow: '0 2px 10px rgba(30,79,163,0.06)', opacity: 0.5 }} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '52px 24px' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#EBF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <HiBell size={32} color="#2C6ED5" />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', margin: '0 0 8px' }}>
                  {activeTab === 'unread' ? 'All caught up!' : 'No notifications yet'}
                </h2>
                <p style={{ fontSize: 13, color: '#6B7C93', margin: 0, lineHeight: 1.5 }}>
                  {activeTab === 'unread'
                    ? 'You have no unread notifications.'
                    : 'Appointment updates and reminders will appear here.'}
                </p>
              </motion.div>
            )}

            {/* Grouped notification list */}
            {!loading && groups.map((group) => (
              <div key={group.label} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10, paddingLeft: 4 }}>
                  {group.label}
                </div>

                {group.items.map((n, idx) => {
                  const cfg = TYPE_CFG[n.type] ?? TYPE_CFG.appointment_booked
                  return (
                    <motion.div
                      key={n._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      style={{ marginBottom: 10 }}
                    >
                      <button
                        onClick={() => handleTap(n)}
                        style={{
                          width: '100%', textAlign: 'left', cursor: 'pointer',
                          background: '#FFFFFF', borderRadius: 16,
                          border: n.read ? '1.5px solid #F0F4F8' : `1.5px solid ${cfg.border}`,
                          boxShadow: n.read ? '0 1px 6px rgba(30,79,163,0.05)' : `0 2px 12px ${cfg.color}18`,
                          padding: 0, overflow: 'hidden', display: 'block',
                          transition: 'box-shadow 0.18s',
                        }}
                      >
                        {!n.read && <div style={{ height: 3, background: cfg.color, opacity: 0.75 }} />}

                        <div style={{ padding: '14px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          {/* Icon bubble */}
                          <div style={{
                            width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                            background: cfg.bg, border: `1.5px solid ${cfg.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 20,
                          }}>
                            {cfg.icon}
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                              <span style={{ fontSize: 14, fontWeight: n.read ? 600 : 800, color: '#1A1A1A', lineHeight: 1.3 }}>
                                {n.title}
                              </span>
                              {!n.read && (
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0, marginTop: 4 }} />
                              )}
                            </div>
                            <p style={{ fontSize: 13, color: '#6B7C93', margin: '0 0 8px', lineHeight: 1.5 }}>{n.body}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 11, color: '#A0AEC0', fontWeight: 500 }}>
                                {dayjs(n.createdAt).fromNow()}
                              </span>
                              {n.appointmentId && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: '2px 8px' }}>
                                  <HiCalendar size={10} /> View Appointment
                                </span>
                              )}
                              {n.read && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#A0AEC0' }}>
                                  <HiCheckCircle size={12} /> Read
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
