import { Router, Request, Response, NextFunction } from 'express'
import { protect } from '../middleware/auth'
import PharmacyOrder from '../models/PharmacyOrder'

const router = Router()

function generateOrderId(): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = String(Math.floor(1000 + Math.random() * 9000))
  return `RX-${dateStr}-${rand}`
}

function computeTotal(medicines: Array<{ quantity?: number; rate?: number; amount?: number }>): number {
  return medicines.reduce((sum, m) => {
    const amount = m.amount ?? (m.quantity ?? 0) * (m.rate ?? 0)
    return sum + amount
  }, 0)
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
    const { medicines = [], discount = 0 } = req.body
    const orderId = generateOrderId()
    const total = computeTotal(medicines)
    const finalAmount = total - discount

    const order = await PharmacyOrder.create({
      ...req.body,
      orderId,
      medicines,
      total,
      discount,
      finalAmount
    })

    res.status(201).json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
})

// PUT /api/pharmacy/:id
router.put('/:id', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { medicines, status, notes, discount } = req.body
    const updateFields: Record<string, unknown> = {}

    if (medicines !== undefined) {
      updateFields.medicines = medicines
      const total = computeTotal(medicines)
      const disc = discount ?? 0
      updateFields.total = total
      updateFields.discount = disc
      updateFields.finalAmount = total - disc
    } else if (discount !== undefined) {
      const existing = await PharmacyOrder.findById(req.params.id)
      if (existing) {
        updateFields.discount = discount
        updateFields.finalAmount = existing.total - discount
      }
    }

    if (status !== undefined) updateFields.status = status
    if (notes !== undefined) updateFields.notes = notes

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
