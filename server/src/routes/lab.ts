import { Router, Request, Response, NextFunction } from 'express'
import { protect } from '../middleware/auth'
import LabOrder from '../models/LabOrder'

const router = Router()

function generateOrderId(): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = String(Math.floor(1000 + Math.random() * 9000))
  return `LAB-${dateStr}-${rand}`
}

// GET /api/lab
router.get('/', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clinicId, status, patientId } = req.query
    const filter: Record<string, unknown> = {}

    if (clinicId) filter.clinicId = clinicId
    if (status) filter.status = status
    if (patientId) filter.patientId = patientId

    const orders = await LabOrder.find(filter)
      .populate('patientId', 'name phone tag')
      .populate('doctorId', 'name specialization')
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
      .populate('patientId', 'name phone tag gender')
      .populate('doctorId', 'name specialization')
      .populate('clinicId', 'name address')
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
    const orderId = generateOrderId()
    const order = await LabOrder.create({ ...req.body, orderId })
    res.status(201).json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
})

// PUT /api/lab/:id
router.put('/:id', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tests, status, notes, collectedAt, reportedAt, priority } = req.body
    const updateFields: Record<string, unknown> = {}

    if (tests !== undefined) updateFields.tests = tests
    if (status !== undefined) updateFields.status = status
    if (notes !== undefined) updateFields.notes = notes
    if (collectedAt !== undefined) updateFields.collectedAt = collectedAt
    if (reportedAt !== undefined) updateFields.reportedAt = reportedAt
    if (priority !== undefined) updateFields.priority = priority

    const order = await LabOrder.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true })
      .populate('patientId', 'name phone tag')
      .populate('doctorId', 'name specialization')

    if (!order) {
      res.status(404).json({ success: false, message: 'Lab order not found' })
      return
    }

    res.json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
})

// PUT /api/lab/:id/result
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

    if (result !== undefined) order.tests[testIndex].result = result
    if (unit !== undefined) order.tests[testIndex].unit = unit
    if (normalRange !== undefined) order.tests[testIndex].normalRange = normalRange
    order.tests[testIndex].status = 'completed'

    const allCompleted = order.tests.every((t) => t.status === 'completed')
    if (allCompleted) {
      order.status = 'completed'
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
