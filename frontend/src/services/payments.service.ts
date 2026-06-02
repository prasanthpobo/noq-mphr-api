import api from '@/lib/axios'

export interface RazorpayOrder {
  id:       string
  amount:   number    // paise
  currency: 'INR'
  receipt:  string
  status:   string
}

export interface CreateOrderResponse {
  success: boolean
  keyId:   string
  order:   RazorpayOrder
}

export interface VerifyPayload {
  razorpay_order_id:   string
  razorpay_payment_id: string
  razorpay_signature:  string
}

export interface VerifyResponse {
  success:   boolean
  paymentId: string
  orderId:   string
  message?:  string
}

export const paymentsService = {
  /** Create a Razorpay order on the server (amount in rupees). */
  createRazorpayOrder: (amount: number, receipt?: string, notes?: Record<string, string>): Promise<CreateOrderResponse> =>
    api.post('/payments/razorpay/order', { amount, receipt, notes }).then((r) => r.data),

  /** Verify the Razorpay payment signature returned by the checkout. */
  verifyRazorpay: (payload: VerifyPayload): Promise<VerifyResponse> =>
    api.post('/payments/razorpay/verify', payload).then((r) => r.data),
}

/* ── Razorpay checkout script loader ─────────────────────────────────────── */

declare global {
  interface Window {
    Razorpay?: new (opts: RazorpayCheckoutOptions) => { open: () => void; close: () => void }
  }
}

interface RazorpayCheckoutOptions {
  key:          string
  amount:       number               // paise
  currency:     'INR'
  name:         string
  description?: string
  order_id:     string
  prefill?:     { name?: string; email?: string; contact?: string }
  notes?:       Record<string, string>
  theme?:       { color?: string }
  handler:      (resp: VerifyPayload) => void
  modal?:       { ondismiss?: () => void }
}

let razorpayScriptLoading: Promise<void> | null = null

/** Loads the Razorpay checkout script on demand (cached). */
export function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'))
  if (window.Razorpay) return Promise.resolve()
  if (razorpayScriptLoading) return razorpayScriptLoading
  razorpayScriptLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src   = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    s.onload  = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Razorpay checkout'))
    document.body.appendChild(s)
  })
  return razorpayScriptLoading
}

/** High-level helper: open the Razorpay modal and resolve with the signed verify payload. */
export async function openRazorpayCheckout(opts: Omit<RazorpayCheckoutOptions, 'handler' | 'modal'>): Promise<VerifyPayload> {
  await loadRazorpayScript()
  if (!window.Razorpay) throw new Error('Razorpay not available')
  return new Promise<VerifyPayload>((resolve, reject) => {
    const rzp = new window.Razorpay!({
      ...opts,
      handler: (resp) => resolve(resp),
      modal:   { ondismiss: () => reject(new Error('Payment cancelled')) },
    })
    rzp.open()
  })
}
