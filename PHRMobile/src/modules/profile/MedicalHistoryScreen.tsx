import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiArrowLeft, HiPlus, HiPencil, HiTrash, HiX, HiCheck, HiHeart, HiExclamation } from 'react-icons/hi'
import { MdMedicalServices, MdLocalPharmacy } from 'react-icons/md'
import { useAuthStore } from '../../store/authStore'
import {
  getMedicalHistory,
  addCondition, updateCondition, deleteCondition,
  addAllergy, updateAllergy, deleteAllergy,
  addMedication, updateMedication, deleteMedication,
  type Condition, type Allergy, type Medication,
} from '../../services/medicalHistoryService'

const GREEN_GRADIENT = 'linear-gradient(135deg, #065F46 0%, #059669 50%, #10B981 100%)'
const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

// ── Types ─────────────────────────────────────────────────────────────────────
type SheetMode = 'add' | 'edit'
type SheetType = 'condition' | 'allergy' | 'medication' | null

interface SheetState {
  type: SheetType
  mode: SheetMode
  item?: Condition | Allergy | Medication
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function MedicalHistoryScreen() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [conditions, setConditions]   = useState<Condition[]>([])
  const [allergies,  setAllergies]    = useState<Allergy[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading]         = useState(true)
  const [sheet, setSheet]             = useState<SheetState>({ type: null, mode: 'add' })
  const [toast, setToast]             = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: SheetType; id: string } | null>(null)

  const bloodGroup = user?.bloodGroup ?? '—'
  const height     = user?.height
  const weight     = user?.weight
  const bmi        = height && weight ? (weight / ((height / 100) ** 2)).toFixed(1) : null
  const bmiLabel   = bmi
    ? parseFloat(bmi) < 18.5 ? 'Underweight'
      : parseFloat(bmi) < 25 ? 'Normal'
        : parseFloat(bmi) < 30 ? 'Overweight' : 'Obese'
    : null
  const bmiColor = bmi
    ? parseFloat(bmi) < 18.5 ? '#2C6ED5'
      : parseFloat(bmi) < 25 ? '#059669'
        : parseFloat(bmi) < 30 ? '#D97706' : '#E05B5B'
    : '#A0AEC0'

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const load = useCallback(async () => {
    try {
      const res = await getMedicalHistory()
      if (res.success) {
        setConditions(res.data.conditions)
        setAllergies(res.data.allergies)
        setMedications(res.data.medications)
      }
    } catch { /* silently fail */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const closeSheet = () => setSheet({ type: null, mode: 'add' })

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      if (deleteTarget.type === 'condition') {
        const r = await deleteCondition(deleteTarget.id)
        if (r.success) setConditions(r.data)
      } else if (deleteTarget.type === 'allergy') {
        const r = await deleteAllergy(deleteTarget.id)
        if (r.success) setAllergies(r.data)
      } else if (deleteTarget.type === 'medication') {
        const r = await deleteMedication(deleteTarget.id)
        if (r.success) setMedications(r.data)
      }
      showToast('Deleted successfully')
    } catch { showToast('Delete failed') } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F5F8FC', fontFamily: 'Roboto, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Nav */}
      <div style={{ background: '#FFFFFF', padding: '12px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F0F4F8', flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F8FC', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HiArrowLeft size={18} color="#1A1A1A" />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>Medical History</span>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 96px' }}>

        {/* Hero Card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(5,150,105,0.18)', marginBottom: 20 }}>
          <div style={{ background: GREEN_GRADIENT, padding: '20px 20px 22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
            <div style={{ position: 'absolute', bottom: -20, left: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.20)', border: '2px solid rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MdMedicalServices size={28} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 3 }}>{user?.name ? `${user.name}'s Health` : 'My Health'}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', marginBottom: 10 }}>Personal medical records</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { count: conditions.length, label: 'Conditions' },
                    { count: allergies.length,  label: 'Allergies' },
                    { count: medications.length, label: 'Meds' },
                  ].map((s) => (
                    <span key={s.label} style={{ fontSize: 12, fontWeight: 600, borderRadius: 20, padding: '3px 10px', background: 'rgba(255,255,255,0.20)', color: '#FFFFFF' }}>
                      {s.count} {s.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{ background: '#FFFFFF', padding: '16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>Vital Measurements</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: bmi ? 12 : 0 }}>
              {[
                { label: 'Height', value: height ? `${height}` : '—', unit: height ? 'cm' : '', color: '#2C6ED5', bg: '#EBF2FF' },
                { label: 'Weight', value: weight ? `${weight}` : '—', unit: weight ? 'kg' : '', color: '#7C3AED', bg: '#F3EEFF' },
                { label: 'Blood Group', value: bloodGroup, unit: '', color: '#E05B5B', bg: '#FFF0F0' },
              ].map((m) => (
                <div key={m.label} style={{ flex: 1, background: m.bg, borderRadius: 14, padding: '12px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: m.color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{m.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.value}</div>
                  {m.unit && <div style={{ fontSize: 11, color: m.color, opacity: 0.7, marginTop: 3 }}>{m.unit}</div>}
                </div>
              ))}
            </div>
            {bmi ? (
              <div style={{ background: '#F5F8FC', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1.5px solid ${bmiColor}22` }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>BMI Index</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#4A5568' }}>Body Mass Index</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: bmiColor, lineHeight: 1 }}>{bmi}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: bmiColor, marginTop: 2 }}>{bmiLabel}</div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#F5F8FC', borderRadius: 14, padding: '11px 14px', textAlign: 'center' }}>
                <span style={{ fontSize: 12, color: '#A0AEC0' }}>Add height & weight in profile to calculate BMI</span>
              </div>
            )}
          </div>
        </motion.div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#A0AEC0', fontSize: 14 }}>Loading...</div>
        ) : (
          <>
            {/* Conditions */}
            <SectionCard index={1} label="Conditions" iconBg="#FFF0F0" iconColor="#E05B5B" icon={<HiHeart size={16} />} count={conditions.length}
              onAdd={() => setSheet({ type: 'condition', mode: 'add' })}>
              {conditions.length === 0 ? (
                <EmptyState text="No conditions recorded" sub="Tap + to add a chronic condition or diagnosis" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {conditions.map((c, i) => (
                    <div key={c._id}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E05B5B', flexShrink: 0 }} />
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>{c.name}</span>
                          {c.diagnosedAt && <span style={{ fontSize: 11, color: '#A0AEC0' }}>since {new Date(c.diagnosedAt).getFullYear()}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <ActionBtn color="#2C6ED5" bg="#EBF2FF" icon={<HiPencil size={13} />} onClick={() => setSheet({ type: 'condition', mode: 'edit', item: c })} />
                          <ActionBtn color="#E05B5B" bg="#FFF0F0" icon={<HiTrash size={13} />} onClick={() => setDeleteTarget({ type: 'condition', id: c._id })} />
                        </div>
                      </div>
                      {c.notes && <div style={{ fontSize: 12, color: '#6B7C93', paddingLeft: 18, marginTop: -6, marginBottom: 4 }}>{c.notes}</div>}
                      {i < conditions.length - 1 && <div style={{ height: 1, background: '#F5F8FC' }} />}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Allergies */}
            <SectionCard index={2} label="Allergies" iconBg="#FFFBEB" iconColor="#D97706" icon={<HiExclamation size={16} />} count={allergies.length}
              onAdd={() => setSheet({ type: 'allergy', mode: 'add' })}>
              {allergies.length === 0 ? (
                <EmptyState text="No allergies recorded" sub="Tap + to add a known allergy or sensitivity" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {allergies.map((a, i) => (
                    <div key={a._id}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D97706', flexShrink: 0 }} />
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>{a.name}</span>
                          {a.severity && (
                            <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '2px 8px',
                              background: a.severity === 'severe' ? '#FFF0F0' : a.severity === 'moderate' ? '#FFFBEB' : '#F0FFF4',
                              color: a.severity === 'severe' ? '#E05B5B' : a.severity === 'moderate' ? '#D97706' : '#059669',
                            }}>
                              {a.severity}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <ActionBtn color="#2C6ED5" bg="#EBF2FF" icon={<HiPencil size={13} />} onClick={() => setSheet({ type: 'allergy', mode: 'edit', item: a })} />
                          <ActionBtn color="#E05B5B" bg="#FFF0F0" icon={<HiTrash size={13} />} onClick={() => setDeleteTarget({ type: 'allergy', id: a._id })} />
                        </div>
                      </div>
                      {a.reaction && <div style={{ fontSize: 12, color: '#6B7C93', paddingLeft: 18, marginTop: -6, marginBottom: 4 }}>Reaction: {a.reaction}</div>}
                      {i < allergies.length - 1 && <div style={{ height: 1, background: '#F5F8FC' }} />}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Medications */}
            <SectionCard index={3} label="Current Medications" iconBg="#F3EEFF" iconColor="#7C3AED" icon={<MdLocalPharmacy size={17} />} count={medications.length}
              onAdd={() => setSheet({ type: 'medication', mode: 'add' })}>
              {medications.length === 0 ? (
                <EmptyState text="No medications recorded" sub="Tap + to add a current prescription or supplement" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {medications.map((m, i) => (
                    <div key={m._id}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7C3AED', flexShrink: 0, marginTop: 5 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 2 }}>{m.name}</div>
                            <div style={{ fontSize: 12, color: '#6B7C93' }}>{m.dose} · {m.frequency} · since {m.since}</div>
                            {m.notes && <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 2 }}>{m.notes}</div>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <ActionBtn color="#2C6ED5" bg="#EBF2FF" icon={<HiPencil size={13} />} onClick={() => setSheet({ type: 'medication', mode: 'edit', item: m })} />
                          <ActionBtn color="#E05B5B" bg="#FFF0F0" icon={<HiTrash size={13} />} onClick={() => setDeleteTarget({ type: 'medication', id: m._id })} />
                        </div>
                      </div>
                      {i < medications.length - 1 && <div style={{ height: 1, background: '#F5F8FC' }} />}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </>
        )}
      </div>

      {/* Bottom Sheets */}
      <AnimatePresence>
        {sheet.type === 'condition' && (
          <ConditionSheet
            mode={sheet.mode}
            item={sheet.item as Condition | undefined}
            onClose={closeSheet}
            onSave={async (payload) => {
              if (sheet.mode === 'add') {
                const r = await addCondition(payload)
                if (r.success) { setConditions(r.data); showToast('Condition added') }
              } else {
                const r = await updateCondition((sheet.item as Condition)._id, payload)
                if (r.success) { setConditions(r.data); showToast('Condition updated') }
              }
              closeSheet()
            }}
          />
        )}
        {sheet.type === 'allergy' && (
          <AllergySheet
            mode={sheet.mode}
            item={sheet.item as Allergy | undefined}
            onClose={closeSheet}
            onSave={async (payload) => {
              if (sheet.mode === 'add') {
                const r = await addAllergy(payload)
                if (r.success) { setAllergies(r.data); showToast('Allergy added') }
              } else {
                const r = await updateAllergy((sheet.item as Allergy)._id, payload)
                if (r.success) { setAllergies(r.data); showToast('Allergy updated') }
              }
              closeSheet()
            }}
          />
        )}
        {sheet.type === 'medication' && (
          <MedicationSheet
            mode={sheet.mode}
            item={sheet.item as Medication | undefined}
            onClose={closeSheet}
            onSave={async (payload) => {
              if (sheet.mode === 'add') {
                const r = await addMedication(payload)
                if (r.success) { setMedications(r.data); showToast('Medication added') }
              } else {
                const r = await updateMedication((sheet.item as Medication)._id, payload)
                if (r.success) { setMedications(r.data); showToast('Medication updated') }
              }
              closeSheet()
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirm
            label={deleteTarget.type === 'condition' ? 'condition' : deleteTarget.type === 'allergy' ? 'allergy' : 'medication'}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && createPortal(
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
            style={{ position: 'absolute', bottom: 96, left: '50%', transform: 'translateX(-50%)', background: '#1A1A1A', color: '#fff', borderRadius: 24, padding: '10px 20px', fontSize: 13, fontWeight: 600, zIndex: 1000, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none' }}
          >
            <HiCheck size={16} color="#10B981" /> {toast}
          </motion.div>,
          getPortal()
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ActionBtn({ color, bg, icon, onClick }: { color: string; bg: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: 28, height: 28, borderRadius: 8, background: bg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
      {icon}
    </button>
  )
}

function SectionCard({ label, iconBg, iconColor, icon, count, onAdd, children, index }: {
  label: string; iconBg: string; iconColor: string; icon: React.ReactNode
  count: number; onAdd: () => void; children: React.ReactNode; index: number
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06, duration: 0.3 }}
      style={{ background: '#FFFFFF', borderRadius: 20, overflow: 'hidden', marginBottom: 14, boxShadow: '0 2px 12px rgba(30,79,163,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: '1px solid #F0F4F8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor }}>{icon}</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{label}</span>
          {count > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '2px 8px', background: iconBg, color: iconColor }}>{count}</span>
          )}
        </div>
        <button onClick={onAdd} style={{ width: 30, height: 30, borderRadius: 9, background: iconBg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HiPlus size={15} color={iconColor} />
        </button>
      </div>
      <div style={{ padding: '12px 16px 14px' }}>{children}</div>
    </motion.div>
  )
}

function EmptyState({ text, sub }: { text: string; sub: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 0 6px' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#A0AEC0', margin: '0 0 4px' }}>{text}</p>
      <p style={{ fontSize: 12, color: '#C8D4E0', margin: 0 }}>{sub}</p>
    </div>
  )
}

// ── Bottom Sheet base ─────────────────────────────────────────────────────────
function getPortal() {
  return document.getElementById('modal-portal') || document.body
}

function SheetBase({ title, onClose, onSubmit, saving, children }: {
  title: string; onClose: () => void; onSubmit: () => void; saving: boolean; children: React.ReactNode
}) {
  return createPortal(
    <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 900, display: 'flex', alignItems: 'flex-end', pointerEvents: 'all' }}
      onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', background: '#FFFFFF', borderRadius: '24px 24px 0 0', overflow: 'hidden', maxHeight: '92dvh', display: 'flex', flexDirection: 'column' }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E2E8F0' }} />
        </div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 20px 14px', borderBottom: '1px solid #F0F4F8' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>{title}</span>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: '#F5F8FC', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HiX size={16} color="#6B7C93" />
          </button>
        </div>
        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '16px 20px', flex: 1 }}>{children}</div>
        {/* Save button */}
        <div style={{ padding: '12px 20px 28px', borderTop: '1px solid #F0F4F8' }}>
          <button onClick={onSubmit} disabled={saving}
            style={{ width: '100%', height: 50, borderRadius: 14, background: BRAND_GRADIENT, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', color: '#FFFFFF', fontSize: 15, fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    getPortal()
  )
}

// ── Condition Sheet ───────────────────────────────────────────────────────────
function ConditionSheet({ mode, item, onClose, onSave }: {
  mode: SheetMode; item?: Condition; onClose: () => void
  onSave: (p: Omit<Condition, '_id'>) => Promise<void>
}) {
  const [name, setName]               = useState(item?.name ?? '')
  const [diagnosedAt, setDiagnosedAt] = useState(item?.diagnosedAt ? item.diagnosedAt.slice(0, 10) : '')
  const [notes, setNotes]             = useState(item?.notes ?? '')
  const [saving, setSaving]           = useState(false)

  const submit = async () => {
    if (!name.trim()) return
    setSaving(true)
    try { await onSave({ name: name.trim(), diagnosedAt: diagnosedAt || undefined, notes: notes.trim() || undefined }) }
    finally { setSaving(false) }
  }

  return (
    <SheetBase title={mode === 'add' ? 'Add Condition' : 'Edit Condition'} onClose={onClose} onSubmit={submit} saving={saving}>
      <Field label="Condition Name *" value={name} onChange={setName} placeholder="e.g. Type 2 Diabetes" />
      <Field label="Diagnosed Year" value={diagnosedAt} onChange={setDiagnosedAt} placeholder="YYYY-MM-DD" type="date" />
      <Field label="Notes" value={notes} onChange={setNotes} placeholder="Optional notes..." multiline />
    </SheetBase>
  )
}

// ── Allergy Sheet ─────────────────────────────────────────────────────────────
function AllergySheet({ mode, item, onClose, onSave }: {
  mode: SheetMode; item?: Allergy; onClose: () => void
  onSave: (p: Omit<Allergy, '_id'>) => Promise<void>
}) {
  const [name, setSeverityName]  = useState(item?.name ?? '')
  const [severity, setSeverity]  = useState<Allergy['severity']>(item?.severity)
  const [reaction, setReaction]  = useState(item?.reaction ?? '')
  const [saving, setSaving]      = useState(false)

  const submit = async () => {
    if (!name.trim()) return
    setSaving(true)
    try { await onSave({ name: name.trim(), severity, reaction: reaction.trim() || undefined }) }
    finally { setSaving(false) }
  }

  return (
    <SheetBase title={mode === 'add' ? 'Add Allergy' : 'Edit Allergy'} onClose={onClose} onSubmit={submit} saving={saving}>
      <Field label="Allergen Name *" value={name} onChange={setSeverityName} placeholder="e.g. Penicillin, Peanuts" />
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Severity</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['mild', 'moderate', 'severe'] as const).map((s) => (
            <button key={s} onClick={() => setSeverity(s === severity ? undefined : s)}
              style={{ flex: 1, height: 38, borderRadius: 12, border: `1.5px solid ${severity === s ? (s === 'severe' ? '#E05B5B' : s === 'moderate' ? '#D97706' : '#059669') : '#E8EDF2'}`,
                background: severity === s ? (s === 'severe' ? '#FFF0F0' : s === 'moderate' ? '#FFFBEB' : '#F0FFF4') : '#F5F8FC',
                color: severity === s ? (s === 'severe' ? '#E05B5B' : s === 'moderate' ? '#D97706' : '#059669') : '#6B7C93',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <Field label="Reaction Description" value={reaction} onChange={setReaction} placeholder="e.g. Hives, Anaphylaxis" />
    </SheetBase>
  )
}

// ── Medication Sheet ──────────────────────────────────────────────────────────
function MedicationSheet({ mode, item, onClose, onSave }: {
  mode: SheetMode; item?: Medication; onClose: () => void
  onSave: (p: Omit<Medication, '_id'>) => Promise<void>
}) {
  const [name, setName]           = useState(item?.name ?? '')
  const [dose, setDose]           = useState(item?.dose ?? '')
  const [frequency, setFrequency] = useState(item?.frequency ?? '')
  const [since, setSince]         = useState(item?.since ?? '')
  const [notes, setNotes]         = useState(item?.notes ?? '')
  const [saving, setSaving]       = useState(false)

  const FREQ_OPTIONS = ['Once daily', 'Twice daily', 'Thrice daily', 'As needed', 'Weekly', 'Monthly']

  const submit = async () => {
    if (!name.trim() || !dose.trim() || !frequency.trim() || !since.trim()) return
    setSaving(true)
    try { await onSave({ name: name.trim(), dose: dose.trim(), frequency: frequency.trim(), since: since.trim(), notes: notes.trim() || undefined }) }
    finally { setSaving(false) }
  }

  return (
    <SheetBase title={mode === 'add' ? 'Add Medication' : 'Edit Medication'} onClose={onClose} onSubmit={submit} saving={saving}>
      <Field label="Medication Name *" value={name} onChange={setName} placeholder="e.g. Metformin" />
      <Field label="Dose *" value={dose} onChange={setDose} placeholder="e.g. 500mg" />
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Frequency *</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          {FREQ_OPTIONS.map((f) => (
            <button key={f} onClick={() => setFrequency(f)}
              style={{ borderRadius: 20, padding: '6px 14px', border: `1.5px solid ${frequency === f ? '#2C6ED5' : '#E8EDF2'}`,
                background: frequency === f ? '#EBF2FF' : '#F5F8FC', color: frequency === f ? '#2C6ED5' : '#6B7C93', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {f}
            </button>
          ))}
        </div>
        {!FREQ_OPTIONS.includes(frequency) && frequency && (
          <Field label="" value={frequency} onChange={setFrequency} placeholder="Custom frequency" />
        )}
        {!frequency && (
          <Field label="Or enter custom" value={frequency} onChange={setFrequency} placeholder="Custom frequency..." />
        )}
      </div>
      <Field label="Taking Since *" value={since} onChange={setSince} placeholder="e.g. Jan 2024, 2020" />
      <Field label="Notes" value={notes} onChange={setNotes} placeholder="Optional notes..." multiline />
    </SheetBase>
  )
}

// ── Delete Confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ label, onConfirm, onCancel }: { label: string; onConfirm: () => void; onCancel: () => void }) {
  return createPortal(
    <motion.div key="del-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 950, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, pointerEvents: 'all' }}
      onClick={onCancel}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#FFFFFF', borderRadius: 20, padding: 24, width: '100%', maxWidth: 320 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', marginBottom: 8, textAlign: 'center' }}>Delete {label}?</div>
        <div style={{ fontSize: 13, color: '#6B7C93', textAlign: 'center', marginBottom: 20 }}>This action cannot be undone.</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, height: 44, borderRadius: 12, border: '1.5px solid #E8EDF2', background: '#F5F8FC', color: '#4A5568', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, height: 44, borderRadius: 12, border: 'none', background: '#E05B5B', color: '#FFFFFF', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
        </div>
      </motion.div>
    </motion.div>,
    getPortal()
  )
}

// ── Field helper ──────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = 'text', multiline = false }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; multiline?: boolean
}) {
  const base: React.CSSProperties = {
    width: '100%', borderRadius: 12, border: '1.5px solid #E8EDF2', background: '#F5F8FC',
    fontSize: 14, color: '#1A1A1A', fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  }
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{label}</div>}
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
          style={{ ...base, padding: '12px 14px', resize: 'none' }} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          style={{ ...base, height: 46, padding: '0 14px' }} />
      )}
    </div>
  )
}
