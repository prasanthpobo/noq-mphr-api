import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useConsentStore, SCOPE_LABELS } from '@/stores/consentStore'
import type { ScopeKey, ConsentItem, AccessEvent } from '@/stores/consentStore'

const BRAND_GRADIENT = 'linear-gradient(135deg, #1E4FA3 0%, #2C6ED5 50%, #1FA3A8 100%)'

// ─── Mock data has moved to stores/consentStore.ts ────────────────────────


// ─── Page ─────────────────────────────────────────────────────────────────

type Tab = 'pending' | 'active' | 'history'

interface ConfirmConfig {
  title: string
  message: string
  confirmLabel: string
  tone: 'danger' | 'primary'
  onConfirm: () => void
}

export function Consent() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('pending')
  const items = useConsentStore((s) => s.items)
  const storeCancel       = useConsentStore((s) => s.cancelRequest)
  const storeRevoke       = useConsentStore((s) => s.revokeAccess)
  const storeResend       = useConsentStore((s) => s.resend)
  const storeUpdateScopes = useConsentStore((s) => s.updateScopes)

  // Detail sheet + confirmation modal state
  const [detailId, setDetailId] = useState<string | null>(null)
  const [confirm, setConfirm]   = useState<ConfirmConfig | null>(null)

  const detailItem = items.find((i) => i.id === detailId) ?? null

  const pending = items.filter((i) => i.status === 'pending')
  const active  = items.filter((i) => i.status === 'active')
  const history = useMemo(
    () => items.filter((i) => i.status !== 'pending' && i.status !== 'active')
      .sort((a, b) => (b.respondedOn ?? b.requestedOn).localeCompare(a.respondedOn ?? a.requestedOn)),
    [items],
  )

  const cancelRequest = (id: string) => { storeCancel(id);            setDetailId(null) }
  const revokeAccess  = (id: string) => { storeRevoke(id);            setDetailId(null); setTab('history') }
  const resend        = (id: string) => { storeResend(id) }
  const updateScopes  = (id: string, next: ScopeKey[]) => { storeUpdateScopes(id, next) }

  // Dialog helpers — buttons hand work off to these instead of mutating directly.
  const confirmCancel = (item: ConsentItem) => setConfirm({
    title:        'Cancel consent request?',
    message:      `Withdraw the access request sent to ${item.patientName}. They won't see this request anymore.`,
    confirmLabel: 'Yes, cancel',
    tone:         'danger',
    onConfirm:    () => cancelRequest(item.id),
  })

  const confirmRevoke = (item: ConsentItem) => setConfirm({
    title:        'Revoke patient access?',
    message:      `You will lose access to ${item.patientName}'s records covered by this consent. This action is logged for DPDP compliance.`,
    confirmLabel: 'Yes, revoke',
    tone:         'danger',
    onConfirm:    () => revokeAccess(item.id),
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '100%', background: '#F5F8FC', paddingBottom: 100 }}>
      {/* Hero */}
      <div style={{
        background: BRAND_GRADIENT, padding: '52px 20px 22px',
        position: 'relative', overflow: 'hidden', borderRadius: '0 0 28px 28px',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} aria-label="Back" style={iconChip}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 700, margin: 0 }}>Patient access</p>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: '4px 0 0' }}>Consent Requests</h1>
          </div>
          <button onClick={() => navigate('/consent/new')} aria-label="Request access" style={iconChip}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
        </div>

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', margin: '12px 0 0', lineHeight: 1.5 }}>
          Request, review, and revoke access to your patients' records — all consent activity is logged for DPDP compliance.
        </p>

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <HeroStat value={pending.length} label="PENDING" />
          <HeroStat value={active.length}  label="ACTIVE" />
          <HeroStat value={history.length} label="CLOSED" />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '14px 16px 0', overflowX: 'auto' }}>
        {(['pending', 'active', 'history'] as Tab[]).map((t) => {
          const isActive = tab === t
          const label = t === 'pending' ? `Pending · ${pending.length}` : t === 'active' ? `Active · ${active.length}` : `History · ${history.length}`
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              flexShrink: 0, padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: isActive ? BRAND_GRADIENT : '#FFFFFF',
              color: isActive ? '#FFFFFF' : '#475569',
              fontSize: 12, fontWeight: 700,
              boxShadow: '0 2px 6px rgba(30,79,163,0.06)',
              fontFamily: 'inherit',
            }}>{label}</button>
          )
        })}
      </div>

      {/* Tab body */}
      <div style={{ padding: '14px 16px' }}>
        {tab === 'pending' && (
          pending.length === 0 ? <Empty title="No pending requests" hint="Ask a patient for access via the + button." /> :
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pending.map((c) => (
              <PendingCard
                key={c.id}
                item={c}
                onOpen={() => setDetailId(c.id)}
                onCancel={() => confirmCancel(c)}
                onResend={() => resend(c.id)}
              />
            ))}
          </div>
        )}

        {tab === 'active' && (
          active.length === 0 ? <Empty title="No active access" hint="Patients you have access to will appear here." /> :
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {active.map((c) => (
              <ActiveCard
                key={c.id}
                item={c}
                onOpen={() => setDetailId(c.id)}
                onRevoke={() => confirmRevoke(c)}
              />
            ))}
          </div>
        )}

        {tab === 'history' && (
          history.length === 0 ? <Empty title="No history yet" hint="Closed consents appear here." /> :
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {history.map((c, i) => <HistoryRow key={c.id} item={c} isLast={i === history.length - 1} />)}
          </div>
        )}
      </div>

      {detailItem && (
        <DetailSheet
          item={detailItem}
          onClose={() => setDetailId(null)}
          onCancel={() => confirmCancel(detailItem)}
          onResend={() => resend(detailItem.id)}
          onRevoke={() => confirmRevoke(detailItem)}
          onOpenRecords={() => { setDetailId(null); navigate('/patients') }}
          onSaveScopes={(next, removed) => {
            // Pending: apply silently — patient hasn't responded yet.
            // Active: removing scopes is a partial revoke — confirm first.
            if (detailItem.status === 'active' && removed.length > 0) {
              setConfirm({
                title: 'Remove access to these scopes?',
                message: `You will lose access to: ${removed.map((s) => SCOPE_LABELS[s]).join(', ')}. ${detailItem.patientName} will be notified and this change is logged for DPDP compliance.`,
                confirmLabel: 'Yes, remove',
                tone: 'danger',
                onConfirm: () => updateScopes(detailItem.id, next),
              })
            } else {
              updateScopes(detailItem.id, next)
            }
          }}
        />
      )}

      {confirm && (
        <ConfirmDialog
          {...confirm}
          onCancel={() => setConfirm(null)}
          onConfirm={() => { confirm.onConfirm(); setConfirm(null) }}
        />
      )}

    </motion.div>
  )
}

