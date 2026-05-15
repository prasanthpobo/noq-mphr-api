import { Router, Request, Response, NextFunction } from 'express'
import { protect } from '../middleware/auth'
import SupportTicket from '../models/SupportTicket'

const router = Router()

function generateTicketId(): string {
  const rand = String(Math.floor(10000 + Math.random() * 90000))
  return `TKT-${rand}`
}

// GET /api/support
router.get('/', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, priority, category } = req.query
    const filter: Record<string, unknown> = {}

    if (status) filter.status = status
    if (priority) filter.priority = priority
    if (category) filter.category = category

    const tickets = await SupportTicket.find(filter)
      .populate('submittedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })

    res.json({ success: true, count: tickets.length, data: tickets })
  } catch (err) {
    next(err)
  }
})

// GET /api/support/:id
router.get('/:id', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('submittedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('clinicId', 'name')
      .populate('messages.sender', 'name email role')

    if (!ticket) {
      res.status(404).json({ success: false, message: 'Support ticket not found' })
      return
    }

    res.json({ success: true, data: ticket })
  } catch (err) {
    next(err)
  }
})

// POST /api/support
router.post('/', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticketId = generateTicketId()
    const ticket = await SupportTicket.create({ ...req.body, ticketId })
    res.status(201).json({ success: true, data: ticket })
  } catch (err) {
    next(err)
  }
})

// PUT /api/support/:id
router.put('/:id', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject, category, priority, assignedTo, status } = req.body
    const updateFields: Record<string, unknown> = {}

    if (subject !== undefined) updateFields.subject = subject
    if (category !== undefined) updateFields.category = category
    if (priority !== undefined) updateFields.priority = priority
    if (assignedTo !== undefined) updateFields.assignedTo = assignedTo || null
    if (status !== undefined) {
      updateFields.status = status
      if (status === 'resolved' || status === 'closed') updateFields.resolvedAt = new Date()
    }

    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true })
      .populate('submittedBy', 'name email')
      .populate('assignedTo', 'name email')

    if (!ticket) {
      res.status(404).json({ success: false, message: 'Support ticket not found' })
      return
    }

    res.json({ success: true, data: ticket })
  } catch (err) {
    next(err)
  }
})

// PUT /api/support/:id/status
router.put('/:id/status', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body
    const validStatuses = ['open', 'in-progress', 'resolved', 'closed']

    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status value' })
      return
    }

    const updateFields: Record<string, unknown> = { status }

    if (status === 'resolved' || status === 'closed') {
      updateFields.resolvedAt = new Date()
    }

    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true })
      .populate('submittedBy', 'name email')
      .populate('assignedTo', 'name email')

    if (!ticket) {
      res.status(404).json({ success: false, message: 'Support ticket not found' })
      return
    }

    res.json({ success: true, data: ticket })
  } catch (err) {
    next(err)
  }
})

// POST /api/support/:id/message
router.post('/:id/message', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, isStaff } = req.body

    if (!text) {
      res.status(400).json({ success: false, message: 'text is required' })
      return
    }

    const message = {
      sender: req.user!.id,
      text,
      sentAt: new Date(),
      isStaff: Boolean(isStaff)
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { $push: { messages: message } },
      { new: true, runValidators: true }
    )
      .populate('submittedBy', 'name email')
      .populate('messages.sender', 'name email role')

    if (!ticket) {
      res.status(404).json({ success: false, message: 'Support ticket not found' })
      return
    }

    res.json({ success: true, data: ticket })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/support/:id
router.delete('/:id', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await SupportTicket.findByIdAndDelete(req.params.id)

    if (!ticket) {
      res.status(404).json({ success: false, message: 'Support ticket not found' })
      return
    }

    res.json({ success: true, data: {} })
  } catch (err) {
    next(err)
  }
})

export default router
