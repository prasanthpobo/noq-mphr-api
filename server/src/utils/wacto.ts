// ── Wacto WhatsApp Business API ───────────────────────────────────────────────

const WACTO_URL   = 'https://my.wacto.app/v22.0/1114636995064890/messages'
const WACTO_TOKEN = '95ce123c-ab0a-4ca4-9e80-4c9e87d59e76'

/** True only when WHATSAPP_ENABLED=true in the environment */
function isWhatsAppEnabled(): boolean {
  return process.env.WHATSAPP_ENABLED?.trim().toLowerCase() === 'true'
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('91') && digits.length === 12) return digits
  if (digits.length === 10) return `91${digits}`
  return digits
}

async function callWacto(payload: Record<string, unknown>, to: string): Promise<void> {
  const template = ((payload.template as Record<string, unknown>)?.name as string) ?? 'message'

  if (!isWhatsAppEnabled()) {
    console.log(`[WhatsApp DISABLED] Would send "${template}" to +${to}`)
    return
  }

  const res = await fetch(WACTO_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WACTO_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    let msg = `Wacto error (${res.status})`
    try {
      const j = await res.json() as { error?: { message?: string }; message?: string }
      msg = j?.error?.message ?? j?.message ?? msg
    } catch { /* ignore */ }
    throw new Error(msg)
  }
  console.log(`[WhatsApp] Sent "${template}" to +${to}`)
}

// ── OTP (otp_sms template) ────────────────────────────────────────────────────

export async function sendWactoOtp(to: string, otp: string): Promise<void> {
  await callWacto({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template: {
      name: 'otp_sms',
      language: { code: 'en' },
      components: [
        { type: 'body',   parameters: [{ type: 'text', text: otp }] },
        { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: otp }] },
      ],
    },
    biz_opaque_callback_data: `noq_otp_${to}_${Date.now()}`,
  }, to)
}

// ── Welcome (welcome_message template) ───────────────────────────────────────
// {{1}} name  {{2}} app  {{3}} phone  {{4}} joined date

export async function sendWelcomeMessage(to: string, name: string): Promise<void> {
  const joinedDate   = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const displayPhone = `+${to.slice(0, 2)} ${to.slice(2)}`

  await callWacto({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template: {
      name: 'welcome_message',
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: name },
            { type: 'text', text: 'NoQ Health' },
            { type: 'text', text: displayPhone },
            { type: 'text', text: joinedDate },
          ],
        },
      ],
    },
    biz_opaque_callback_data: `noq_welcome_${to}_${Date.now()}`,
  }, to)
}

// ── Appointment (appointment template) ───────────────────────────────────────
// {{1}} patient name  {{2}} doctor name  {{3}} date  {{4}} time  {{5}} status label

export type AppointmentStatus = 'booked' | 'cancelled'

export async function sendAppointmentMessage(
  to: string,
  patientName: string,
  doctorName: string,
  date: Date,
  time: string,
  apptStatus: AppointmentStatus
): Promise<void> {
  const formattedDate = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const statusLabel   = apptStatus === 'booked' ? '✅ Confirmed' : '❌ Cancelled'

  await callWacto({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template: {
      name: 'appointment',
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: patientName },   // {{1}}
            { type: 'text', text: doctorName },    // {{2}}
            { type: 'text', text: formattedDate }, // {{3}}
            { type: 'text', text: time },          // {{4}}
            { type: 'text', text: statusLabel },   // {{5}}
          ],
        },
      ],
    },
    biz_opaque_callback_data: `noq_appt_${apptStatus}_${to}_${Date.now()}`,
  }, to)
}