// ─── Pending card ─────────────────────────────────────────────────────────

function PendingCard({
  item, onOpen, onCancel, onResend,
}: {
  item: ConsentItem; onOpen: () => void; onCancel: () => void; onResend: () => void
}) {
  return (
    <div style={cardStyle}>
      <button onClick={onOpen} style={{ all: 'unset', display: 'block', width: '100%', cursor: 'pointer' }}>
        <Header item={item} statusTone="warn" statusLabel="● Awaiting patient" />
        <ScopeChips scopes={item.scopes} />
        <Footer item={item} />
      </button>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={onCancel} style={dangerBtn}>Cancel request</button>
        <button onClick={onResend} style={secondaryBtn}>Resend ↩</button>
      </div>
    </div>
  )
}

// ─── Active card ──────────────────────────────────────────────────────────

function ActiveCard({
  item, onOpen, onRevoke,
}: {
  item: ConsentItem; onOpen: () => void; onRevoke: () => void
}) {
  const expiresSoon = item.expiresOn && daysUntil(item.expiresOn) <= 30
  const lastAccess  = item.auditLog && item.auditLog.length > 0 ? item.auditLog[0] : null
  return (
    <div style={cardStyle}>
      <button onClick={onOpen} style={{ all: 'unset', display: 'block', width: '100%', cursor: 'pointer' }}>
        <Header item={item} statusTone="ok" statusLabel="● Active" />
        <ScopeChips scopes={item.scopes} />
        <Footer item={item} />

        {lastAccess && (
          <p style={{ fontSize: 11, color: '#64748B', margin: '8px 0 0' }}>
            Last access · {SCOPE_LABELS[lastAccess.scope]} {actionVerb(lastAccess.action)} {timeAgo(lastAccess.at)}
          </p>
        )}

        {expiresSoon && (
          <div style={{ marginTop: 10, padding: '8px 10px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, fontSize: 11, color: '#92400E', fontWeight: 600 }}>
            ⚠ Expires in {daysUntil(item.expiresOn!)} day{daysUntil(item.expiresOn!) === 1 ? '' : 's'} — consider renewing.
          </div>
        )}
      </button>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={onOpen} style={primaryBtn}>Open details</button>
        <button onClick={onRevoke} style={dangerBtn}>Revoke</button>
      </div>
    </div>
  )
}

// ─── History row ──────────────────────────────────────────────────────────

function HistoryRow({ item, isLast }: { item: ConsentItem; isLast: boolean }) {
  const meta = actionMeta(item.status)
  return (
    <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
      <div style={{ width: 28, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: meta.bg, color: meta.fg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `2px solid ${meta.fg}`,
        }}>
          {meta.icon}
        </div>
        {!isLast && <div style={{ width: 2, flex: 1, background: '#E2E8F0', marginTop: 2 }} />}
      </div>

      <div style={{ flex: 1, background: '#FFFFFF', borderRadius: 14, padding: 12, boxShadow: '0 2px 8px rgba(30,79,163,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: 0 }}>{item.patientName}</p>
          <span style={statusPill(item.status)}>{meta.label}</span>
        </div>
        <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>
          {formatDate(item.respondedOn ?? item.requestedOn)} · {item.purpose}
        </p>
        <ScopeChips scopes={item.scopes} compact />
      </div>
    </div>
  )
}

// ─── Request access wizard moved to /consent/new (ConsentNew page) ───────



// ─── Shared bits ──────────────────────────────────────────────────────────

const iconChip: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 12,
  background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}
const cardStyle: React.CSSProperties = {
  background: '#FFFFFF', borderRadius: 16, padding: 14,
  boxShadow: '0 2px 8px rgba(30,79,163,0.06)',
}
const primaryBtn: React.CSSProperties = {
  flex: 1, padding: '10px 14px', borderRadius: 12, background: BRAND_GRADIENT, color: '#FFFFFF',
  border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
}
const secondaryBtn: React.CSSProperties = {
  flex: 1, padding: '10px 14px', borderRadius: 12, background: '#FFFFFF', color: '#1E4FA3',
  border: '1.5px solid #DBE7F8', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
}
const dangerBtn: React.CSSProperties = {
  flex: 1, padding: '10px 14px', borderRadius: 12, background: '#FEE2E2', color: '#B91C1C',
  border: '1.5px solid #FCA5A5', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ flex: 1, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 14, padding: '10px 8px', textAlign: 'center' }}>
      <p style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', margin: 0, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.8px', margin: '6px 0 0' }}>{label}</p>
    </div>
  )
}

