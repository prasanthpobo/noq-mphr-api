import { Router, Request, Response, NextFunction } from 'express'
import { protect } from '../middleware/auth'
import Nurse from '../models/Nurse'
import mongoose from 'mongoose'

const router = Router()

router.use(protect)

// GET /api/nurses
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
        { ward: searchRegex },
        { qualification: searchRegex }
      ]
    }

    const nurses = await Nurse.find(filter)
      .populate('clinicId', 'name code city')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: nurses.length,
      data: nurses
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/nurses/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid nurse ID' })
      return
    }

    const nurse = await Nurse.findById(req.params.id).populate('clinicId', 'name code city')
    if (!nurse) {
      res.status(404).json({ success: false, message: 'Nurse not found' })
      return
    }

    res.status(200).json({ success: true, data: nurse })
  } catch (error) {
    next(error)
  }
})

// POST /api/nurses
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, phone, qualification, shift, clinicId } = req.body
    if (!name || !email || !phone || !qualification || !shift || !clinicId) {
      res.status(400).json({
        success: false,
        message: 'Name, email, phone, qualification, shift, and clinicId are required',
      })
      return
    }
    if (!mongoose.Types.ObjectId.isValid(clinicId)) {
      res.status(400).json({ success: false, message: 'Invalid clinic ID' })
      return
    }
    const nurse = await Nurse.create({ ...req.body, status: req.body.status || 'active' })

    const populated = await nurse.populate('clinicId', 'name code city')

    res.status(201).json({ success: true, data: populated })
  } catch (error) {
    next(error)
  }
})

// PUT /api/nurses/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid nurse ID' })
      return
    }

    if (req.body.clinicId && !mongoose.Types.ObjectId.isValid(req.body.clinicId)) {
      res.status(400).json({ success: false, message: 'Invalid clinic ID' })
      return
    }

    const nurse = await Nurse.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('clinicId', 'name code city')

    if (!nurse) {
      res.status(404).json({ success: false, message: 'Nurse not found' })
      return
    }

    res.status(200).json({ success: true, data: nurse })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/nurses/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid nurse ID' })
      return
    }

    const nurse = await Nurse.findByIdAndDelete(req.params.id)
    if (!nurse) {
      res.status(404).json({ success: false, message: 'Nurse not found' })
      return
    }

    res.status(200).json({ success: true, message: 'Nurse deleted successfully' })
  } catch (error) {
    next(error)
  }
})

export default router
