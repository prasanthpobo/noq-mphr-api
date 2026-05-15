import { Router, Request, Response, NextFunction } from 'express'
import { protect } from '../middleware/auth'
import PharmacyOrder from '../models/PharmacyOrder'
import User from '../models/User'

const router = Router()

function generateOrderId(): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = String(Math.floor(1000 + Math.random() * 9000))
  return `RX-${dateStr}-${rand}`
}

function computeTotals(
  medicines: Array<{ quantity?: number; rate?: number; amount?: number }>,
  discountAmt = 0,
  gstPct = 0,
) {
  const subtotal = medicines.reduce((sum, m) => {
    return sum + (m.amount ?? (m.quantity ?? 0) * (m.rate ?? 0))
  }, 0)
  const gst = ((subtotal - discountAmt) * gstPct) / 100
  const total = subtotal - discountAmt + gst
  return { subtotal, gst, total, finalAmount: total }
}

// GET /api/pharmacy
router.get('/', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clinicId, status, patientId } = req.query
    const filter: Record<string, unknown> = {}

    if (clinicId) filter.clinicId = clinicId
    if (status) filter.status = status
    if (patientId) filter.patientId = patientId

    const orders = await PharmacyOrder.find(filter)
      .populate('patientId', 'name phone tag')
      .populate('doctorId', 'name specialization')
      .populate('appointmentId', 'scheduledAt tokenNumber date time')
      .sort({ createdAt: -1 })

    res.json({ success: true, count: orders.length, data: orders })
  } catch (err) {
    next(err)
  }
})

// GET /api/pharmacy/:id
router.get('/:id', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await PharmacyOrder.findById(req.params.id)
      .populate('patientId', 'name phone tag gender')
      .populate('doctorId', 'name specialization')
      .populate('clinicId', 'name address')
      .populate('appointmentId')

    if (!order) {
      res.status(404).json({ success: false, message: 'Pharmacy order not found' })
      return
    }

    res.json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
})

// POST /api/pharmacy
router.post('/', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { medicines = [], discount = 0, gstPct = 0, clinicId, appointmentId, ...rest } = req.body
    const orderId = generateOrderId()
    const totals = computeTotals(medicines, Number(discount), Number(gstPct))

    // Resolve clinicId: request body → user record → appointment record
    let resolvedClinicId = clinicId || ''
    if (!resolvedClinicId && req.user?.id) {
      const u = await User.findById(req.user.id).select('clinicId')
      if (u?.clinicId) resolvedClinicId = String(u.clinicId)
    }
    if (!resolvedClinicId && appointmentId) {
      const Appointment = (await import('../models/Appointment')).default
      const a = await Appointment.findById(appointmentId).select('clinicId')
      if (a?.clinicId) resolvedClinicId = String(a.clinicId)
    }

    const doc: Record<string, unknown> = {
      ...rest,
      orderId,
      medicines,
      discount: Number(discount),
      ...totals,
    }
    if (resolvedClinicId) doc.clinicId = resolvedClinicId
    if (appointmentId)    doc.appointmentId = appointmentId

    const order = await PharmacyOrder.create(doc)

    res.status(201).json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
})

// PUT /api/pharmacy/:id
router.put('/:id', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { medicines, status, notes, discount, gstPct } = req.body
    const updateFields: Record<string, unknown> = {}

    if (medicines !== undefined) {
      updateFields.medicines = medicines
      const existing = await PharmacyOrder.findById(req.params.id)
      const disc    = discount  !== undefined ? Number(discount)  : (existing?.discount  ?? 0)
      const gstPctV = gstPct    !== undefined ? Number(gstPct)    : 0
      const totals  = computeTotals(medicines, disc, gstPctV)
      updateFields.discount = disc
      Object.assign(updateFields, totals)
    } else if (discount !== undefined || gstPct !== undefined) {
      const existing = await PharmacyOrder.findById(req.params.id)
      if (existing) {
        const disc    = discount !== undefined ? Number(discount) : existing.discount
        const gstPctV = gstPct   !== undefined ? Number(gstPct)  : 0
        const totals  = computeTotals(existing.medicines as any[], disc, gstPctV)
        updateFields.discount = disc
        Object.assign(updateFields, totals)
      }
    }

    if (status !== undefined) updateFields.status = status
    if (notes  !== undefined) updateFields.notes  = notes

    const order = await PharmacyOrder.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true })
      .populate('patientId', 'name phone tag')
      .populate('doctorId', 'name specialization')

    if (!order) {
      res.status(404).json({ success: false, message: 'Pharmacy order not found' })
      return
    }

    res.json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
})

// PUT /api/pharmacy/:id/dispense
router.put('/:id/dispense', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await PharmacyOrder.findByIdAndUpdate(
      req.params.id,
      { status: 'dispensed', paidAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('patientId', 'name phone tag')
      .populate('doctorId', 'name specialization')

    if (!order) {
      res.status(404).json({ success: false, message: 'Pharmacy order not found' })
      return
    }

    res.json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
})

// PUT /api/pharmacy/:id/pay
router.put('/:id/pay', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, method } = req.body
    const existing = await PharmacyOrder.findById(req.params.id)
    if (!existing) {
      res.status(404).json({ success: false, message: 'Pharmacy order not found' })
      return
    }

    const newPaidAmount = (existing.paidAmount ?? 0) + Number(amount)
    const newStatus = newPaidAmount >= existing.total
      ? 'paid'
      : newPaidAmount > 0 ? 'partial' : existing.status

    const order = await PharmacyOrder.findByIdAndUpdate(
      req.params.id,
      { paidAmount: newPaidAmount, status: newStatus, paidAt: new Date(), paymentMethod: method },
      { new: true, runValidators: true },
    )
      .populate('patientId', 'name phone tag')
      .populate('doctorId', 'name specialization')

    res.json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/pharmacy/:id
router.delete('/:id', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await PharmacyOrder.findByIdAndDelete(req.params.id)

    if (!order) {
      res.status(404).json({ success: false, message: 'Pharmacy order not found' })
      return
    }

    res.json({ success: true, data: {} })
  } catch (err) {
    next(err)
  }
})

export default router
