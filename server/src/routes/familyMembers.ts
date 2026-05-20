import { Router, Request, Response, NextFunction } from 'express'
import { body, validationResult } from 'express-validator'
import mongoose from 'mongoose'
import { protect } from '../middleware/auth'
import FamilyMember from '../models/FamilyMember'

const router = Router()

router.use(protect)

// GET /api/family-members
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const members = await FamilyMember.find({ userId: req.user!.id }).sort({ createdAt: 1 })
    res.json({ success: true, count: members.length, data: members })
  } catch (err) {
    next(err)
  }
})

// GET /api/family-members/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' })
      return
    }
    const member = await FamilyMember.findOne({ _id: req.params.id, userId: req.user!.id })
    if (!member) {
      res.status(404).json({ success: false, message: 'Family member not found' })
      return
    }
    res.json({ success: true, data: member })
  } catch (err) {
    next(err)
  }
})

// POST /api/family-members
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('relation').notEmpty().withMessage('Relation is required').trim(),
    body('gender').optional().isIn(['M', 'F', 'Other']).withMessage('Invalid gender'),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array()[0].msg })
      return
    }
    try {
      const { name, relation, gender, dob, bloodGroup, phone } = req.body
      const member = await FamilyMember.create({
        userId: req.user!.id,
        name,
        relation,
        gender,
        dob: dob ? new Date(dob) : undefined,
        bloodGroup,
        phone,
      })
      res.status(201).json({ success: true, data: member })
    } catch (err) {
      next(err)
    }
  }
)

// PUT /api/family-members/:id
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty').trim(),
    body('relation').optional().notEmpty().withMessage('Relation cannot be empty').trim(),
    body('gender').optional().isIn(['M', 'F', 'Other']).withMessage('Invalid gender'),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array()[0].msg })
      return
    }
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400).json({ success: false, message: 'Invalid ID' })
        return
      }
      const member = await FamilyMember.findOneAndUpdate(
        { _id: req.params.id, userId: req.user!.id },
        { ...req.body, dob: req.body.dob ? new Date(req.body.dob) : undefined },
        { new: true, runValidators: true }
      )
      if (!member) {
        res.status(404).json({ success: false, message: 'Family member not found' })
        return
      }
      res.json({ success: true, data: member })
    } catch (err) {
      next(err)
    }
  }
)

// DELETE /api/family-members/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' })
      return
    }
    const member = await FamilyMember.findOneAndDelete({ _id: req.params.id, userId: req.user!.id })
    if (!member) {
      res.status(404).json({ success: false, message: 'Family member not found' })
      return
    }
    res.json({ success: true, message: 'Family member removed' })
  } catch (err) {
    next(err)
  }
})

export default router
