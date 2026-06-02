import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import Badge, { PatientTagBadge } from '@/components/ui/Badge'
import { useAppStore } from '@/store/app'
import { useAuthStore } from '@/store/auth'
import { patientsService } from '@/services/patients.service'
import { masterdataService } from '@/services/masterdata.service'
import { toast } from '@/store/toast'

type FormData = {
  firstName: string; lastName: string; gender: string; dob: string
  bg: string; marital: string; occ: string; ptag: string
  mobile: string; altPhone: string; email: string
  street: string; city: string; state: string; pin: string
  emgName: string; emgRel: string; emgPhone: string
  govType: string; govNum: string
  meds: string; surgeries: string; medNotes: string
  insurer: string; policy: string; validTill: string; cashless: boolean
}

interface Props { id?: string; viewOnly?: boolean; onClose?: () => void }

const ALLERGIES: Array<{ name: string; icon: string }> = [
  { name: 'Penicillin', icon: 'pill'      },
  { name: 'Sulfa',      icon: 'shield'    },
  { name: 'Aspirin',    icon: 'pill'      },
  { name: 'Ibuprofen',  icon: 'clipboard' },
  { name: 'Latex',      icon: 'thumbsUp'  },
  { name: 'Peanuts',    icon: 'leaf'      },
  { name: 'Shellfish',  icon: 'fish'      },
  { name: 'Dust',       icon: 'wind'      },
  { name: 'Pollen',     icon: 'flower'    },
  { name: 'Mold',       icon: 'droplet'   },
  { name: 'Egg',        icon: 'egg'       },
  { name: 'Milk',       icon: 'cup'       },
  { name: 'Soy',        icon: 'smile'     },
  { name: 'Wheat',      icon: 'leaf'      },
  { name: 'Bee Sting',  icon: 'bug'       },
  { name: 'Other',      icon: 'circle'    },
]
const CONDITIONS: Array<{ name: string; icon: string }> = [
  { name: 'Hypertension',          icon: 'heart'  },
  { name: 'Diabetes',              icon: 'shield' },
  { name: 'Asthma',                icon: 'wind'   },
  { name: 'Hypothyroid',           icon: 'star'   },
  { name: 'COPD',                  icon: 'activity' },
  { name: 'Arthritis',             icon: 'bone'   },
  { name: 'Anemia',                icon: 'droplet' },
  { name: 'Depression',            icon: 'activity' },
  { name: 'Obesity',               icon: 'users'  },
  { name: 'CAD (Heart Disease)',   icon: 'heart'  },
  { name: 'CKD (Kidney Disease)',  icon: 'droplet' },
  { name: 'GERD',                  icon: 'circle' },
  { name: 'Other',                 icon: 'circle' },
]
const BG_OPTS    = ['A+','A-','B+','B-','AB+','AB-','O+','O-']
const GOV_IDS    = ['Aadhaar','PAN','Passport','Voter ID','Driving Licence']

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)} role="switch" aria-checked={on} style={{
      flexShrink: 0, width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
      background: on ? 'var(--brand-gradient)' : 'var(--border-soft)', position: 'relative', transition: 'background 0.2s',
    }}>
      <span style={{
        position: 'absolute', top: 2, left: on ? 22 : 2, width: 20, height: 20,
        borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

function SectionHead({ title }: { title: string }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase',
      letterSpacing: '0.06em', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border-light)',
    }}>
      {title}
    </div>
  )
}

/** Profile section header — small blue icon tile + title + subtitle. */
function SectionHeader({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <span style={{
        width: 40, height: 40, borderRadius: 10,
        background: '#EBF2FF', border: '1px solid #DBE7F8',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon name={icon} size={18} style={{ color: '#1E4FA3' }} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-primary)', letterSpacing: -0.2, lineHeight: 1.2 }}>
          {title}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginTop: 2 }}>
          {sub}
        </div>
      </div>
    </div>
  )
}

/** Polished section eyebrow (legacy — used elsewhere). */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 800, color: 'var(--fg-muted)',
      textTransform: 'uppercase', letterSpacing: '0.12em',
      paddingBottom: 14, marginBottom: 16,
      borderBottom: '1px solid var(--border-light)',
    }}>
      {children}
    </div>
  )
}

/** Form label with an optional right-aligned hint (e.g. "27 yrs"). */
function FormLabel({
  children, required, suffix,
}: { children: React.ReactNode; required?: boolean; suffix?: React.ReactNode }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      fontSize: 13, fontWeight: 700, color: 'var(--fg-primary)', marginBottom: 6,
    }}>
      <span>
        {children}
        {required && <span style={{ color: '#EF4444', marginLeft: 4 }}>*</span>}
      </span>
      {suffix && (
        <span style={{ fontSize: 12.5, fontWeight: 700 }}>
          <span style={{ color: 'var(--fg-muted)' }}>•</span> {suffix}
        </span>
      )}
    </label>
  )
}

/** Wraps an input/select with a small icon on the left edge. */
function IconInput({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{
        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
        color: 'var(--fg-muted)', display: 'inline-flex', alignItems: 'center', pointerEvents: 'none',
      }}>
        <Icon name={icon} size={14} />
      </span>
      {children}
    </div>
  )
}

