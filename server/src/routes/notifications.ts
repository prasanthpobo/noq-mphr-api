import { Router, Request, Response, NextFunction } from 'express'
import { protect } from '../middleware/auth'
import Notification from '../models/Notification'

const router = Router()

// All routes require authentication
router.use(protect)

// GET / — paginated notifications for the logged-in user
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id
    const page  = Math.max(1, parseInt(req.query.page  as string) || 1)
    const limit = Math.max(1, parseInt(req.query.limit as string) || 20)
    const skip  = (page - 1) * limit

    const [data, unreadCount] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId, read: false }),
    ])

    res.json({ success: true, count: data.length, unreadCount, data })
  } catch (err) {
    next(err)
  }
})

// GET /unread-count
router.get('/unread-count', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const count = await Notification.countDocuments({ userId: req.user!.id, read: false })
    res.json({ success: true, count })
  } catch (err) {
    next(err)
  }
})

// PUT /read-all — mark all unread as read
router.put('/read-all', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user!.id, read: false },
      { $set: { read: true } }
    )
    res.json({ success: true, modifiedCount: result.modifiedCount })
  } catch (err) {
    next(err)
  }
})

// PUT /:id/read — mark one notification as read
router.put('/:id/read', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id },
      { $set: { read: true } },
      { new: true }
    )

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' })
      return
    }

    res.json({ success: true, data: notification })
  } catch (err) {
    next(err)
  }
})

export default router