function Header({ item, statusTone, statusLabel }: { item: ConsentItem; statusTone: 'ok' | 'warn' | 'danger'; statusLabel: string }) {
  const initials = item.patientName.split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
  const ageGender = item.patientAge != null && item.patientGender ? `${item.patientAge}${item.patientGender}` : ''
  const tone = statusTone === 'ok' ? { fg: '#059669', bg: '#D1FAE5' }
            : statusTone === 'warn' ? { fg: '#D97706', bg: '#FEF3C7' }
            : { fg: '#DC2626', bg: '#FEE2E2' }
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#1E4FA3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.5px' }}>{initials}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: 0 }}>
          {item.patientName}
          {ageGender && <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginLeft: 6 }}>{ageGender}</span>}
        </p>
        <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0' }}>📞 {item.patientPhone}</p>
      </div>
      <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 800, color: tone.fg, background: tone.bg, borderRadius: 999, padding: '4px 9px', letterSpacing: '0.3px' }}>
        {statusLabel}
      </span>
    </div>
  )
}

function ScopeChips({ scopes, compact }: { scopes: ScopeKey[]; compact?: boolean }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: compact ? 8 : 12 }}>
      {scopes.map((s) => (
        <span key={s} style={{
          fontSize: compact ? 9 : 10, fontWeight: 700, color: '#1E4FA3',
          background: '#EBF2FF', borderRadius: 999, padding: compact ? '3px 7px' : '4px 9px',
        }}>{SCOPE_LABELS[s]}</span>
      ))}
    </div>
  )
}