/** Segmented control where each option has an icon + label. */
function SegmentedSelect({
  value, onChange, options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string; icon: React.ReactNode }[]
}) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map((opt) => {
        const on = value === opt.value
        return (
          <button
            key={opt.value} type="button"
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 12px', borderRadius: 10,
              background: on ? '#EBF2FF' : '#FFFFFF',
              border: `1.5px solid ${on ? '#1E4FA3' : 'var(--border-soft)'}`,
              color: on ? '#1E4FA3' : 'var(--fg-primary)',
              fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
            {typeof opt.icon === 'string'
              ? <span style={{ fontSize: 14 }}>{opt.icon}</span>
              : opt.icon}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/** Preview stat tile — used in the redesigned Patient Preview sidebar. */
function PreviewStat({
  icon, label, value, fullWidth,
}: { icon: string; label: string; value: string; fullWidth?: boolean }) {
  return (
    <div style={{
      background: '#F8FAFC', border: '1px solid var(--border-light)',
      borderRadius: 10, padding: '10px 12px',
      display: 'flex', alignItems: 'center', gap: fullWidth ? 16 : 12,
    }}>
      <span style={{
        width: 28, height: 28, borderRadius: 8,
        background: '#EBF2FF', border: '1px solid #DBE7F8',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon name={icon} size={14} style={{ color: '#1E4FA3' }} />
      </span>
      <div style={{ flex: 1, minWidth: 0, display: fullWidth ? 'flex' : 'block', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-primary)', display: 'block' }}>
          {label}
        </span>
        <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontWeight: 600, marginTop: fullWidth ? 0 : 2, display: 'block' }}>
          {value}
        </span>
      </div>
    </div>
  )
}

/** Contact row inside the preview sidebar. */
function PreviewContactRow({ icon, value }: { icon: string; value?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
      <span style={{
        width: 22, height: 22, borderRadius: 6,
        background: 'var(--bg-section)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon name={icon} size={12} style={{ color: 'var(--fg-muted)' }} />
      </span>
      <span style={{ fontSize: 13, color: value ? 'var(--fg-primary)' : 'var(--fg-muted)', fontWeight: value ? 600 : 500 }}>
        {value || '--'}
      </span>
    </div>
  )
}

/** Compact tile shown in the live-preview side panel. */
function MiniStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{
      background: '#F1F5F9', borderRadius: 12, padding: '12px 10px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    }}>
      <Icon name={icon} size={16} style={{ color: '#1E4FA3' }} />
      <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--fg-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--fg-primary)' }}>
        {value}
      </span>
    </div>
  )
}

/** Reusable live-preview sidebar used in the Profile + Contact tabs. */
function PatientPreviewSidebar({
  av, name, age, gender, bg, ptag, allergies, conditions,
  mobile, email, insurer, policy, isEdit, id,
  street, city, state, pin,
  emgName, emgRel, emgPhone,
}: {
  av: string; name: string; age: string; gender: string; bg: string;
  ptag: string; allergies: string[]; conditions: string[];
  mobile: string; email: string; insurer: string; policy: string;
  isEdit: boolean; id?: string;
  street?: string; city?: string; state?: string; pin?: string;
  emgName?: string; emgRel?: string; emgPhone?: string;
}) {
  const addressLine = [street, city, state, pin].filter(Boolean).join(', ')
  return (
    <div style={{
      width: 320, flexShrink: 0, position: 'sticky', top: 100,
      alignSelf: 'flex-start',
      maxHeight: 'calc(100vh - 200px)', overflowY: 'auto',
      background: '#FFFFFF', borderRadius: 14,
      border: '1px solid var(--border-soft)',
      boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
    }}>
      {/* Title row */}
      <div style={{ padding: '18px 20px 6px' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-primary)' }}>
          Patient Preview
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginTop: 2 }}>
          Live preview of patient details
        </div>
      </div>

      {/* Gradient hero with centered avatar */}
      <div style={{
        margin: '14px 18px 0', height: 120, borderRadius: 12,
        background: 'linear-gradient(135deg, #2C6ED5 0%, #1FA3A8 100%)',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', left: '50%', bottom: -42, transform: 'translateX(-50%)',
        }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: '#FFFFFF', border: '5px solid #FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 900, color: '#1E4FA3',
            boxShadow: '0 8px 20px rgba(15,23,42,0.12)',
            position: 'relative',
          }}>
            {av}
            <span style={{
              position: 'absolute', right: -4, bottom: -4,
              width: 30, height: 30, borderRadius: '50%',
              background: '#FFFFFF', border: '1px solid #DBE7F8',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(15,23,42,0.10)',
            }}>
              <Icon name="edit" size={12} style={{ color: '#1E4FA3' }} />
            </span>
          </div>
        </div>
      </div>

      {/* Name + meta + Active pill row */}
      <div style={{ padding: '54px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--fg-primary)' }}>{name}</div>
            <div style={{ fontSize: 13, color: 'var(--fg-secondary)', fontWeight: 600, marginTop: 4 }}>
              {age ? `${age} yrs` : '--'}
              {gender && <> <span style={{ color: 'var(--fg-muted)' }}>•</span> {gender === 'M' ? 'Male' : gender === 'F' ? 'Female' : gender}</>}
              {bg && <> <span style={{ color: 'var(--fg-muted)' }}>•</span> {bg}</>}
            </div>
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 999,
            background: '#DCFCE7', border: '1px solid #BBF7D0',
            color: '#15803D', fontSize: 11.5, fontWeight: 800,
            flexShrink: 0,
          }}>
            {ptag === 'active' ? 'Active' : ptag.charAt(0).toUpperCase() + ptag.slice(1)}
          </span>
        </div>
      </div>

      {/* Mini-stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '16px 20px 0' }}>
        <PreviewStat icon="users" label="Allergies"  value={allergies.length  > 0 ? String(allergies.length)  : '--'} />
        <PreviewStat icon="heart" label="Conditions" value={conditions.length > 0 ? String(conditions.length) : '--'} />
      </div>
      <div style={{ padding: '10px 20px 0' }}>
        <PreviewStat
          icon="shield"
          label="Insurance"
          value={insurer ? (policy ? '✓ Covered' : 'Pending') : 'N/A'}
          fullWidth
        />
      </div>

      {/* Contact section */}
      <div style={{ padding: '18px 20px 4px' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg-primary)', marginBottom: 10 }}>
          Contact
        </div>
        <PreviewContactRow icon="phone" value={mobile} />
        <PreviewContactRow icon="mail"  value={email}  />
        <PreviewContactRow icon="building" value={addressLine || undefined} />
      </div>

      {/* Emergency contact */}
      {(emgName || emgRel || emgPhone) && (
        <div style={{ padding: '14px 20px 4px', borderTop: '1px solid var(--border-light)', marginTop: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg-primary)', marginBottom: 10 }}>
            Emergency Contact
          </div>
          <PreviewContactRow
            icon="users"
            value={emgName ? `${emgName}${emgRel ? ` (${emgRel})` : ''}` : undefined}
          />
          <PreviewContactRow icon="phone" value={emgPhone} />
        </div>
      )}

      {/* Patient ID */}
      <div style={{ padding: '16px 20px 20px', borderTop: '1px solid var(--border-light)', marginTop: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg-primary)' }}>
          Patient ID
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginTop: 4 }}>
          {isEdit && id ? <span style={{ fontFamily: 'var(--font-mono)' }}>#{id.slice(-8).toUpperCase()}</span> : 'Auto-generated on save'}
        </div>
      </div>

      {/* Allergies & Conditions chip rows (only when set) */}
      {allergies.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-light)', padding: '12px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Icon name="alert" size={13} style={{ color: 'var(--fg-muted)' }} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-primary)' }}>Allergies</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {allergies.map((a) => <span key={a} className="badge red" style={{ fontSize: 10 }}>{a}</span>)}
          </div>
        </div>
      )}
      {conditions.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-light)', padding: '12px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Icon name="heart" size={13} style={{ color: 'var(--fg-muted)' }} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-primary)' }}>Conditions</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {conditions.map((c) => <span key={c} className="badge warning" style={{ fontSize: 10 }}>{c}</span>)}
          </div>
        </div>
      )}
    </div>
  )
}

