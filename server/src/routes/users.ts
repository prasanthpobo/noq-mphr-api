import { Router, Request, Response, NextFunction } from 'express'
import { protect } from '../middleware/auth'
import User from '../models/User'
import mongoose from 'mongoose'

const router = Router()

// All routes are protected
router.use(protect)

// GET /api/users
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, status, role } = req.query
    const filter: Record<string, unknown> = {}

    if (status && typeof status === 'string') {
      filter.status = status
    }

    if (role && typeof role === 'string') {
      filter.role = role
    }

    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(search, 'i')
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ]
    }

    const users = await User.find(filter).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/users/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' })
      return
    }

    const user = await User.findById(req.params.id)
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    res.status(200).json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
})

// POST /api/users
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role, status, clinicId, avatar, phone } = req.body

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required' })
      return
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      res.status(400).json({ success: false, message: 'A user with this email already exists' })
      return
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'clinic_admin',
      status: status || 'active',
      clinicId: clinicId || undefined,
      avatar,
      phone
    })

    res.status(201).json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
})

// PUT /api/users/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' })
      return
    }

    // Never update password via this route
    const { password, ...updateData } = req.body

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    res.status(200).json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/users/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' })
      return
    }

    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    res.status(200).json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    next(error)
  }
})

export default router
