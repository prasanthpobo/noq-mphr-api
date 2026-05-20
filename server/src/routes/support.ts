import { Router, Request, Response, NextFunction } from 'express'
import { protect } from '../middleware/auth'
import SupportTicket from '../models/SupportTicket'

const router = Router()

function generateTicketId(): string {
  const rand = String(Math.floor(1000 + Math.random() * 9000))
  return `TKT-${rand}`
}

// Map frontend category labels to backend enums
function mapCategory(cat: string): string {
  const map: Record<string, string> = {
    'Payment':          'billing',
    'App issue':        'technical',
    'Booking issue':    'general',
    'Doctor / clinic':  'clinical',
    'Medical records':  'clinical',
    'Other':            'general',
  }
  return map[cat] ?? 'general'
}

// GET /api/support — patient sees only their own tickets
router.get('/', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, priority, category } = req.query
    const filter: Record<string, unknown> = { submittedBy: req.user!.id }

    if (status) filter.status = status
    if (priority) filter.priority = priority
    if (category) filter.category = category

    const tickets = await SupportTicket.find(filter)
      .populate('submittedBy', 'name email')
      .populate('messages.sender', 'name email role')
      .sort({ createdAt: -1 })

    res.json({ success: true, count: tickets.length, data: tickets })
  } catch (err) {
    next(err)
  }
})

// GET /api/support/:id
router.get('/:id', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      submittedBy: req.user!.id,
    })
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

// POST /api/support — create ticket; submittedBy always comes from auth token
router.post('/', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, category, description } = req.body

    if (!title && !req.body.subject) {
      res.status(400).json({ success: false, message: 'title is required' })
      return
    }

    const subject = title || req.body.subject
    const backendCategory = mapCategory(category ?? req.body.category ?? 'Other')

    // Seed the first message from the description field
    const messages = description
      ? [{ sender: req.user!.id, text: description, sentAt: new Date(), isStaff: false }]
      : []

    let ticketId = generateTicketId()
    // Retry once on collision (extremely unlikely)
    const existing = await SupportTicket.findOne({ ticketId })
    if (existing) ticketId = generateTicketId()

    const ticket = await SupportTicket.create({
      ticketId,
      subject,
      category: backendCategory,
      priority: req.body.priority ?? 'medium',
      status: 'open',
      submittedBy: req.user!.id,
      messages,
    })

    const populated = await SupportTicket.findById(ticket._id)
      .populate('submittedBy', 'name email')
      .populate('messages.sender', 'name email role')

    res.status(201).json({ success: true, data: populated })
  } catch (err) {
    next(err)
  }
})

// POST /api/support/:id/messages — add a reply (patient)
router.post('/:id/messages', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body

    if (!text?.trim()) {
      res.status(400).json({ success: false, message: 'text is required' })
      return
    }

    const message = {
      sender: req.user!.id,
      text: text.trim(),
      sentAt: new Date(),
      isStaff: false,
    }

    const ticket = await SupportTicket.findOneAndUpdate(
      { _id: req.params.id, submittedBy: req.user!.id },
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

// PATCH /api/support/:id — close or update status
router.patch('/:id', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body
    const validStatuses = ['open', 'in-progress', 'resolved', 'closed']

    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: 'Valid status is required' })
      return
    }

    const updateFields: Record<string, unknown> = { status }
    if (status === 'resolved' || status === 'closed') updateFields.resolvedAt = new Date()

    const ticket = await SupportTicket.findOneAndUpdate(
      { _id: req.params.id, submittedBy: req.user!.id },
      updateFields,
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

// PUT /api/support/:id — admin full update (kept for admin use)
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

// POST /api/support/:id/message — legacy singular alias (kept for compatibility)
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
      isStaff: Boolean(isStaff),
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
    const ticket = await SupportTicket.findOneAndDelete({
      _id: req.params.id,
      submittedBy: req.user!.id,
    })

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
