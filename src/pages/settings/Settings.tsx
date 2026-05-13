import { useState } from 'react'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'

type SettingsTab =
  | 'clinic'
  | 'hours'
  | 'notifications'
  | 'billing'
  | 'security'
  | 'terms'
  | 'privacy'

const TABS: { key: SettingsTab; label: string; icon: string }[] = [
  { key: 'clinic',        label: 'Clinic profile',    icon: 'building'  },
  { key: 'hours',         label: 'Working hours',     icon: 'clock'     },
  { key: 'notifications', label: 'Notifications',     icon: 'bell'      },
  { key: 'billing',       label: 'Billing & taxes',   icon: 'receipt'   },
  { key: 'security',      label: 'Security & access', icon: 'shield'    },
  { key: 'terms',         label: 'Terms & Conditions',icon: 'clipboard' },
  { key: 'privacy',       label: 'Privacy Policy',    icon: 'lock'      },
]

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

interface DayHours {
  active: boolean
  start: string
  end: string
}

interface NotifToggle {
  key: string
  title: string
  subtitle: string
}

const NOTIF_ROWS: NotifToggle[] = [
  { key: 'sms',     title: 'SMS to staff',   subtitle: 'Send appointment and queue updates via SMS to staff members.' },
  { key: 'email',   title: 'Email digest',   subtitle: 'Daily summary email with patient stats and billing overview.' },
  { key: 'browser', title: 'Browser push',   subtitle: 'Real-time browser notifications for new tokens and alerts.' },
  { key: 'queue',   title: 'Queue alerts',   subtitle: 'Alert when queue exceeds threshold or token wait > 30 min.' },
]

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        flexShrink: 0,
        width: 44,
        height: 24,
        borderRadius: 12,
        border: 'none',
        cursor: 'pointer',
        background: on ? 'var(--brand-gradient)' : 'var(--border-soft)',
        position: 'relative',
        transition: 'background 0.2s',
      }}
      aria-checked={on}
      role="switch"
    >
      <span style={{
        position: 'absolute',
        top: 2,
        left: on ? 22 : 2,
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

/* ── Clinic profile ─────────────────────────────────────────────────────── */
function ClinicProfileTab() {
  const [form, setForm] = useState({
    name: 'Sunshine Clinic',
    regno: 'KAR/MED/2014/00483',
    address: '12, 6th Main Rd, Koramangala 6th Block, Bengaluru, Karnataka 560095',
    phone: '+91 80 4567 1100',
    email: 'hello@sunshine.health',
    specialties: 'General Medicine, Cardiology, Dermatology',
    prefix: 'A',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Logo block */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
        <div className="av blue" style={{ width: 64, height: 64, fontSize: 22, borderRadius: 16 }}>SC</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-primary)' }}>Sunshine Clinic</div>
          <div style={{ fontSize: 12.5, color: 'var(--fg-secondary)', marginTop: 2 }}>Multi-specialty · Koramangala</div>
        </div>
        <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>
          <Icon name="upload" size={14} /> Replace logo
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="form-group">
            <label className="form-label">Clinic name</label>
            <input className="form-input" value={form.name} onChange={set('name')} />
          </div>
          <div className="form-group">
            <label className="form-label">Registration no.</label>
            <input className="form-input" value={form.regno} onChange={set('regno')} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Address</label>
            <textarea className="form-textarea" rows={2} value={form.address} onChange={set('address')} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={form.phone} onChange={set('phone')} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={form.email} onChange={set('email')} />
          </div>
          <div className="form-group">
            <label className="form-label">Specialties</label>
            <input className="form-input" value={form.specialties} onChange={set('specialties')} />
          </div>
          <div className="form-group">
            <label className="form-label">Token prefix</label>
            <input className="form-input" value={form.prefix} onChange={set('prefix')} maxLength={2} />
          </div>
        </div>
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary">
            <Icon name="check" size={14} /> Save changes
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Working hours ──────────────────────────────────────────────────────── */
function WorkingHoursTab() {
  const [hours, setHours] = useState<DayHours[]>([
    { active: true,  start: '09:00', end: '20:00' },
    { active: true,  start: '09:00', end: '20:00' },
    { active: true,  start: '09:00', end: '20:00' },
    { active: true,  start: '09:00', end: '20:00' },
    { active: true,  start: '09:00', end: '20:00' },
    { active: true,  start: '09:00', end: '18:00' },
    { active: false, start: '09:00', end: '14:00' },
  ])

  const update = (i: number, patch: Partial<DayHours>) =>
    setHours(h => h.map((d, idx) => idx === i ? { ...d, ...patch } : d))

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 18, color: 'var(--fg-primary)' }}>
          Weekly schedule
        </div>
        {DAYS.map((day, i) => (
          <div key={day} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '12px 0',
            borderBottom: i < DAYS.length - 1 ? '1px solid var(--border-light)' : 'none',
          }}>
            <div style={{ width: 96, fontSize: 13.5, fontWeight: 600, color: 'var(--fg-primary)' }}>{day}</div>
            <Toggle on={hours[i].active} onChange={v => update(i, { active: v })} />
            {hours[i].active ? (
              <>
                <input
                  type="time"
                  className="form-input"
                  style={{ width: 120 }}
                  value={hours[i].start}
                  onChange={e => update(i, { start: e.target.value })}
                />
                <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>to</span>
                <input
                  type="time"
                  className="form-input"
                  style={{ width: 120 }}
                  value={hours[i].end}
                  onChange={e => update(i, { end: e.target.value })}
                />
              </>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--fg-muted)', fontStyle: 'italic' }}>Closed</span>
            )}
          </div>
        ))}
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary">
            <Icon name="check" size={14} /> Save hours
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Notifications ──────────────────────────────────────────────────────── */
function NotificationsTab() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    sms: true, email: true, browser: false, queue: true,
  })

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 18, color: 'var(--fg-primary)' }}>
          Notification preferences
        </div>
        {NOTIF_ROWS.map((row, i) => (
          <div key={row.key} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '14px 0',
            borderBottom: i < NOTIF_ROWS.length - 1 ? '1px solid var(--border-light)' : 'none',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-primary)' }}>{row.title}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 3 }}>{row.subtitle}</div>
            </div>
            <Toggle
              on={toggles[row.key]}
              onChange={v => setToggles(t => ({ ...t, [row.key]: v }))}
            />
          </div>
        ))}
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary">
            <Icon name="check" size={14} /> Save preferences
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Billing & taxes ────────────────────────────────────────────────────── */
function BillingTab() {
  const [form, setForm] = useState({
    gstin: '29AABCS1429B1ZB',
    currency: 'INR',
    fee: '600',
    tax: '18',
    notes: 'All invoices include applicable GST. Consult fees are non-refundable unless cancelled 2h prior.',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 18, color: 'var(--fg-primary)' }}>Billing configuration</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="form-group">
            <label className="form-label">GSTIN</label>
            <input className="form-input" value={form.gstin} onChange={set('gstin')} />
          </div>
          <div className="form-group">
            <label className="form-label">Currency</label>
            <select className="form-select" value={form.currency} onChange={set('currency')}>
              <option>INR</option>
              <option>USD</option>
              <option>AED</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Default consult fee (₹)</label>
            <input className="form-input" type="number" value={form.fee} onChange={set('fee')} />
          </div>
          <div className="form-group">
            <label className="form-label">Tax %</label>
            <input className="form-input" type="number" value={form.tax} onChange={set('tax')} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Invoice notes</label>
            <textarea className="form-textarea" rows={3} value={form.notes} onChange={set('notes')} />
          </div>
        </div>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary">
            <Icon name="check" size={14} /> Save billing
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Security & access ──────────────────────────────────────────────────── */
function SecurityTab() {
  const [twoFa, setTwoFa] = useState(true)
  const sessions = [
    { browser: 'Chrome 124 · macOS',    ip: '103.12.45.68',  loc: 'Bengaluru, KA', last: 'Active now',   current: true  },
    { browser: 'Firefox 125 · Windows', ip: '122.172.8.211', loc: 'Mumbai, MH',    last: '2 days ago',   current: false },
    { browser: 'Safari · iOS 17',       ip: '49.37.201.44',  loc: 'Bengaluru, KA', last: '5 days ago',   current: false },
  ]
  const [pwd, setPwd] = useState({ cur: '', nxt: '', confirm: '' })

  return (
    <div style={{ maxWidth: 680 }}>
      {/* 2FA */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg-primary)' }}>Two-factor authentication</div>
            <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 2 }}>
              Add an extra layer of security with TOTP authenticator app.
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Toggle on={twoFa} onChange={setTwoFa} />
          </div>
        </div>
        {twoFa && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 20,
            padding: 16, borderRadius: 10,
            background: 'var(--bg-surface-alt)',
            border: '1px solid var(--border-soft)',
          }}>
            <div style={{
              width: 96, height: 96, borderRadius: 8,
              background: 'var(--border-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, color: 'var(--fg-muted)', textAlign: 'center',
            }}>
              QR code<br />(scan in app)
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)', marginBottom: 6 }}>
                Scan with Google Authenticator or Authy
              </div>
              <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>
                Secret: <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-surface)', padding: '1px 6px', borderRadius: 4 }}>JBSW Y3DP EHPK 3PXP</code>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: 10 }}>Regenerate</button>
            </div>
          </div>
        )}
      </div>

      {/* Sessions */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg-primary)', marginBottom: 16 }}>Active sessions</div>
        <table className="data">
          <thead>
            <tr>
              <th>Browser / Device</th>
              <th>IP address</th>
              <th>Location</th>
              <th>Last active</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s, i) => (
              <tr key={i}>
                <td>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>{s.browser}</div>
                  {s.current && (
                    <span className="badge success" style={{ marginTop: 2 }}>Current</span>
                  )}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{s.ip}</td>
                <td style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>{s.loc}</td>
                <td style={{ fontSize: 12.5, color: s.current ? 'var(--success)' : 'var(--fg-muted)' }}>{s.last}</td>
                <td>
                  {!s.current && (
                    <button className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)' }}>
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Change password */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg-primary)', marginBottom: 16 }}>Change password</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, maxWidth: 400 }}>
          <div className="form-group">
            <label className="form-label">Current password</label>
            <input className="form-input" type="password" value={pwd.cur} onChange={e => setPwd(p => ({ ...p, cur: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">New password</label>
            <input className="form-input" type="password" value={pwd.nxt} onChange={e => setPwd(p => ({ ...p, nxt: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm new password</label>
            <input className="form-input" type="password" value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} />
          </div>
        </div>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary">
            <Icon name="lock" size={14} /> Update password
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Terms & Conditions ─────────────────────────────────────────────────── */
function TermsTab() {
  const toc = [
    '1. Acceptance of terms',
    '2. Use of services',
    '3. Account responsibilities',
    '4. Appointments & bookings',
    '5. Payments & refunds',
    '6. Limitation of liability',
    '7. Termination',
    '8. Governing law',
  ]
  const ids = ['acceptance','use','account','appointments','payments','liability','termination','governing']

  return (
    <article className="legal-doc" style={{ maxWidth: 860 }}>
      {/* Meta strip */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
        {[
          { label: 'Version', val: '3.2' },
          { label: 'Effective', val: '1 May 2026' },
          { label: 'Jurisdiction', val: 'India · Karnataka' },
          { label: 'Accepted on', val: '4 May 2026', green: true },
        ].map(m => (
          <div key={m.label} style={{
            padding: '6px 14px', borderRadius: 8,
            background: 'var(--bg-surface-alt)',
            border: '1px solid var(--border-soft)',
            fontSize: 12.5,
          }}>
            <span style={{ color: 'var(--fg-muted)' }}>{m.label}: </span>
            <span style={{ fontWeight: 600, color: m.green ? 'var(--success)' : 'var(--fg-primary)' }}>{m.val}</span>
          </div>
        ))}
      </div>

      {/* TOC */}
      <div className="card" style={{ marginBottom: 28, padding: '16px 20px' }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--fg-primary)' }}>Table of contents</div>
        <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 32px' }}>
          {toc.map((t, i) => (
            <li key={i} style={{ fontSize: 13 }}>
              <a href={`#${ids[i]}`} style={{ color: 'var(--teal-600)', textDecoration: 'none' }}>{t}</a>
            </li>
          ))}
        </ol>
      </div>

      {/* Sections */}
      <section id="acceptance">
        <h3>1. Acceptance of terms</h3>
        <p>By accessing or using the NoQ Health platform ("Platform"), you ("Clinic", "User") agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you must immediately cease using the Platform. These Terms constitute a legally binding agreement between you and NoQ Health Pvt. Ltd. ("Company", "we", "us").</p>
        <p>The Company reserves the right to amend these Terms at any time with reasonable notice. Continued use of the Platform following the posting of revised Terms constitutes acceptance of those changes.</p>
      </section>

      <section id="use">
        <h3>2. Use of services</h3>
        <p>The Platform is provided exclusively for lawful healthcare administration purposes, including appointment scheduling, patient queue management, billing, and clinical record keeping. You agree not to use the Platform for any purpose that is unlawful, harmful, or contrary to these Terms.</p>
        <p>You may not reverse-engineer, copy, sublicense, or distribute any part of the Platform without prior written consent from the Company. The Company may suspend access immediately upon discovery of misuse.</p>
      </section>

      <section id="account">
        <h3>3. Account responsibilities</h3>
        <p>You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You must notify the Company immediately at <a href="mailto:security@noq.health" style={{ color: 'var(--teal-600)' }}>security@noq.health</a> upon becoming aware of any unauthorized use of your account.</p>
        <p>Accounts may only be used by the individual to whom they are assigned. Sharing credentials with unauthorized individuals is strictly prohibited and may result in account termination.</p>
      </section>

      <section id="appointments">
        <h3>4. Appointments & bookings</h3>
        <p>The Platform facilitates appointment bookings between clinics and patients. The clinic is solely responsible for confirming, rescheduling, or cancelling appointments and for ensuring that booked appointment slots reflect accurate availability.</p>
        <p>The Company is not a healthcare provider and does not provide medical advice. The relationship between the clinic and the patient is governed by applicable healthcare regulations and is the exclusive responsibility of the clinic.</p>
      </section>

      <section id="payments">
        <h3>5. Payments & refunds</h3>
        <p>Subscription fees for the Platform are billed in advance on a monthly or annual basis. All fees are exclusive of applicable taxes (including GST) unless otherwise stated. Invoices are issued electronically and are payable within 15 days of the invoice date.</p>
        <p>Refunds for unused subscription periods are not provided except as required by applicable law. In the event of a billing dispute, you must notify the Company within 30 days of the invoice date by emailing <a href="mailto:billing@noq.health" style={{ color: 'var(--teal-600)' }}>billing@noq.health</a>.</p>
      </section>

      <section id="liability">
        <h3>6. Limitation of liability</h3>
        <p>To the maximum extent permitted by applicable law, the Company shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of data, revenue, or business opportunities, arising out of or related to your use of the Platform.</p>
        <p>The Company's total liability to you for any claim arising from or related to these Terms or the Platform shall not exceed the fees paid by you to the Company in the three (3) months immediately preceding the event giving rise to the claim.</p>
      </section>

      <section id="termination">
        <h3>7. Termination</h3>
        <p>Either party may terminate the agreement with 30 days' written notice. The Company may suspend or terminate access immediately without notice in cases of material breach, fraudulent activity, or conduct harmful to other users or to the Company.</p>
        <p>Upon termination, you may request an export of your clinic data within 30 days. After this period the Company may permanently delete your data in accordance with its data retention policy.</p>
      </section>

      <section id="governing">
        <h3>8. Governing law</h3>
        <p>These Terms shall be governed by and construed in accordance with the laws of India, specifically the Information Technology Act 2000, the Digital Personal Data Protection Act 2023, and other applicable regulations. Any dispute arising under these Terms shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka, India.</p>
        <p>For any queries regarding these Terms, please contact us at <a href="mailto:legal@noq.health" style={{ color: 'var(--teal-600)' }}>legal@noq.health</a>.</p>
      </section>

      {/* Footer */}
      <div style={{ display: 'flex', gap: 12, marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border-light)' }}>
        <button className="btn btn-secondary">
          <Icon name="download" size={14} /> Download PDF
        </button>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }}>
          <Icon name="check" size={14} /> I accept
        </button>
      </div>
    </article>
  )
}

/* ── Privacy Policy ─────────────────────────────────────────────────────── */
function PrivacyTab() {
  const toc = [
    '1. Information we collect',
    '2. How we use information',
    '3. Sharing of information',
    '4. Data retention',
    '5. Your rights (GDPR & DPDPA)',
    '6. Security',
    '7. Cookies',
    '8. Contact us',
  ]
  const ids = ['collect','use','sharing','retention','rights','security','cookies','contact']

  return (
    <article className="legal-doc" style={{ maxWidth: 860 }}>
      {/* Meta strip */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
        {[
          { label: 'Version', val: '2.4' },
          { label: 'Effective', val: '1 May 2026' },
          { label: 'Data controller', val: 'NoQ Health Pvt. Ltd.' },
          { label: 'DPO', val: 'dpo@noq.health' },
        ].map(m => (
          <div key={m.label} style={{
            padding: '6px 14px', borderRadius: 8,
            background: 'var(--bg-surface-alt)',
            border: '1px solid var(--border-soft)',
            fontSize: 12.5,
          }}>
            <span style={{ color: 'var(--fg-muted)' }}>{m.label}: </span>
            <span style={{ fontWeight: 600, color: 'var(--fg-primary)' }}>{m.val}</span>
          </div>
        ))}
      </div>

      {/* TOC */}
      <div className="card" style={{ marginBottom: 28, padding: '16px 20px' }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--fg-primary)' }}>Table of contents</div>
        <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 32px' }}>
          {toc.map((t, i) => (
            <li key={i} style={{ fontSize: 13 }}>
              <a href={`#${ids[i]}`} style={{ color: 'var(--teal-600)', textDecoration: 'none' }}>{t}</a>
            </li>
          ))}
        </ol>
      </div>

      <section id="collect">
        <h3>1. Information we collect</h3>
        <p>We collect information you provide directly, including clinic name, registration details, staff profiles, and billing information. We also collect patient information entered into the platform on your behalf, including names, contact details, age, appointment history, and clinical notes.</p>
        <p>We automatically collect usage data, log files, device identifiers, IP addresses, and telemetry data to maintain and improve the Platform.</p>
      </section>

      <section id="use">
        <h3>2. How we use information</h3>
        <p>We use collected information to provide, maintain, and improve the Platform; process transactions and send related information; send administrative messages and platform updates; respond to comments and questions; and monitor usage patterns to enhance user experience.</p>
        <p>We do not sell or rent personal data to third parties. We do not use patient data for any purpose other than to provide the Platform services your clinic has contracted.</p>
      </section>

      <section id="sharing">
        <h3>3. Sharing of information</h3>
        <p>We may share information with third-party service providers who perform services on our behalf, such as cloud hosting (AWS), payment processing (Razorpay), and SMS delivery (Twilio), subject to confidentiality agreements. All sub-processors are listed at <a href="https://noq.health/sub-processors" style={{ color: 'var(--teal-600)' }}>noq.health/sub-processors</a>.</p>
        <p>We may disclose information to comply with applicable law, regulation, legal process, or governmental request, or to protect the rights, property, or safety of the Company, our users, or others.</p>
      </section>

      <section id="retention">
        <h3>4. Data retention</h3>
        <p>We retain your clinic data for the duration of your subscription and for 30 days after termination, after which it is permanently deleted unless a longer retention period is required by applicable law. Patient health records may be subject to mandatory retention periods under applicable healthcare regulations.</p>
        <p>Backup copies may be retained for up to 90 days for disaster recovery purposes before being securely destroyed.</p>
      </section>

      <section id="rights">
        <h3>5. Your rights (GDPR & DPDPA)</h3>
        <p>Under the Digital Personal Data Protection Act 2023 (DPDPA) and, where applicable, the EU General Data Protection Regulation (GDPR), you have the following rights:</p>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li><strong>Right of access</strong> — request a copy of personal data we hold about you.</li>
          <li><strong>Right to correction</strong> — request that inaccurate or incomplete data be rectified.</li>
          <li><strong>Right to erasure</strong> — request deletion of personal data ("right to be forgotten").</li>
          <li><strong>Right to restrict processing</strong> — request that we limit how we use your data.</li>
          <li><strong>Right to data portability</strong> — receive your data in a machine-readable format.</li>
          <li><strong>Right to object</strong> — object to processing based on legitimate interests or for direct marketing.</li>
          <li><strong>Right to withdraw consent</strong> — withdraw consent at any time where processing is consent-based.</li>
        </ul>
        <p>To exercise any of these rights, contact our Data Protection Officer at <a href="mailto:dpo@noq.health" style={{ color: 'var(--teal-600)' }}>dpo@noq.health</a>.</p>
      </section>

      <section id="security">
        <h3>6. Security</h3>
        <p>We implement industry-standard technical and organisational measures to protect your data, including AES-256 encryption at rest, TLS 1.3 in transit, role-based access controls, regular penetration testing, and SOC 2 Type II audit compliance.</p>
        <p>Despite our best efforts, no security measure is perfect. In the event of a data breach affecting your personal data, we will notify affected parties in accordance with applicable law, no later than 72 hours after becoming aware of the breach.</p>
      </section>

      <section id="cookies">
        <h3>7. Cookies</h3>
        <p>The Platform uses strictly necessary cookies for authentication and session management. We also use analytics cookies (first-party only) to understand how users interact with the Platform. We do not use third-party advertising cookies.</p>
        <p>You can configure your browser to refuse cookies; however, doing so may affect the functionality of the Platform. A full cookies notice is available at <a href="https://noq.health/cookies" style={{ color: 'var(--teal-600)' }}>noq.health/cookies</a>.</p>
      </section>

      <section id="contact">
        <h3>8. Contact us</h3>
        <p>For any privacy-related enquiries, to exercise your rights, or to raise a concern, please contact our Data Protection Officer:</p>
        <p>
          <strong>NoQ Health Pvt. Ltd.</strong><br />
          12, 6th Main Rd, Koramangala 6th Block, Bengaluru 560095, India<br />
          Email: <a href="mailto:dpo@noq.health" style={{ color: 'var(--teal-600)' }}>dpo@noq.health</a><br />
          Phone: +91 80 4567 9900
        </p>
        <p>You also have the right to lodge a complaint with the Data Protection Board of India if you believe we have not adequately addressed your concern.</p>
      </section>

      {/* Footer */}
      <div style={{ display: 'flex', gap: 12, marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border-light)', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary">
          <Icon name="download" size={14} /> Download PDF
        </button>
        <button className="btn btn-secondary">
          <Icon name="user" size={14} /> Request my data
        </button>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }}>
          <Icon name="check" size={14} /> Acknowledge
        </button>
      </div>
    </article>
  )
}

/* ── Settings page ──────────────────────────────────────────────────────── */
export default function Settings() {
  const [tab, setTab] = useState<SettingsTab>('clinic')

  const content: Record<SettingsTab, React.ReactNode> = {
    clinic:        <ClinicProfileTab />,
    hours:         <WorkingHoursTab />,
    notifications: <NotificationsTab />,
    billing:       <BillingTab />,
    security:      <SecurityTab />,
    terms:         <TermsTab />,
    privacy:       <PrivacyTab />,
  }

  return (
    <>
      <Header title="Settings" crumbs="Account · Settings" />
      <div className="main">
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {/* Sidebar */}
          <nav style={{
            width: 220, flexShrink: 0, background: 'var(--bg-surface)',
            borderRadius: 14, border: '1px solid var(--border-soft)',
            padding: '8px 0', boxShadow: 'var(--shadow-sm)',
          }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px', border: 'none', cursor: 'pointer', textAlign: 'left',
                  fontSize: 13.5, fontWeight: tab === t.key ? 700 : 500,
                  color: tab === t.key ? 'var(--brand-primary)' : 'var(--fg-secondary)',
                  background: tab === t.key ? 'var(--brand-soft)' : 'transparent',
                  borderLeft: tab === t.key ? '3px solid var(--brand-primary)' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <Icon name={t.icon} size={15} />
                {t.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {content[tab]}
          </div>
        </div>
      </div>
    </>
  )
}