function Footer({ item }: { item: ConsentItem }) {
  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #E2E8F0', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <KV label="Purpose"   value={item.purpose} />
      <KV label="Requested" value={formatDate(item.requestedOn)} />
      {item.respondedOn && <KV label="Responded" value={formatDate(item.respondedOn)} />}
      {item.expiresOn   && <KV label="Expires"    value={formatDate(item.expiresOn)} />}
    </div>
  )
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12 }}>
      <span style={{ color: '#94A3B8', fontWeight: 600 }}>{label}</span>
      <span style={{ color: '#1E293B', fontWeight: 600, textAlign: 'right', maxWidth: '65%' }}>{value}</span>
    </div>
  )
}

function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 16px' }}>
      <p style={{ fontSize: 36, marginBottom: 8 }}>🛡️</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: 0 }}>{title}</p>
      <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0' }}>{hint}</p>
    </div>
  )
}

function statusPill(status: ConsentItem['status']): React.CSSProperties {
  const m = actionMeta(status)
  return {
    fontSize: 10, fontWeight: 800, letterSpacing: '0.4px',
    color: m.fg, background: m.bg, borderRadius: 999, padding: '3px 9px',
  }
}

function actionMeta(status: ConsentItem['status']) {
  switch (status) {
    case 'pending':   return { label: 'PENDING',   fg: '#D97706', bg: '#FEF3C7', icon: '⌛' }
    case 'active':    return { label: 'ACTIVE',    fg: '#059669', bg: '#D1FAE5', icon: '✓' }
    case 'denied':    return { label: 'DENIED',    fg: '#92400E', bg: '#FEF3C7', icon: '✕' }
    case 'withdrawn': return { label: 'WITHDRAWN', fg: '#DC2626', bg: '#FEE2E2', icon: '⛔' }
    case 'expired':   return { label: 'EXPIRED',   fg: '#475569', bg: '#E2E8F0', icon: '⏰' }
  }
}

// ─── Detail sheet ─────────────────────────────────────────────────────────

