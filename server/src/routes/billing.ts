import { Router, Request, Response, NextFunction } from 'express'
import { protect } from '../middleware/auth'
import Billing from '../models/Billing'
import User from '../models/User'

const router = Router()

function generateInvoiceNumber(): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = String(Math.floor(1000 + Math.random() * 9000))
  return `INV-${dateStr}-${rand}`
}

function computeTotals(
  items: Array<{ quantity?: number; rate?: number; amount?: number }>,
  discountAmt = 0,
  taxAmt = 0,
) {
  const subtotal = items.reduce((sum, it) => {
    return sum + (it.amount ?? (it.quantity ?? 0) * (it.rate ?? 0))
  }, 0)
  const total = subtotal - discountAmt + taxAmt
  return { subtotal, total }
}

// GET /api/billing
router.get('/', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clinicId, status, patientId, appointmentId, from, to, search } = req.query
    const filter: Record<string, unknown> = {}

    if (clinicId)      filter.clinicId      = clinicId
    if (status)        filter.status        = status
    if (patientId)     filter.patientId     = patientId
    if (appointmentId) filter.appointmentId = appointmentId

    if (from || to) {
      const dateFilter: Record<string, Date> = {}
      if (from) dateFilter.$gte = new Date(from as string)
      if (to)   dateFilter.$lte = new Date(to   as string)
      filter.createdAt = dateFilter
    }

    if (search) {
      const all = await Billing.find(filter)
        .populate('patientId',    'name phone tag')
        .populate('doctorId',     'name specialization')
        .populate('appointmentId','date time tokenNumber')
        .sort({ createdAt: -1 })

      const term    = (search as string).toLowerCase()
      const matched = all.filter(b => {
        const patient = ((b.patientId as any)?.name  ?? '').toLowerCase()
        const phone   = ((b.patientId as any)?.phone ?? '').toLowerCase()
        const inv     = (b.invoiceNumber ?? '').toLowerCase()
        return patient.includes(term) || phone.includes(term) || inv.includes(term)
      })

      return res.json({ success: true, count: matched.length, data: matched })
    }

    const bills = await Billing.find(filter)
      .populate('patientId',    'name phone tag')
      .populate('doctorId',     'name specialization')
      .populate('appointmentId','date time tokenNumber')
      .sort({ createdAt: -1 })

    res.json({ success: true, count: bills.length, data: bills })
  } catch (err) {
    next(err)
  }
})

// GET /api/billing/:id
router.get('/:id', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bill = await Billing.findById(req.params.id)
      .populate('patientId',    'name phone tag gender')
      .populate('doctorId',     'name specialization')
      .populate('clinicId',     'name address')
      .populate('appointmentId')

    if (!bill) {
      res.status(404).json({ success: false, message: 'Bill not found' })
      return
    }

    res.json({ success: true, data: bill })
  } catch (err) {
    next(err)
  }
})

// POST /api/billing
router.post('/', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items = [], discount = 0, tax = 0, clinicId, appointmentId, ...rest } = req.body
    const invoiceNumber = generateInvoiceNumber()
    const { subtotal, total } = computeTotals(items, Number(discount), Number(tax))

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
      invoiceNumber,
      items,
      discount: Number(discount),
      tax:      Number(tax),
      subtotal,
      total,
    }
    if (resolvedClinicId) doc.clinicId     = resolvedClinicId
    if (appointmentId)    doc.appointmentId = appointmentId

    const bill = await Billing.create(doc)
    res.status(201).json({ success: true, data: bill })
  } catch (err) {
    next(err)
  }
})

// PUT /api/billing/:id
router.put('/:id', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await Billing.findById(req.params.id)
    if (!existing) {
      res.status(404).json({ success: false, message: 'Bill not found' })
      return
    }

    const items    = req.body.items    !== undefined ? req.body.items    : existing.items
    const discount = req.body.discount !== undefined ? Number(req.body.discount) : existing.discount
    const tax      = req.body.tax      !== undefined ? Number(req.body.tax)      : existing.tax
    const { subtotal, total } = computeTotals(items, discount, tax)

    const updateFields: Record<string, unknown> = {
      items, discount, tax, subtotal, total,
    }
    if (req.body.notes  !== undefined) updateFields.notes  = req.body.notes
    if (req.body.status !== undefined) updateFields.status = req.body.status

    const bill = await Billing.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true })
      .populate('patientId',    'name phone tag')
      .populate('doctorId',     'name specialization')
      .populate('appointmentId','date time tokenNumber')

    res.json({ success: true, data: bill })
  } catch (err) {
    next(err)
  }
})

// PUT /api/billing/:id/pay
router.put('/:id/pay', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, method } = req.body
    if (amount === undefined) {
      res.status(400).json({ success: false, message: 'amount is required' })
      return
    }

    const existing = await Billing.findById(req.params.id)
    if (!existing) {
      res.status(404).json({ success: false, message: 'Bill not found' })
      return
    }

    const newPaidAmount = (existing.paidAmount ?? 0) + Number(amount)
    const newStatus     = newPaidAmount >= existing.total
      ? 'paid'
      : newPaidAmount > 0 ? 'partial' : existing.status

    const updateFields: Record<string, unknown> = {
      paidAmount: newPaidAmount,
      status:     newStatus,
      paidAt:     new Date(),
    }
    if (method) updateFields.paymentMethod = method

    const bill = await Billing.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true })
      .populate('patientId', 'name phone tag')
      .populate('doctorId',  'name specialization')

    res.json({ success: true, data: bill })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/billing/:id
router.delete('/:id', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bill = await Billing.findByIdAndDelete(req.params.id)
    if (!bill) {
      res.status(404).json({ success: false, message: 'Bill not found' })
      return
    }
    res.json({ success: true, data: {} })
  } catch (err) {
    next(err)
  }
})

export default router