const RELATIONSHIPS = [
  'Father', 'Mother', 'Spouse', 'Husband', 'Wife',
  'Son', 'Daughter', 'Brother', 'Sister',
  'Grandfather', 'Grandmother', 'Grandson', 'Granddaughter',
  'Uncle', 'Aunt', 'Nephew', 'Niece', 'Cousin',
  'Father-in-law', 'Mother-in-law', 'Brother-in-law', 'Sister-in-law',
  'Son-in-law', 'Daughter-in-law',
  'Step-father', 'Step-mother', 'Step-brother', 'Step-sister',
  'Guardian', 'Friend', 'Neighbor', 'Colleague',
  'Caretaker', 'Doctor', 'Other',
]

/** Searchable combobox for the Emergency Contact relationship field. */
function RelationCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState(value || '')

  useEffect(() => { setQuery(value || '') }, [value])

  const filtered = query.trim()
    ? RELATIONSHIPS.filter(r => r.toLowerCase().includes(query.trim().toLowerCase()))
    : RELATIONSHIPS

  return (
    <div style={{ position: 'relative' }}>
      <IconInput icon="users">
        <input
          className="form-input"
          placeholder="Search relationship…"
          style={{ paddingLeft: 38, paddingRight: 34 }}
          value={query}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => {
            setQuery(e.target.value)
            onChange(e.target.value)
            setOpen(true)
          }}
        />
        <span style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none', color: 'var(--fg-muted)',
        }}>
          <Icon name="chevron-down" size={14} />
        </span>
      </IconInput>

      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 'calc(100% + 4px)',
          background: '#FFFFFF', border: '1px solid var(--border-soft)',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(15,23,42,0.10)',
          maxHeight: 220, overflowY: 'auto', zIndex: 20,
        }}>
          {filtered.map((r) => (
            <button
              key={r}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(r); setQuery(r); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '8px 12px',
                background: r === value ? '#EFF6FF' : 'transparent',
                border: 'none', textAlign: 'left', cursor: 'pointer',
                fontSize: 13.5, color: 'var(--fg-primary)',
              }}
            >
              <Icon name="users" size={12} style={{ color: 'var(--fg-muted)' }} />
              {r}
            </button>
          ))}
        </div>
      )}
      {open && filtered.length === 0 && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 'calc(100% + 4px)',
          background: '#FFFFFF', border: '1px solid var(--border-soft)',
          borderRadius: 10, padding: '10px 12px', fontSize: 12.5, color: 'var(--fg-muted)',
          boxShadow: '0 8px 24px rgba(15,23,42,0.10)', zIndex: 20,
        }}>
          No match — press Enter to keep "{query}"
        </div>
      )}
    </div>
  )
}

/** Searchable multi-select: type to filter a master list, click to add, selected items show as removable chips. */
function SearchableMultiSelect({
  options, selected, onChange, placeholder, fallbackIcon = 'circle',
}: {
  options: Array<{ name: string; icon: string }>;
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  fallbackIcon?: string;
}) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')

  const iconFor = (name: string) =>
    options.find(o => o.name.toLowerCase() === name.toLowerCase())?.icon ?? fallbackIcon

  const q = query.trim().toLowerCase()
  const filtered = options.filter(o =>
    (!q || o.name.toLowerCase().includes(q)) && !selected.includes(o.name)
  )
  const exactMatch = options.some(o => o.name.toLowerCase() === q)
  const showCustom = q && !exactMatch && !selected.some(s => s.toLowerCase() === q)

  const add = (name: string) => {
    if (!name.trim() || selected.includes(name)) return
    onChange([...selected, name])
    setQuery('')
  }
  const remove = (name: string) => onChange(selected.filter(s => s !== name))

  return (
    <div>
      {/* Search input */}
      <div style={{ position: 'relative', marginBottom: selected.length ? 12 : 0 }}>
        <IconInput icon="search">
          <input
            className="form-input"
            placeholder={placeholder}
            style={{ paddingLeft: 38 }}
            value={query}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (filtered[0]) add(filtered[0].name)
                else if (q) add(query.trim())
              }
            }}
          />
        </IconInput>

        {open && (filtered.length > 0 || showCustom) && (
          <div style={{
            position: 'absolute', left: 0, right: 0, top: 'calc(100% + 4px)',
            background: '#FFFFFF', border: '1px solid var(--border-soft)',
            borderRadius: 10, boxShadow: '0 8px 24px rgba(15,23,42,0.10)',
            maxHeight: 260, overflowY: 'auto', zIndex: 20,
          }}>
            {filtered.map((o) => (
              <button
                key={o.name}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(o.name)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '9px 12px',
                  background: 'transparent', border: 'none',
                  textAlign: 'left', cursor: 'pointer',
                  fontSize: 13.5, color: 'var(--fg-primary)',
                }}
              >
                <span style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: '#F1F5F9',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={o.icon} size={12} style={{ color: '#1E4FA3' }} />
                </span>
                {o.name}
              </button>
            ))}
            {showCustom && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(query.trim())}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '9px 12px',
                  background: '#F8FAFC', border: 'none',
                  borderTop: filtered.length ? '1px solid var(--border-light)' : 'none',
                  textAlign: 'left', cursor: 'pointer',
                  fontSize: 13, color: 'var(--fg-secondary)', fontWeight: 600,
                }}
              >
                <Icon name="plus" size={12} style={{ color: '#15803D' }} />
                Add &ldquo;{query.trim()}&rdquo;
              </button>
            )}
          </div>
        )}
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {selected.map((name) => (
            <span
              key={name}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 10px 6px 12px', borderRadius: 999,
                background: '#1E4FA3', color: '#FFFFFF',
                fontSize: 13, fontWeight: 600,
                boxShadow: '0 2px 6px rgba(30,79,163,0.20)',
              }}
            >
              <Icon name={iconFor(name)} size={12} style={{ color: '#FFFFFF' }} />
              {name}
              <button
                type="button"
                onClick={() => remove(name)}
                aria-label={`Remove ${name}`}
                style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.20)', border: 'none',
                  color: '#FFFFFF', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, lineHeight: 1,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** Pill-shaped chip with leading icon + selectable state. Used for allergies/conditions. */
