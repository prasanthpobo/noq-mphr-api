import { Router, Request, Response, NextFunction } from 'express'
import { protect } from '../middleware/auth'
import Billing from '../models/Billing'

const router = Router()

function generateInvoiceNumber(): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = String(Math.floor(1000 + Math.random() * 9000))
  return `INV-${dateStr}-${rand}`
}

function computeTotals(items: Array<{ quantity?: number; rate?: number; amount?: number }>, discount = 0, tax = 0) {
  const subtotal = items.reduce((sum, item) => {
    const amount = item.amount ?? (item.quantity ?? 0) * (item.rate ?? 0)
    return sum + amount
  }, 0)
  const total = subtotal - discount + tax
  return { subtotal, total }
}

// GET /api/billing
router.get('/', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clinicId, status, patientId, from, to } = req.query
    const filter: Record<string, unknown> = {}

    if (clinicId) filter.clinicId = clinicId
    if (status) filter.status = status
    if (patientId) filter.patientId = patientId

    if (from || to) {
      const dateFilter: Record<string, Date> = {}
      if (from) dateFilter.$gte = new Date(from as string)
      if (to) dateFilter.$lte = new Date(to as string)
      filter.createdAt = dateFilter
    }

    const bills = await Billing.find(filter)
      .populate('patientId', 'name phone tag')
      .populate('doctorId', 'name specialization')
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
      .populate('patientId', 'name phone tag gender')
      .populate('doctorId', 'name specialization')
      .populate('clinicId', 'name address')
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
    const { items = [], discount = 0, tax = 0 } = req.body
    const invoiceNumber = generateInvoiceNumber()
    const { subtotal, total } = computeTotals(items, discount, tax)

    const bill = await Billing.create({
      ...req.body,
      invoiceNumber,
      subtotal,
      total,
      discount,
      tax,
      items
    })

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

    const items = req.body.items ?? existing.items
    const discount = req.body.discount ?? existing.discount
    const tax = req.body.tax ?? existing.tax
    const { subtotal, total } = computeTotals(items, discount, tax)

    const bill = await Billing.findByIdAndUpdate(
      req.params.id,
      { ...req.body, items, discount, tax, subtotal, total },
      { new: true, runValidators: true }
    )
      .populate('patientId', 'name phone tag')
      .populate('doctorId', 'name specialization')

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

    const newPaidAmount = (existing.paidAmount || 0) + Number(amount)
    let status: string = existing.status

    if (newPaidAmount >= existing.total) {
      status = 'paid'
    } else if (newPaidAmount > 0) {
      status = 'partial'
    }

    const updateFields: Record<string, unknown> = {
      paidAmount: newPaidAmount,
      status,
      paidAt: new Date()
    }
    if (method) updateFields.paymentMethod = method

    const bill = await Billing.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true })
      .populate('patientId', 'name phone tag')
      .populate('doctorId', 'name specialization')

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
