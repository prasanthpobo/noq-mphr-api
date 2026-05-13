import { Router, Request, Response, NextFunction } from 'express'
import { body, validationResult } from 'express-validator'
import User from '../models/User'
import { generateToken } from '../utils/generateToken'
import { protect } from '../middleware/auth'

const router = Router()

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array()[0].msg })
      return
    }

    try {
      const { email, password } = req.body

      const user = await User.findOne({ email }).select('+password')
      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid email or password' })
        return
      }

      const isMatch = await user.matchPassword(password)
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid email or password' })
        return
      }

      if (user.status === 'inactive' || user.status === 'pending') {
        res.status(403).json({ success: false, message: 'Your account is not active. Please contact the administrator.' })
        return
      }

      const token = generateToken(user._id.toString(), user.role)

      res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          avatar: user.avatar,
          clinicId: user.clinicId
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn([
      'super_admin', 'clinic_admin', 'doctor', 'nurse', 'frontdesk', 'pharmacist', 'lab_tech'
    ]).withMessage('Invalid role')
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array()[0].msg })
      return
    }

    try {
      const { name, email, password, role, phone, clinicId } = req.body

      const existingUser = await User.findOne({ email })
      if (existingUser) {
        res.status(400).json({ success: false, message: 'A user with this email already exists' })
        return
      }

      const user = await User.create({
        name,
        email,
        password,
        role: role || 'clinic_admin',
        phone,
        clinicId: clinicId || undefined
      })

      const token = generateToken(user._id.toString(), user.role)

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          avatar: user.avatar,
          clinicId: user.clinicId
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

// GET /api/auth/me
router.get(
  '/me',
  protect,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authorized' })
        return
      }

      const user = await User.findById(req.user.id)
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' })
        return
      }

      res.status(200).json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          avatar: user.avatar,
          phone: user.phone,
          clinicId: user.clinicId,
          createdAt: user.createdAt
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

// PUT /api/auth/change-password
router.put(
  '/change-password',
  protect,
  [
    body('oldPassword').notEmpty().withMessage('Old password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters')
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array()[0].msg })
      return
    }

    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authorized' })
        return
      }

      const user = await User.findById(req.user.id).select('+password')
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' })
        return
      }

      const { oldPassword, newPassword } = req.body

      const isMatch = await user.matchPassword(oldPassword)
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Old password is incorrect' })
        return
      }

      user.password = newPassword
      await user.save()

      res.status(200).json({ success: true, message: 'Password changed successfully' })
    } catch (error) {
      next(error)
    }
  }
)

export default router