function IconChip({ name, icon, selected, onToggle }: { name: string; icon: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 14px', borderRadius: 999,
        background: selected ? '#1E4FA3' : '#FFFFFF',
        border: `1px solid ${selected ? '#1E4FA3' : '#DBE7F8'}`,
        color: selected ? '#FFFFFF' : 'var(--fg-primary)',
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
        transition: 'all 120ms ease',
        boxShadow: selected ? '0 2px 6px rgba(30,79,163,0.20)' : 'none',
      }}
    >
      <Icon name={icon} size={13} style={{ color: selected ? '#FFFFFF' : 'var(--fg-muted)' }} />
      {name}
    </button>
  )
}

/** Textarea with left icon rail + bottom-right character counter. */
function IconTextarea({
  icon, label, placeholder, value, max = 1000, register: reg,
}: {
  icon: string; label: string; placeholder: string;
  value: string; max?: number;
  register: React.HTMLAttributes<HTMLTextAreaElement> & { ref?: React.Ref<HTMLTextAreaElement> };
}) {
  const len = (value || '').length
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
      <div style={{
        flexShrink: 0, width: 40, height: 40, borderRadius: 10,
        background: '#F1F5F9', border: '1px solid var(--border-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: 22,
      }}>
        <Icon name={icon} size={16} style={{ color: 'var(--fg-muted)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: 6 }}>
          {label}
        </div>
        <div style={{ position: 'relative' }}>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder={placeholder}
            maxLength={max}
            {...reg}
            style={{ paddingRight: 60 }}
          />
          <span style={{
            position: 'absolute', right: 12, bottom: 8,
            fontSize: 11, color: 'var(--fg-muted)', fontWeight: 500,
            pointerEvents: 'none',
          }}>
            {len}/{max}
          </span>
        </div>
      </div>
    </div>
  )
}

function PreviewCardHead({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--border-light)' }}>
      <Icon name={icon} size={13} />
      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--fg-primary)' }}>{title}</span>
    </div>
  )
}

function seg(opts: string[], val: string, set: (v: string) => void) {
  return <div className="seg-ctrl">{opts.map(o => <button key={o} type="button" className={val === o ? 'active' : ''} onClick={() => set(o)}>{o}</button>)}</div>
}

function chipSet(opts: string[], sel: string[], toggle: (v: string) => void) {
  return <div className="chip-lib">{opts.map(o => <button key={o} type="button" className={`tag${sel.includes(o) ? ' selected' : ''}`} onClick={() => toggle(o)}>{o}</button>)}</div>
}

function calcAge(dob: string) {
  if (!dob) return ''
  return String(Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000)))
}

/** Map a server Patient document → flat FormData for the form fields. */
function patientToForm(p: Record<string, any>): Partial<FormData> {
  const splitName = (full?: string) => {
    if (!full) return { firstName: '', lastName: '' }
    const parts = full.trim().split(/\s+/)
    return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') }
  }
  const fn = p.firstName ?? splitName(p.name).firstName
  const ln = p.lastName  ?? splitName(p.name).lastName
  const dob = p.dob ? new Date(p.dob).toISOString().slice(0, 10) : ''
  return {
    firstName: fn,
    lastName:  ln,
    gender:    p.gender    || 'M',
    dob,
    bg:        p.bloodGroup || 'O+',
    marital:   p.marital    || 'Single',
    occ:       p.occupation || '',
    ptag:      p.tag        || 'active',

    mobile:    p.phone    || '',
    altPhone:  p.altPhone || '',
    email:     p.email    || '',

    street: p.address?.street || '',
    city:   p.address?.city   || '',
    state:  p.address?.state  || '',
    pin:    p.address?.pin    || '',

    emgName:  p.emergencyContact?.name     || '',
    emgRel:   p.emergencyContact?.relation || '',
    emgPhone: p.emergencyContact?.phone    || '',

    govType: p.governmentId?.type   || 'Aadhaar',
    govNum:  p.governmentId?.number || '',

    meds:      p.medications   || '',
    surgeries: p.surgeries     || '',
    medNotes:  p.internalNotes || '',

    insurer:   p.insurance?.provider  || '',
    policy:    p.insurance?.policy    || '',
    validTill: p.insurance?.validTill || '',
    cashless:  Boolean(p.insurance?.cashless),
  }
}

/** Build the server payload from the form + tab-local state. */
function formToPayload(
  data: FormData,
  extras: { gender: string; marital: string; ptag: string; allergies: string[]; conditions: string[]; cashlessOn: boolean; clinicId?: string },
) {
  const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim()
  return {
    name:       fullName || data.firstName || data.lastName || 'Unnamed',
    firstName:  data.firstName,
    lastName:   data.lastName,
    gender:     extras.gender,
    dob:        data.dob || undefined,
    bloodGroup: data.bg,
    marital:    extras.marital,
    occupation: data.occ,
    tag:        extras.ptag,

    phone:    data.mobile,
    altPhone: data.altPhone,
    email:    data.email,

    address: {
      street: data.street,
      city:   data.city,
      state:  data.state,
      pin:    data.pin,
    },

    emergencyContact: {
      name:     data.emgName,
      relation: data.emgRel,
      phone:    data.emgPhone,
    },

    governmentId: {
      type:   data.govType,
      number: data.govNum,
    },

    allergies:     extras.allergies,
    conditions:    extras.conditions,
    medications:   data.meds,
    surgeries:     data.surgeries,
    internalNotes: data.medNotes,

    insurance: {
      provider:  data.insurer,
      policy:    data.policy,
      validTill: data.validTill,
      cashless:  extras.cashlessOn,
    },

    ...(extras.clinicId ? { clinicId: extras.clinicId } : {}),
  }
}

