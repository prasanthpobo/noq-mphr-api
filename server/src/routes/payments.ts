import { Router, Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { protect } from '../middleware/auth'

const router = Router()

function razorpay(): Razorpay {
  const key_id     = process.env.RAZORPAY_KEY_ID
  const key_secret = process.env.RAZORPAY_KEY_SECRET
  if (!key_id || !key_secret) {
    throw new Error('Razorpay keys not configured. Set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in server/.env.')
  }
  return new Razorpay({ key_id, key_secret })
}

/**
 * POST /api/payments/razorpay/order
 * Body: { amount: number (rupees), receipt?: string, notes?: object }
 * Returns: { success, order, keyId }
 *
 * Creates a Razorpay order so the browser checkout can launch with a server-issued
 * order_id (prevents tampering on the amount).
 */
router.post('/razorpay/order', protect, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { amount, receipt, notes } = req.body as { amount?: number; receipt?: string; notes?: Record<string, string> }
    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, message: 'amount (in rupees) is required' })
      return
    }
    const order = await razorpay().orders.create({
      amount:   Math.round(amount * 100),       // Razorpay expects paise
      currency: 'INR',
      receipt:  receipt ?? `rcpt_${Date.now()}`,
      notes:    notes ?? {},
    })
    res.json({
      success: true,
      keyId:   process.env.RAZORPAY_KEY_ID,
      order: {
        id:       order.id,
        amount:   order.amount,
        currency: order.currency,
        receipt:  order.receipt,
        status:   order.status,
      },
    })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/payments/razorpay/verify
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Verifies the HMAC signature returned by the Razorpay checkout handler.
 */
router.post('/razorpay/verify', protect, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body as { razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ success: false, message: 'order_id, payment_id and signature are required' })
      return
    }

    const secret   = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      res.status(500).json({ success: false, message: 'Razorpay secret not configured' })
      return
    }

    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    // Defensive: a malformed signature (wrong length / non-hex) should be a 400,
    // not a 500. Pad/truncate via fixed-length buffers and bail out cleanly.
    const expectedBuf = Buffer.from(expected, 'hex')
    let providedBuf: Buffer
    try {
      providedBuf = Buffer.from(razorpay_signature, 'hex')
    } catch {
      res.status(400).json({ success: false, message: 'Malformed signature' })
      return
    }
    if (providedBuf.length !== expectedBuf.length) {
      res.status(400).json({ success: false, message: 'Invalid Razorpay signature' })
      return
    }
    const valid = crypto.timingSafeEqual(expectedBuf, providedBuf)

    if (!valid) {
      res.status(400).json({ success: false, message: 'Invalid Razorpay signature' })
      return
    }

    res.json({
      success: true,
      paymentId: razorpay_payment_id,
      orderId:   razorpay_order_id,
    })
  } catch (err) {
    next(err)
  }
})

export default router
