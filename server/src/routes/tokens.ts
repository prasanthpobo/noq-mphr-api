import { Router, Request, Response, NextFunction } from 'express'
import { protect } from '../middleware/auth'
import Token from '../models/Token'
import Patient from '../models/Patient'
import User from '../models/User'

const router = Router()

// GET /api/tokens/mine — active token for the logged-in patient today
router.get('/mine', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.id)
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return }

    const patientQuery: Record<string, unknown>[] = []
    if (user.phone) patientQuery.push({ phone: user.phone })
    if (user.email) patientQuery.push({ email: user.email })

    if (patientQuery.length === 0) {
      res.json({ success: true, data: null })
      return
    }

    const patients = await Patient.find({ $or: patientQuery }).select('_id')
    const patientIds = patients.map((p) => p._id)

    if (patientIds.length === 0) {
      res.json({ success: true, data: null })
      return
    }

    const now = new Date()
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0)
    const endOfDay   = new Date(now); endOfDay.setHours(23, 59, 59, 999)

    // Find the most recent active token for today
    const token = await Token.findOne({
      patientId: { $in: patientIds },
      status: { $in: ['waiting', 'in-room', 'in-consultation', 'priority'] },
      issuedAt: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate('doctorId', 'name specialization')
      .populate('clinicId', 'name address')
      .sort({ issuedAt: -1 })

    if (!token) {
      res.json({ success: true, data: null })
      return
    }

    // Count tokens ahead in queue for the same doctor today
    const aheadCount = await Token.countDocuments({
      doctorId: token.doctorId,
      clinicId: token.clinicId,
      tokenNumber: { $lt: token.tokenNumber },
      status: { $in: ['waiting', 'priority'] },
      issuedAt: { $gte: startOfDay, $lte: endOfDay },
    })

    // Currently being served token number
    const serving = await Token.findOne({
      doctorId: token.doctorId,
      clinicId: token.clinicId,
      status: { $in: ['in-room', 'in-consultation'] },
      issuedAt: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ tokenNumber: -1 }).select('tokenNumber')

    res.json({
      success: true,
      data: token,
      meta: {
        aheadCount,
        currentlyServing: serving?.tokenNumber ?? null,
      },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/tokens
router.get('/', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, clinicId, doctorId, status, appointmentId } = req.query
    const filter: Record<string, unknown> = {}

    if (appointmentId) {
      filter.appointmentId = appointmentId
    } else {
      const targetDate = date ? new Date(date as string) : new Date()
      const start = new Date(targetDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(targetDate)
      end.setHours(23, 59, 59, 999)
      filter.issuedAt = { $gte: start, $lte: end }
    }

    if (clinicId) filter.clinicId = clinicId
    if (doctorId) filter.doctorId = doctorId
    if (status)   filter.status   = status

    const tokens = await Token.find(filter)
      .populate('patientId', 'name phone tag')
      .populate('doctorId', 'name specialization room')
      .populate('clinicId', 'name address')
      .populate('appointmentId', 'time date type')
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