export default function PatientForm({ id, viewOnly = false, onClose }: Props) {
  const { setRoute } = useAppStore()
  const user = useAuthStore((s) => s.user)
  const isEdit = Boolean(id) && !viewOnly
  const isView = viewOnly

  const [tab, setTab]           = useState(0)
  const [gender, setGender]     = useState('M')
  const [marital, setMarital]   = useState('Single')
  const [ptag, setPtag]         = useState('active')
  const [allergies, setAllergies]   = useState<string[]>([])
  const [conditions, setConditions] = useState<string[]>([])
  const [cashlessOn, setCashlessOn] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: { bg: 'O+', govType: 'Aadhaar', cashless: false }
  })

  const [pinLookup, setPinLookup] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; message?: string }>({ status: 'idle' })
  const pin = watch('pin') || ''
  useEffect(() => {
    const value = pin.trim()
    if (!/^\d{6}$/.test(value)) {
      setPinLookup({ status: 'idle' })
      return
    }
    let cancelled = false
    setPinLookup({ status: 'loading' })
    masterdataService.lookupPincode(value)
      .then((d) => {
        if (cancelled) return
        setValue('city',  d.city,  { shouldDirty: true, shouldValidate: false })
        setValue('state', d.state, { shouldDirty: true, shouldValidate: false })
        setPinLookup({ status: 'success', message: `${d.city}, ${d.state}` })
      })
      .catch((e) => {
        if (cancelled) return
        const msg = e?.response?.status === 404 ? 'PIN not found' : 'Lookup failed'
        setPinLookup({ status: 'error', message: msg })
      })
    return () => { cancelled = true }
  }, [pin, setValue])

  const firstName = watch('firstName') || ''
  const lastName  = watch('lastName')  || ''
  const dob       = watch('dob')       || ''
  const bg        = watch('bg')        || 'O+'
  const mobile    = watch('mobile')    || ''
  const email     = watch('email')     || ''
  const insurer   = watch('insurer')   || ''
  const policy    = watch('policy')    || ''
  const age  = calcAge(dob)
  const name = `${firstName} ${lastName}`.trim() || 'New Patient'
  const av   = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => {
    if (!id) return
    patientsService.get(id)
      .then((data: any) => {
        const mapped = patientToForm(data)
        reset(mapped as FormData)
        if (data.gender)              setGender(data.gender)
        if (data.marital)             setMarital(data.marital)
        if (data.tag)                 setPtag(data.tag)
        if (Array.isArray(data.allergies))  setAllergies(data.allergies)
        if (Array.isArray(data.conditions)) setConditions(data.conditions)
        if (data.insurance?.cashless !== undefined) setCashlessOn(Boolean(data.insurance.cashless))
      })
      .catch(() => { setServerError('Failed to load patient data'); toast.error('Failed to load record') })
  }, [id, reset])

  const onSubmit = async (data: FormData) => {
    try {
      setServerError(null)
      const payload = formToPayload(data, {
        gender, marital, ptag, allergies, conditions, cashlessOn,
        clinicId: isEdit ? undefined : user?.clinicId,
      })
      if (isEdit) {
        await patientsService.update(id!, payload)
        toast.success('Patient updated successfully')
      } else {
        if (!payload.clinicId) {
          toast.error('No clinic on session — cannot create patient')
          return
        }
        await patientsService.create(payload)
        toast.success('Patient created successfully')
      }
      if (onClose) onClose(); else setRoute('patients')
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Save failed')
      toast.error(err.response?.data?.message || 'Save failed')
    }
  }

  const TABS = [
    { label: 'Profile',         sub: 'Identity & basic info',  icon: 'user'   },
    { label: 'Contact & ID',    sub: 'Phone, email & address', icon: 'phone'  },
    { label: 'Medical History', sub: 'Allergies & conditions', icon: 'heart'  },
  ]

  const goBack = () => { if (onClose) onClose(); else setRoute('patients') }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{
        display: 'flex', flexDirection: 'column',
        height: '100%', minHeight: 0,
      }}>

      <Header
        title={isView ? `Viewing ${name}` : isEdit ? `Editing ${name}` : 'Create patient'}
        crumbs={isView ? `Patients · ${name} · View`
              : isEdit ? `Patients · ${name}`
              : 'Patients · New patient'}
      />

      <div className="main">

        {/* Sticky toolbar — tabs on top, action buttons underneath */}
        <div style={{
          position: 'sticky', top: -20, zIndex: 5,
          paddingTop: 8, marginTop: -8, marginBottom: 10,
          background: 'linear-gradient(180deg, var(--bg-app) 0%, var(--bg-app) 88%, transparent 100%)',
          backdropFilter: 'blur(6px)',
        }}>
        {/* Tabs + action buttons live inside the same white toolbar card */}
        <div style={{
          display: 'flex', alignItems: 'stretch', gap: 0,
          background: '#FFFFFF',
          borderRadius: 14,
          padding: '4px 12px 0 8px',
          boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
          border: '1px solid var(--border-soft)',
          overflowX: 'auto',
        }}>
          {/* Tabs (flex-grow) */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', gap: 0, minWidth: 0 }}>
            {TABS.map((t, i) => {
              const active = tab === i
              return (
                <button
                  key={t.label} type="button"
                  onClick={() => setTab(i)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 18px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: active ? '3px solid #2C6ED5' : '3px solid transparent',
                    marginBottom: -1, minWidth: 160,
                    transition: 'border-color 0.15s',
                    fontFamily: 'inherit',
                  }}>
                  <span style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: active ? '#EBF2FF' : 'var(--bg-section)',
                    border: active ? '1px solid #DBE7F8' : '1px solid var(--border-light)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon name={t.icon as any} size={16}
                      style={{ color: active ? '#1E4FA3' : 'var(--fg-muted)' }} />
                  </span>
                  <div style={{ textAlign: 'left', minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 800,
                      color: active ? '#1E4FA3' : 'var(--fg-primary)',
                      lineHeight: 1.2,
                    }}>
                      {t.label}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--fg-muted)', fontWeight: 500, marginTop: 2 }}>
                      {t.sub}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Action buttons (right side, vertically centered) */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            paddingLeft: 14, marginLeft: 6,
            borderLeft: '1px solid var(--border-light)',
            flexShrink: 0,
          }}>
            {serverError && (
              <span style={{ fontSize: 12, color: 'var(--danger-500, #ef4444)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="alert" size={13} /> {serverError}
              </span>
            )}
            {isView && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 999,
                background: '#EFF6FF', border: '1px solid #BFDBFE',
                color: '#1E4FA3', fontSize: 11.5, fontWeight: 800,
              }}>
                <Icon name="eye" size={12} /> View only
              </span>
            )}
            <button
              type="button" onClick={goBack}
              style={{
                padding: '9px 18px', borderRadius: 10,
                background: '#FFFFFF', border: '1px solid var(--border-soft)',
                color: 'var(--fg-primary)', fontSize: 13.5, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
              {isView ? 'Close' : 'Cancel'}
            </button>
            {isView ? (
              <button
                type="button"
                onClick={() => setRoute('patient-edit')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '9px 18px', borderRadius: 10,
                  background: 'linear-gradient(135deg, #2C6ED5 0%, #1E4FA3 100%)',
                  border: 'none', color: '#FFFFFF',
                  fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(30,79,163,0.28)',
                }}>
                <Icon name="edit" size={14} /> Edit Patient
              </button>
            ) : (
              <button
                type="submit" disabled={isSubmitting}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '9px 18px', borderRadius: 10,
                  background: 'linear-gradient(135deg, #2C6ED5 0%, #1E4FA3 100%)',
                  border: 'none', color: '#FFFFFF',
                  fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 20px rgba(30,79,163,0.28)',
                  opacity: isSubmitting ? 0.7 : 1,
                }}>
                <Icon name="check" size={14} /> {isSubmitting ? 'Saving…' : isEdit ? 'Update Patient' : 'Create Patient'}
              </button>
            )}
          </div>
        </div>
        </div>
        {/* /Sticky toolbar */}

        <fieldset
          disabled={isView}
          style={{
            border: 'none', padding: 0, margin: 0,
            // Browsers grey out disabled fieldsets — keep our intentional colours.
            opacity: 1,
          }}
        >

          {/* ─── Profile ─── */}
          {tab === 0 && (
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>

              {/* ── Form column ─────────────────────────────────────── */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* Basic information */}
                <div className="card" style={{ padding: 18 }}>
                  <SectionHeader
                    icon="user"
                    title="Basic Information"
                    sub="Enter the patient's basic identity details"
                  />

                  <div className="grid-2" style={{ rowGap: 12 }}>
                    {/* First name */}
                    <div className="form-group">
                      <FormLabel required>First name</FormLabel>
                      <IconInput icon="user">
                        <input
                          className="form-input"
                          placeholder="First name"
                          style={{ paddingLeft: 38 }}
                          {...register('firstName', { required: 'First name is required' })}
                        />
                      </IconInput>
                      {errors.firstName && <span className="form-error">{errors.firstName.message}</span>}
                    </div>

                    {/* Last name */}
                    <div className="form-group">
                      <FormLabel required>Last name</FormLabel>
                      <IconInput icon="user">
                        <input
                          className="form-input"
                          placeholder="Last name"
                          style={{ paddingLeft: 38 }}
                          {...register('lastName', { required: 'Last name is required' })}
                        />
                      </IconInput>
                      {errors.lastName && <span className="form-error">{errors.lastName.message}</span>}
                    </div>

                    {/* Gender */}
                    <div className="form-group">
                      <FormLabel>Gender</FormLabel>
                      <SegmentedSelect
                        value={gender}
                        onChange={setGender}
                        options={[
                          { value: 'M',     label: 'Male',   icon: '♂' },
                          { value: 'F',     label: 'Female', icon: '♀' },
                          { value: 'Other', label: 'Other',  icon: '⚧' },
                        ]}
                      />
                    </div>

                    {/* DOB */}
                    <div className="form-group">
                      <FormLabel
                        suffix={age ? <span style={{ color: '#1E4FA3' }}>{age} yrs</span> : null}
                      >
                        Date of birth
                      </FormLabel>
                      <IconInput icon="calendar">
                        <input
                          className="form-input"
                          type="date"
                          placeholder="dd/mm/yyyy"
                          style={{ paddingLeft: 38 }}
                          {...register('dob')}
                        />
                      </IconInput>
                    </div>

                    {/* Blood group */}
                    <div className="form-group">
                      <FormLabel>Blood group</FormLabel>
                      <IconInput icon="heart">
                        <select className="form-select" style={{ paddingLeft: 38 }} {...register('bg')}>
                          <option value="">Select blood group</option>
                          {BG_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </IconInput>
                    </div>

                    {/* Marital status */}
                    <div className="form-group">
                      <FormLabel>Marital status</FormLabel>
                      <SegmentedSelect
                        value={marital}
                        onChange={setMarital}
                        options={[
                          { value: 'Single',  label: 'Single',  icon: <Icon name="user"  size={14} /> },
                          { value: 'Married', label: 'Married', icon: <Icon name="users" size={14} /> },
                          { value: 'Other',   label: 'Other',   icon: <Icon name="users" size={14} /> },
                        ]}
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="card" style={{ padding: 18 }}>
                  <SectionHeader
                    icon="ticket"
                    title="Status"
                    sub="Occupation and patient tagging"
                  />
                  <div className="grid-2" style={{ rowGap: 12 }}>
                    <div className="form-group">
                      <FormLabel>Occupation</FormLabel>
                      <IconInput icon="card">
                        <input
                          className="form-input"
                          placeholder="Occupation"
                          style={{ paddingLeft: 38 }}
                          {...register('occ')}
                        />
                      </IconInput>
                    </div>

                    <div className="form-group">
                      <FormLabel>Patient tag</FormLabel>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {([
                          { key: 'active',    label: 'Active',    icon: 'check',     bg: '#DCFCE7', fg: '#15803D', br: '#86EFAC' },
                          { key: 'new',       label: 'New',       icon: 'sparkles',  bg: '#FFFFFF', fg: '#475569', br: 'var(--border-soft)' },
                          { key: 'follow-up', label: 'Follow-up', icon: 'clock',     bg: '#FFFFFF', fg: '#475569', br: 'var(--border-soft)' },
                          { key: 'critical',  label: 'Critical',  icon: 'alert',     bg: '#FFFFFF', fg: '#475569', br: 'var(--border-soft)' },
                        ] as const).map((t) => {
                          const on = ptag === t.key
                          return (
                            <button
                              key={t.key} type="button"
                              onClick={() => setPtag(t.key)}
                              style={{
                                flex: 1, minWidth: 110,
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                padding: '10px 14px', borderRadius: 10,
                                background: on ? t.bg : '#FFFFFF',
                                border: `1.5px solid ${on ? t.br : 'var(--border-soft)'}`,
                                color: on ? t.fg : 'var(--fg-secondary)',
                                fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                                cursor: 'pointer', transition: 'all 0.15s',
                              }}>
                              <Icon name={t.icon === 'sparkles' ? 'star' : t.icon} size={14} />
                              {t.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Photo */}
                <div className="card" style={{ padding: 18 }}>
                  <SectionHeader
                    icon="upload"
                    title="Photo"
                    sub="Upload a clear photo of the patient"
                  />
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 18, padding: '18px 20px',
                    border: '1.5px dashed #BFDBFE', borderRadius: 12,
                    background: '#F8FBFF',
                  }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%',
                      background: '#EBF2FF', border: '1px solid #DBE7F8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon name="upload" size={22} style={{ color: '#1E4FA3' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)' }}>
                        Drag and drop or <span style={{ color: '#1E4FA3', textDecoration: 'underline', cursor: 'pointer' }}>upload photo</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 4 }}>
                        JPG, PNG up to 2 MB · Square image recommended
                      </div>
                    </div>
                    <button
                      type="button"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '10px 18px', borderRadius: 10,
                        background: '#FFFFFF', border: '1.5px solid #BFDBFE',
                        color: '#1E4FA3', fontSize: 13.5, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                      }}>
                      <Icon name="upload" size={14} /> Upload Photo
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Patient Preview sidebar (re-used) ────────────── */}
              <PatientPreviewSidebar
                av={av} name={name} age={age} gender={gender} bg={bg}
                ptag={ptag} allergies={allergies} conditions={conditions}
                mobile={mobile} email={email} insurer={insurer} policy={policy}
                isEdit={isEdit} id={id}
                street={watch('street')} city={watch('city')} state={watch('state')} pin={watch('pin')}
                emgName={watch('emgName')} emgRel={watch('emgRel')} emgPhone={watch('emgPhone')}
              />

            </div>
          )}

          {/* Tip banner at the bottom of the Profile tab */}
          {tab === 0 && (
            <div style={{
              marginTop: 10, padding: '10px 14px', borderRadius: 12,
              background: '#EFF6FF', border: '1px solid #BFDBFE',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#FFFFFF', border: '1px solid #DBE7F8',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                💡
              </span>
              <div style={{ fontSize: 13, color: 'var(--fg-primary)' }}>
                <b style={{ color: '#1E4FA3', marginRight: 4 }}>Tip:</b>
                Please ensure all details are accurate for better patient care and communication.
              </div>
            </div>
          )}

          {/* ─── Contact & ID ─── */}
          {tab === 1 && (
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>

              {/* Form column */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* Contact details */}
                <div className="card" style={{ padding: 18 }}>
                  <SectionHeader
                    icon="phone"
                    title="CONTACT DETAILS"
                    sub="Primary contact information"
                  />
                  <div className="grid-2" style={{ rowGap: 12 }}>
                    {/* Mobile (with +91 select prefix) */}
                    <div className="form-group">
                      <FormLabel required>Mobile</FormLabel>
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        border: '1.5px solid var(--border-soft)',
                        background: 'var(--bg-input, #F8FAFC)',
                        borderRadius: 10, overflow: 'hidden', height: 44,
                      }}>
                        <span style={{
                          padding: '0 10px 0 12px', fontSize: 13.5, fontWeight: 700,
                          color: 'var(--fg-secondary)',
                          borderRight: '1px solid var(--border-light)',
                          display: 'flex', alignItems: 'center', gap: 4, alignSelf: 'stretch',
                        }}>
                          +91
                          <Icon name="chevD" size={12} />
                        </span>
                        <input
                          className="form-input"
                          inputMode="numeric"
                          placeholder="98765 43210"
                          style={{ flex: 1, border: 'none', background: 'transparent', borderRadius: 0 }}
                          {...register('mobile', { required: 'Mobile is required' })}
                        />
                      </div>
                      {errors.mobile && <span className="form-error">{errors.mobile.message}</span>}
                    </div>

                    {/* Alternate phone */}
                    <div className="form-group">
                      <FormLabel>Alternate phone</FormLabel>
                      <IconInput icon="phone">
                        <input
                          className="form-input"
                          placeholder="Alternate number"
                          style={{ paddingLeft: 38 }}
                          {...register('altPhone')}
                        />
                      </IconInput>
                    </div>

                    {/* Email (full width) */}
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <FormLabel>Email</FormLabel>
                      <IconInput icon="mail">
                        <input
                          className="form-input"
                          type="email"
                          placeholder="patient@email.com"
                          style={{ paddingLeft: 38 }}
                          {...register('email')}
                        />
                      </IconInput>
                    </div>

                    {/* Street address (full width, first) */}
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <FormLabel>Street address</FormLabel>
                      <IconInput icon="building">
                        <input
                          className="form-input"
                          placeholder="House / street"
                          style={{ paddingLeft: 38 }}
                          {...register('street')}
                        />
                      </IconInput>
                    </div>

                    {/* PIN + City + State (3-column row) */}
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1fr 1fr', gap: 10 }}>
                        <div>
                          <FormLabel>PIN code</FormLabel>
                          <IconInput icon="edit">
                            <input
                              className="form-input"
                              inputMode="numeric"
                              maxLength={6}
                              placeholder="6-digit PIN"
                              style={{ paddingLeft: 38 }}
                              {...register('pin')}
                            />
                          </IconInput>
                          {pinLookup.status !== 'idle' && (
                            <div style={{
                              marginTop: 4, fontSize: 11.5, fontWeight: 600,
                              color: pinLookup.status === 'error' ? '#B91C1C'
                                   : pinLookup.status === 'success' ? '#15803D'
                                   : 'var(--fg-muted)',
                            }}>
                              {pinLookup.status === 'loading' ? 'Looking up…'
                                : pinLookup.status === 'success' ? `✓ ${pinLookup.message}`
                                : pinLookup.message}
                            </div>
                          )}
                        </div>
                        <div>
                          <FormLabel>City</FormLabel>
                          <IconInput icon="building">
                            <input
                              className="form-input"
                              placeholder="City"
                              style={{ paddingLeft: 38 }}
                              {...register('city')}
                            />
                          </IconInput>
                        </div>
                        <div>
                          <FormLabel>State</FormLabel>
                          <IconInput icon="flag">
                            <input
                              className="form-input"
                              placeholder="State"
                              style={{ paddingLeft: 38 }}
                              {...register('state')}
                            />
                          </IconInput>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emergency contact */}
                <div className="card" style={{ padding: 18 }}>
                  <SectionHeader
                    icon="users"
                    title="EMERGENCY CONTACT"
                    sub="Who to reach in a crisis"
                  />
                  <div className="grid-2" style={{ rowGap: 12 }}>
                    <div className="form-group">
                      <FormLabel>Name</FormLabel>
                      <IconInput icon="user">
                        <input
                          className="form-input"
                          placeholder="Contact name"
                          style={{ paddingLeft: 38 }}
                          {...register('emgName')}
                        />
                      </IconInput>
                    </div>
                    <div className="form-group">
                      <FormLabel>Relation</FormLabel>
                      {/* Register the field so RHF tracks it; combobox below drives the value. */}
                      <input type="hidden" {...register('emgRel')} />
                      <RelationCombobox
                        value={watch('emgRel') || ''}
                        onChange={(v) => setValue('emgRel', v, { shouldDirty: true })}
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <FormLabel>Phone</FormLabel>
                      <IconInput icon="phone">
                        <input
                          className="form-input"
                          placeholder="+91 98765 43210"
                          style={{ paddingLeft: 38 }}
                          {...register('emgPhone')}
                        />
                      </IconInput>
                    </div>
                  </div>
                </div>

                {/* Government ID */}
                <div className="card" style={{ padding: 18 }}>
                  <SectionHeader
                    icon="card"
                    title="GOVERNMENT ID"
                    sub="Official identification"
                  />
                  <div className="grid-2" style={{ rowGap: 12 }}>
                    <div className="form-group">
                      <FormLabel>ID type</FormLabel>
                      <IconInput icon="shield">
                        <select className="form-select" style={{ paddingLeft: 38 }} {...register('govType')}>
                          {GOV_IDS.map(g => <option key={g}>{g}</option>)}
                        </select>
                      </IconInput>
                    </div>
                    <div className="form-group">
                      <FormLabel>ID number</FormLabel>
                      <IconInput icon="card">
                        <input
                          className="form-input"
                          placeholder="XXXX XXXX 1234"
                          style={{ paddingLeft: 38 }}
                          {...register('govNum')}
                        />
                      </IconInput>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Patient Preview sidebar (re-used) ────────────── */}
              <PatientPreviewSidebar
                av={av} name={name} age={age} gender={gender} bg={bg}
                ptag={ptag} allergies={allergies} conditions={conditions}
                mobile={mobile} email={email} insurer={insurer} policy={policy}
                isEdit={isEdit} id={id}
                street={watch('street')} city={watch('city')} state={watch('state')} pin={watch('pin')}
                emgName={watch('emgName')} emgRel={watch('emgRel')} emgPhone={watch('emgPhone')}
              />
            </div>
          )}

          {/* ─── Medical history ─── */}
          {tab === 2 && (
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* Allergies */}
                <div className="card" style={{ padding: 18 }}>
                  <SectionHeader
                    icon="droplet"
                    title="ALLERGIES"
                    sub="Search and add drug or environmental allergies"
                  />
                  <SearchableMultiSelect
                    options={ALLERGIES}
                    selected={allergies}
                    onChange={setAllergies}
                    placeholder="Search allergies — e.g. Penicillin, Peanuts…"
                  />
                </div>

                {/* Chronic conditions */}
                <div className="card" style={{ padding: 18 }}>
                  <SectionHeader
                    icon="heart"
                    title="CHRONIC CONDITIONS"
                    sub="Search and add existing chronic conditions"
                  />
                  <SearchableMultiSelect
                    options={CONDITIONS}
                    selected={conditions}
                    onChange={setConditions}
                    placeholder="Search conditions — e.g. Diabetes, Asthma…"
                  />
                </div>

                {/* Medical records */}
                <div className="card" style={{ padding: 18 }}>
                  <SectionHeader
                    icon="folder"
                    title="MEDICAL RECORDS"
                    sub="Add health related information"
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <IconTextarea
                      icon="pill"
                      label="Current medications"
                      placeholder="List medications and dosage…"
                      value={watch('meds') || ''}
                      register={register('meds')}
                    />
                    <IconTextarea
                      icon="scissors"
                      label="Past surgeries"
                      placeholder="Surgical history…"
                      value={watch('surgeries') || ''}
                      register={register('surgeries')}
                    />
                    <IconTextarea
                      icon="clipboard"
                      label="Internal notes"
                      placeholder="Notes visible only to staff…"
                      value={watch('medNotes') || ''}
                      register={register('medNotes')}
                    />
                  </div>
                </div>

              </div>

              <PatientPreviewSidebar
                av={av} name={name} age={age} gender={gender} bg={bg}
                ptag={ptag} allergies={allergies} conditions={conditions}
                mobile={mobile} email={email} insurer={insurer} policy={policy}
                isEdit={isEdit} id={id}
                street={watch('street')} city={watch('city')} state={watch('state')} pin={watch('pin')}
                emgName={watch('emgName')} emgRel={watch('emgRel')} emgPhone={watch('emgPhone')}
              />
            </div>
          )}

        </fieldset>

      </div>
    </form>
  )
}
