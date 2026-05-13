import { Router, Request, Response, NextFunction } from 'express'
import { protect } from '../middleware/auth'
import FrontDesk from '../models/FrontDesk'
import mongoose from 'mongoose'

const router = Router()

router.use(protect)

// GET /api/frontdesk
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, status } = req.query
    const filter: Record<string, unknown> = {}

    if (status && typeof status === 'string') {
      filter.status = status
    }

    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(search, 'i')
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { designation: searchRegex }
      ]
    }

    const frontdeskStaff = await FrontDesk.find(filter)
      .populate('clinicId', 'name code city')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: frontdeskStaff.length,
      data: frontdeskStaff
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/frontdesk/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid front desk staff ID' })
      return
    }

    const staff = await FrontDesk.findById(req.params.id).populate('clinicId', 'name code city')
    if (!staff) {
      res.status(404).json({ success: false, message: 'Front desk staff not found' })
      return
    }

    res.status(200).json({ success: true, data: staff })
  } catch (error) {
    next(error)
  }
})

// POST /api/frontdesk
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, phone, shift, status, clinicId, designation, experience } = req.body

    if (!name || !email || !phone || !shift || !clinicId) {
      res.status(400).json({
        success: false,
        message: 'Name, email, phone, shift, and clinicId are required'
      })
      return
    }

    if (!mongoose.Types.ObjectId.isValid(clinicId)) {
      res.status(400).json({ success: false, message: 'Invalid clinic ID' })
      return
    }

    const staff = await FrontDesk.create({
      name, email, phone, shift,
      status: status || 'active',
      clinicId, designation, experience
    })

    const populated = await staff.populate('clinicId', 'name code city')

    res.status(201).json({ success: true, data: populated })
  } catch (error) {
    next(error)
  }
})

// PUT /api/frontdesk/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid front desk staff ID' })
      return
    }

    if (req.body.clinicId && !mongoose.Types.ObjectId.isValid(req.body.clinicId)) {
      res.status(400).json({ success: false, message: 'Invalid clinic ID' })
      return
    }

    const staff = await FrontDesk.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('clinicId', 'name code city')

    if (!staff) {
      res.status(404).json({ success: false, message: 'Front desk staff not found' })
      return
    }

    res.status(200).json({ success: true, data: staff })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/frontdesk/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid front desk staff ID' })
      return
    }

    const staff = await FrontDesk.findByIdAndDelete(req.params.id)
    if (!staff) {
      res.status(404).json({ success: false, message: 'Front desk staff not found' })
      return
    }

    res.status(200).json({ success: true, message: 'Front desk staff deleted successfully' })
  } catch (error) {
    next(error)
  }
})

export default router
