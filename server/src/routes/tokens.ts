import { Router, Request, Response, NextFunction } from 'express'
import { protect } from '../middleware/auth'
import Token from '../models/Token'

const router = Router()

// GET /api/tokens
router.get('/', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, clinicId, doctorId, status } = req.query
    const filter: Record<string, unknown> = {}

    const targetDate = date ? new Date(date as string) : new Date()
    const start = new Date(targetDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(targetDate)
    end.setHours(23, 59, 59, 999)
    filter.issuedAt = { $gte: start, $lte: end }

    if (clinicId) filter.clinicId = clinicId
    if (doctorId) filter.doctorId = doctorId
    if (status) filter.status = status

    const tokens = await Token.find(filter)
      .populate('patientId', 'name phone tag')
      .populate('doctorId', 'name specialization')
      .sort({ tokenNumber: 1 })

    res.json({ success: true, count: tokens.length, data: tokens })
  } catch (err) {
    next(err)
  }
})

// GET /api/tokens/:id
router.get('/:id', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = await Token.findById(req.params.id)
      .populate('patientId', 'name phone tag gender dob')
      .populate('doctorId', 'name specialization')
      .populate('clinicId', 'name')
      .populate('appointmentId')

    if (!token) {
      res.status(404).json({ success: false, message: 'Token not found' })
      return
    }

    res.json({ success: true, data: token })
  } catch (err) {
    next(err)
  }
})

// POST /api/tokens
router.post('/', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clinicId } = req.body
    const issuedAt = req.body.issuedAt ? new Date(req.body.issuedAt) : new Date()
    const tokenNumber = await Token.getNextTokenNumber(clinicId, issuedAt)

    const token = await Token.create({ ...req.body, tokenNumber, issuedAt })
    res.status(201).json({ success: true, data: token })
  } catch (err) {
    next(err)
  }
})

// PUT /api/tokens/:id/status
router.put('/:id/status', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body
    const validStatuses = ['waiting', 'in-room', 'in-consultation', 'completed', 'cancelled', 'not-visited', 'priority']

    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status value' })
      return
    }

    const updateFields: Record<string, unknown> = { status }

    if (status === 'in-room' || status === 'in-consultation') {
      updateFields.calledAt = new Date()
    }
    if (status === 'completed') {
      updateFields.completedAt = new Date()
    }

    const token = await Token.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true })
      .populate('patientId', 'name phone tag')
      .populate('doctorId', 'name specialization')

    if (!token) {
      res.status(404).json({ success: false, message: 'Token not found' })
      return
    }

    res.json({ success: true, data: token })
  } catch (err) {
    next(err)
  }
})

// PUT /api/tokens/:id/priority
router.put('/:id/priority', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = await Token.findById(req.params.id)

    if (!token) {
      res.status(404).json({ success: false, message: 'Token not found' })
      return
    }

    const newPriority = token.priority === 'normal' ? 'priority' : 'normal'
    token.priority = newPriority
    await token.save()

    res.json({ success: true, data: token })
  } catch (err) {
    next(err)
  }
})

// PUT /api/tokens/:id/move
router.put('/:id/move', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { direction } = req.body

    if (!['up', 'down'].includes(direction)) {
      res.status(400).json({ success: false, message: 'direction must be "up" or "down"' })
      return
    }

    const token = await Token.findById(req.params.id)

    if (!token) {
      res.status(404).json({ success: false, message: 'Token not found' })
      return
    }

    const targetTokenNumber = direction === 'up' ? token.tokenNumber - 1 : token.tokenNumber + 1

    const startOfDay = new Date(token.issuedAt)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(token.issuedAt)
    endOfDay.setHours(23, 59, 59, 999)

    const adjacentToken = await Token.findOne({
      clinicId: token.clinicId,
      tokenNumber: targetTokenNumber,
      issuedAt: { $gte: startOfDay, $lte: endOfDay }
    })

    if (!adjacentToken) {
      res.status(400).json({ success: false, message: 'No adjacent token to swap with' })
      return
    }

    const tempNumber = token.tokenNumber
    token.tokenNumber = adjacentToken.tokenNumber
    adjacentToken.tokenNumber = tempNumber

    await token.save()
    await adjacentToken.save()

    res.json({ success: true, data: { token, adjacentToken } })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/tokens/:id
router.delete('/:id', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = await Token.findByIdAndDelete(req.params.id)

    if (!token) {
      res.status(404).json({ success: false, message: 'Token not found' })
      return
    }

    res.json({ success: true, data: {} })
  } catch (err) {
    next(err)
  }
})

export default router
