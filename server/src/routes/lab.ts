import { Router, Request, Response, NextFunction } from 'express'
import { protect } from '../middleware/auth'
import LabOrder from '../models/LabOrder'
import User from '../models/User'

const router = Router()

function generateOrderId(): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = String(Math.floor(1000 + Math.random() * 9000))
  return `LAB-${dateStr}-${rand}`
}

function computeTotals(
  tests: Array<{ rate?: number; amount?: number }>,
  discountAmt = 0,
  gstPct = 0,
) {
  const subtotal = tests.reduce((sum, t) => sum + (t.amount ?? t.rate ?? 0), 0)
  const gst = ((subtotal - discountAmt) * gstPct) / 100
  const total = subtotal - discountAmt + gst
  return { subtotal, gst, total, finalAmount: total }
}

// GET /api/lab
router.get('/', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clinicId, status, patientId, appointmentId, from, to, search } = req.query
    const filter: Record<string, unknown> = {}

    if (clinicId)     filter.clinicId     = clinicId
    if (status)       filter.status       = status
    if (patientId)    filter.patientId    = patientId
    if (appointmentId) filter.appointmentId = appointmentId

    if (from || to) {
      const dateFilter: Record<string, Date> = {}
      if (from) dateFilter.$gte = new Date(from as string)
      if (to)   dateFilter.$lte = new Date(to   as string)
      filter.createdAt = dateFilter
    }

    if (search) {
      // In-memory search after populate (small clinic data sizes)
      const all = await LabOrder.find(filter)
        .populate('patientId',    'name phone tag')
        .populate('doctorId',     'name specialization')
        .populate('appointmentId','date time tokenNumber')
        .sort({ createdAt: -1 })

      const term    = (search as string).toLowerCase()
      const matched = all.filter(o => {
        const patient = ((o.patientId as any)?.name  ?? '').toLowerCase()
        const phone   = ((o.patientId as any)?.phone ?? '').toLowerCase()
        const id      = (o.orderId ?? '').toLowerCase()
        return patient.includes(term) || phone.includes(term) || id.includes(term)
      })

      return res.json({ success: true, count: matched.length, data: matched })
    }

    const orders = await LabOrder.find(filter)
      .populate('patientId',    'name phone tag')
      .populate('doctorId',     'name specialization')
      .populate('appointmentId','date time tokenNumber')
      .sort({ createdAt: -1 })

    res.json({ success: true, count: orders.length, data: orders })
  } catch (err) {
    next(err)
  }
})

// GET /api/lab/:id
router.get('/:id', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await LabOrder.findById(req.params.id)
      .populate('patientId',    'name phone tag gender')
      .populate('doctorId',     'name specialization')
      .populate('clinicId',     'name address')
      .populate('appointmentId')

    if (!order) {
      res.status(404).json({ success: false, message: 'Lab order not found' })
      return
    }

    res.json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
})

// POST /api/lab
router.post('/', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tests = [], discount = 0, gstPct = 0, clinicId, appointmentId, ...rest } = req.body
    const orderId = generateOrderId()
    const totals  = computeTotals(tests, Number(discount), Number(gstPct))

    // Resolve clinicId: body → user record → appointment record
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
      tests,
      discount: Number(discount),
      ...totals,
    }
    if (resolvedClinicId) doc.clinicId    = resolvedClinicId
    if (appointmentId)    doc.appointmentId = appointmentId

    const order = await LabOrder.create(doc)
    res.status(201).json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
})

// PUT /api/lab/:id
router.put('/:id', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tests, status, notes, discount, gstPct, priority } = req.body
    const updateFields: Record<string, unknown> = {}

    if (tests !== undefined) {
      updateFields.tests = tests
      const existing = await LabOrder.findById(req.params.id)
      const disc    = discount !== undefined ? Number(discount) : (existing?.discount ?? 0)
      const gstPctV = gstPct   !== undefined ? Number(gstPct)  : 0
      const totals  = computeTotals(tests, disc, gstPctV)
      updateFields.discount = disc
      Object.assign(updateFields, totals)
    } else if (discount !== undefined || gstPct !== undefined) {
      const existing = await LabOrder.findById(req.params.id)
      if (existing) {
        const disc    = discount !== undefined ? Number(discount) : existing.discount
        const gstPctV = gstPct   !== undefined ? Number(gstPct)  : 0
        const totals  = computeTotals(existing.tests as any[], disc, gstPctV)
        updateFields.discount = disc
        Object.assign(updateFields, totals)
      }
    }

    if (status   !== undefined) updateFields.status   = status
    if (notes    !== undefined) updateFields.notes     = notes
    if (priority !== undefined) updateFields.priority  = priority

    const order = await LabOrder.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true })
      .populate('patientId', 'name phone tag')
      .populate('doctorId',  'name specialization')

    if (!order) {
      res.status(404).json({ success: false, message: 'Lab order not found' })
      return
    }

    res.json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
})

// PUT /api/lab/:id/collect  — mark sample collected, move to in-progress
router.put('/:id/collect', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await LabOrder.findByIdAndUpdate(
      req.params.id,
      { status: 'in-progress', collectedAt: new Date() },
      { new: true, runValidators: true },
    )
      .populate('patientId', 'name phone tag')
      .populate('doctorId',  'name specialization')

    if (!order) {
      res.status(404).json({ success: false, message: 'Lab order not found' })
      return
    }

    res.json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
})

// PUT /api/lab/:id/result  — enter result for a single test by index
router.put('/:id/result', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { testIndex, result, unit, normalRange } = req.body

    if (testIndex === undefined) {
      res.status(400).json({ success: false, message: 'testIndex is required' })
      return
    }

    const order = await LabOrder.findById(req.params.id)
    if (!order) {
      res.status(404).json({ success: false, message: 'Lab order not found' })
      return
    }

    if (testIndex < 0 || testIndex >= order.tests.length) {
      res.status(400).json({ success: false, message: 'Invalid testIndex' })
      return
    }

    if (result      !== undefined) order.tests[testIndex].result      = result
    if (unit        !== undefined) order.tests[testIndex].unit        = unit
    if (normalRange !== undefined) order.tests[testIndex].normalRange = normalRange
    order.tests[testIndex].status = 'completed'

    const allCompleted = order.tests.every(t => t.status === 'completed')
    if (allCompleted) {
      order.status     = 'completed'
      order.reportedAt = new Date()
    } else {
      order.status = 'in-progress'
    }

    await order.save()
    res.json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
})

// PUT /api/lab/:id/pay
router.put('/:id/pay', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, method } = req.body
    const existing = await LabOrder.findById(req.params.id)
    if (!existing) {
      res.status(404).json({ success: false, message: 'Lab order not found' })
      return
    }

    const newPaidAmount = (existing.paidAmount ?? 0) + Number(amount)
    const newStatus = newPaidAmount >= existing.total
      ? 'paid'
      : newPaidAmount > 0 ? 'in-progress' : existing.status

    const order = await LabOrder.findByIdAndUpdate(
      req.params.id,
      { paidAmount: newPaidAmount, status: newStatus, paidAt: new Date(), paymentMethod: method },
      { new: true, runValidators: true },
    )
      .populate('patientId', 'name phone tag')
      .populate('doctorId',  'name specialization')

    res.json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/lab/:id
router.delete('/:id', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await LabOrder.findByIdAndDelete(req.params.id)
    if (!order) {
      res.status(404).json({ success: false, message: 'Lab order not found' })
      return
    }
    res.json({ success: true, data: {} })
  } catch (err) {
    next(err)
  }
})

export default router