function DetailSheet({
  item, onClose, onCancel, onResend, onRevoke, onOpenRecords, onSaveScopes,
}: {
  item: ConsentItem
  onClose: () => void
  onCancel: () => void
  onResend: () => void
  onRevoke: () => void
  onOpenRecords: () => void
  onSaveScopes: (next: ScopeKey[], removed: ScopeKey[]) => void
}) {
  const meta = actionMeta(item.status)
  const editable = item.status === 'pending' || item.status === 'active'
  const allKeys = Object.keys(SCOPE_LABELS) as ScopeKey[]

  const [draftScopes, setDraftScopes] = useState<ScopeKey[]>(item.scopes)
  const dirty = !sameSet(draftScopes, item.scopes)
  const removed = item.scopes.filter((s) => !draftScopes.includes(s))
  const added   = draftScopes.filter((s) => !item.scopes.includes(s))
  const allOn   = draftScopes.length === allKeys.length

  const toggle = (k: ScopeKey) => {
    setDraftScopes((curr) => curr.includes(k) ? curr.filter((x) => x !== k) : [...curr, k])
  }
  const selectAll = () => setDraftScopes(allKeys)
  const clearAll  = () => setDraftScopes([])
  const reset     = () => setDraftScopes(item.scopes)
  return (
    <div onClick={onClose} style={overlayStyle}>
      <motion.div onClick={(e) => e.stopPropagation()}
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{
          width: '100%', maxWidth: 430, background: '#FFFFFF',
          borderRadius: '28px 28px 0 0', padding: '14px 0 24px',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.18)',
          maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E3EAF2', margin: '0 auto 8px' }} />

        <div style={{ overflowY: 'auto', padding: '8px 20px 0' }}>
          {/* Title strip */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, color: '#1E4FA3', letterSpacing: '0.6px', margin: 0, textTransform: 'uppercase' }}>Consent details</p>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1E293B', margin: '2px 0 0' }}>{item.patientName}</h2>
            </div>
            <span style={statusPill(item.status)}>{meta.label}</span>
          </div>

          {/* Identity card */}
          <div style={{ background: '#F8FAFC', borderRadius: 14, padding: 12, marginBottom: 14 }}>
            <KV label="Mobile"        value={item.patientPhone} />
            {item.patientAge != null && item.patientGender && (
              <KV label="Age / Gender" value={`${item.patientAge} · ${item.patientGender === 'M' ? 'Male' : item.patientGender === 'F' ? 'Female' : 'Other'}`} />
            )}
            <KV label="Purpose"       value={item.purpose} />
          </div>

          {/* Timeline strip */}
          <p style={detailLabel}>Lifecycle</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            <TimelineDot label="Requested"  date={item.requestedOn} active />
            <TimelineDot label="Responded"  date={item.respondedOn} active={!!item.respondedOn} />
            <TimelineDot label={item.status === 'expired' ? 'Expired' : 'Expires'} date={item.expiresOn} active={!!item.expiresOn} muted={!item.expiresOn} />
          </div>

          {/* Scopes detail — editable checklist for Pending / Active, read-only for closed states */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ ...detailLabel, margin: 0 }}>Granted scopes</p>
            <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
              {draftScopes.length} of {allKeys.length}
            </span>
          </div>

          {editable && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <button onClick={selectAll}
                disabled={allOn}
                style={chipBtnStyle(allOn ? 'muted' : 'primary')}>
                ✓ Select all
              </button>
              <button onClick={clearAll}
                disabled={draftScopes.length === 0}
                style={chipBtnStyle(draftScopes.length === 0 ? 'muted' : 'danger')}>
                ✕ Clear all
              </button>
              {dirty && (
                <button onClick={reset} style={chipBtnStyle('secondary')}>↺ Reset</button>
              )}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {allKeys.map((s) => {
              const on = draftScopes.includes(s)
              const wasOn = item.scopes.includes(s)
              const tone = !editable ? (wasOn ? 'on' : 'off')
                : on && !wasOn ? 'adding'
                : !on && wasOn ? 'removing'
                : on ? 'on' : 'off'
              return (
                <button key={s}
                  onClick={editable ? () => toggle(s) : undefined}
                  disabled={!editable}
                  style={{
                    all: 'unset',
                    cursor: editable ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', gap: 10,
                    borderRadius: 10, padding: '10px 12px',
                    background:
                      tone === 'adding'   ? '#ECFDF5' :
                      tone === 'removing' ? '#FEF2F2' :
                      tone === 'on'       ? '#EFF6FF' :
                                            '#F8FAFC',
                    border:
                      tone === 'adding'   ? '1px solid #A7F3D0' :
                      tone === 'removing' ? '1px solid #FECACA' :
                      tone === 'on'       ? '1px solid #BFDBFE' :
                                            '1px solid #E2E8F0',
                  }}>
                  {/* Checkbox */}
                  <span style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: on ? '#1E4FA3' : '#FFFFFF',
                    border: on ? '1.5px solid #1E4FA3' : '1.5px solid #CBD5E1',
                    color: '#FFFFFF',
                  }}>
                    {on && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>

                  <p style={{ flex: 1, fontSize: 13, color: '#1E293B', fontWeight: 600, margin: 0 }}>
                    {SCOPE_LABELS[s]}
                  </p>

                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.3px',
                    color:
                      tone === 'adding'   ? '#059669' :
                      tone === 'removing' ? '#DC2626' :
                      tone === 'on'       ? '#1E4FA3' :
                                            '#94A3B8',
                  }}>
                    {tone === 'adding' ? 'ADDING' : tone === 'removing' ? 'REMOVING' : tone === 'on' ? 'ENABLED' : 'OFF'}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Dirty-state save banner */}
          {editable && dirty && (
            <div style={{
              background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12,
              padding: '10px 12px', marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: 16 }}>✏️</span>
              <p style={{ flex: 1, fontSize: 12, color: '#1E40AF', margin: 0, minWidth: 0, lineHeight: 1.4 }}>
                {added.length > 0   && <>Adding <b>{added.length}</b></>}{added.length > 0 && removed.length > 0 && ' · '}
                {removed.length > 0 && <>Removing <b>{removed.length}</b></>}
                {' '}scope{(added.length + removed.length) === 1 ? '' : 's'}
              </p>
              <button onClick={reset} style={chipBtnStyle('secondary')}>Discard</button>
              <button onClick={() => onSaveScopes(draftScopes, removed)}
                disabled={draftScopes.length === 0}
                style={{
                  padding: '7px 14px', borderRadius: 999,
                  background: draftScopes.length === 0 ? '#C8D9F5' : BRAND_GRADIENT,
                  color: '#FFFFFF', border: 'none',
                  fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                  cursor: draftScopes.length === 0 ? 'not-allowed' : 'pointer',
                }}>
                Save changes
              </button>
            </div>
          )}

          {/* Access history — only meaningful for Active / Withdrawn / Expired */}
          {item.status !== 'pending' && (
            <>
              <p style={detailLabel}>Access history</p>
              {!item.auditLog || item.auditLog.length === 0 ? (
                <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 14px' }}>No access events recorded yet.</p>
              ) : (
                <div style={{ marginBottom: 14 }}>
                  {item.auditLog.map((e, i) => (
                    <div key={e.id} style={{ display: 'flex', gap: 10, position: 'relative' }}>
                      <div style={{ width: 22, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: actionDot(e.action), marginTop: 6 }} />
                        {i < item.auditLog!.length - 1 && <div style={{ width: 2, flex: 1, background: '#E2E8F0', marginTop: 2 }} />}
                      </div>
                      <div style={{ flex: 1, padding: '4px 0 12px' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#1E293B', margin: 0 }}>
                          {SCOPE_LABELS[e.scope]} <span style={{ fontWeight: 600, color: '#64748B' }}>· {actionVerb(e.action)}</span>
                        </p>
                        {e.note && <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>{e.note}</p>}
                        <p style={{ fontSize: 10, color: '#94A3B8', margin: '2px 0 0' }}>{formatDateTime(e.at)} · {timeAgo(e.at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Pending help text */}
          {item.status === 'pending' && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '10px 12px', fontSize: 11, color: '#1E40AF', marginBottom: 14, lineHeight: 1.5 }}>
              ⏳ Waiting for the patient to approve, deny, or restrict the requested scopes. The request expires automatically after 7 days if there's no response.
            </div>
          )}
        </div>

        {/* Action bar */}
        <div style={{ padding: '12px 20px 0', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 8 }}>
          {item.status === 'pending' && (
            <>
              <button onClick={onCancel} style={dangerBtnFull}>Cancel request</button>
              <button onClick={onResend} style={secondaryBtnFull}>Resend</button>
            </>
          )}
          {item.status === 'active' && (
            <>
              <button onClick={onRevoke}       style={dangerBtnFull}>Revoke access</button>
              <button onClick={onOpenRecords}  style={primaryBtnFull}>Open records</button>
            </>
          )}
          {(item.status === 'withdrawn' || item.status === 'expired' || item.status === 'denied') && (
            <button onClick={onClose} style={primaryBtnFull}>Close</button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function TimelineDot({ label, date, active, muted }: { label: string; date?: string; active?: boolean; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        width: 10, height: 10, borderRadius: '50%',
        background: active ? '#1E4FA3' : muted ? '#E2E8F0' : '#CBD5E1',
        flexShrink: 0,
      }} />
      <p style={{ flex: 1, fontSize: 12, color: '#475569', margin: 0, fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: 12, color: muted ? '#CBD5E1' : '#1E293B', margin: 0, fontWeight: 600 }}>
        {date ? formatDate(date) : '—'}
      </p>
    </div>
  )
}

// ─── Confirm dialog ───────────────────────────────────────────────────────

function ConfirmDialog({
  title, message, confirmLabel, tone, onCancel, onConfirm,
}: ConfirmConfig & { onCancel: () => void; onConfirm: () => void }) {
  const danger = tone === 'danger'
  return (
    <div onClick={onCancel} style={{ ...overlayStyle, alignItems: 'center', padding: 24, zIndex: 70 }}>
      <motion.div onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{
          width: '100%', maxWidth: 360, background: '#FFFFFF',
          borderRadius: 20, padding: 22, textAlign: 'center',
          boxShadow: '0 20px 50px rgba(15,23,42,0.25)',
        }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: danger ? '#FEE2E2' : '#EBF2FF',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
        }}>
          <span style={{ fontSize: 26 }}>{danger ? '⚠️' : '❓'}</span>
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1E293B', margin: '0 0 6px' }}>{title}</h3>
        <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.5 }}>{message}</p>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: 12, borderRadius: 12,
            background: '#FFFFFF', color: '#475569',
            border: '1.5px solid #E3EAF2',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>No, keep</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: 12, borderRadius: 12,
            background: danger ? '#DC2626' : '#1E4FA3',
            color: '#FFFFFF', border: 'none',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: `0 8px 18px ${danger ? 'rgba(220,38,38,0.25)' : 'rgba(30,79,163,0.28)'}`,
          }}>
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Detail-sheet helpers ────────────────────────────────────────────────

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
  zIndex: 60, display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
}
const detailLabel: React.CSSProperties = {
  fontSize: 10, fontWeight: 800, color: '#1E4FA3',
  letterSpacing: '0.8px', margin: '0 0 8px', textTransform: 'uppercase',
}
const dangerBtnFull: React.CSSProperties = {
  flex: 1, padding: '12px 14px', borderRadius: 12,
  background: '#FEE2E2', color: '#B91C1C',
  border: '1.5px solid #FCA5A5', fontSize: 13, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit',
}
const secondaryBtnFull: React.CSSProperties = {
  flex: 1, padding: '12px 14px', borderRadius: 12,
  background: '#FFFFFF', color: '#1E4FA3',
  border: '1.5px solid #DBE7F8', fontSize: 13, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit',
}
const primaryBtnFull: React.CSSProperties = {
  flex: 1, padding: '12px 14px', borderRadius: 12,
  background: BRAND_GRADIENT, color: '#FFFFFF',
  border: 'none', fontSize: 13, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit',
}

function sameSet(a: ScopeKey[], b: ScopeKey[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set(a)
  for (const x of b) if (!set.has(x)) return false
  return true
}

function chipBtnStyle(tone: 'primary' | 'secondary' | 'danger' | 'muted'): React.CSSProperties {
  const palette = tone === 'primary'   ? { bg: '#EBF2FF', fg: '#1E4FA3', border: '#BFDBFE' }
                 : tone === 'danger'    ? { bg: '#FEE2E2', fg: '#B91C1C', border: '#FCA5A5' }
                 : tone === 'muted'     ? { bg: '#F1F5F9', fg: '#94A3B8', border: '#E2E8F0' }
                 : /* secondary */        { bg: '#FFFFFF', fg: '#475569', border: '#E3EAF2' }
  return {
    padding: '6px 12px', borderRadius: 999, cursor: tone === 'muted' ? 'not-allowed' : 'pointer',
    border: `1.5px solid ${palette.border}`,
    background: palette.bg, color: palette.fg,
    fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
  }
}

function actionVerb(action: AccessEvent['action']): string {
  return action === 'viewed' ? 'viewed' : action === 'downloaded' ? 'downloaded' : action === 'shared' ? 'shared' : 'edited'
}
function actionDot(action: AccessEvent['action']): string {
  return action === 'viewed' ? '#1E4FA3' : action === 'downloaded' ? '#10B981' : action === 'shared' ? '#A855F7' : '#F59E0B'
}
function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 0) return formatDate(iso)
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return formatDate(iso)
}
function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 86400000))
}
