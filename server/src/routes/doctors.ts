import { Router, Request, Response, NextFunction } from 'express'
import { protect } from '../middleware/auth'
import Doctor from '../models/Doctor'
import mongoose from 'mongoose'

const router = Router()

router.use(protect)

// GET /api/doctors
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, status, clinicId } = req.query
    const filter: Record<string, unknown> = {}

    if (status && typeof status === 'string') {
      filter.status = status
    }

    if (clinicId && typeof clinicId === 'string' && mongoose.Types.ObjectId.isValid(clinicId)) {
      filter.clinicId = new mongoose.Types.ObjectId(clinicId)
    }

    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(search, 'i')
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { specialization: searchRegex },
        { phone: searchRegex }
      ]
    }

    const doctors = await Doctor.find(filter)
      .populate('clinicId', 'name code city')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/doctors/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid doctor ID' })
      return
    }

    const doctor = await Doctor.findById(req.params.id).populate('clinicId', 'name code city')
    if (!doctor) {
      res.status(404).json({ success: false, message: 'Doctor not found' })
      return
    }

    res.status(200).json({ success: true, data: doctor })
  } catch (error) {
    next(error)
  }
})

// POST /api/doctors
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name, email, phone, specialization, qualification,
      experience, status, clinicId, consultationFee,
      availableDays, shift, bio, avatar
    } = req.body

    if (!name || !email || !phone || !specialization || !qualification || !clinicId || !shift) {
      res.status(400).json({
        success: false,
        message: 'Name, email, phone, specialization, qualification, clinicId, and shift are required'
      })
      return
    }

    if (!mongoose.Types.ObjectId.isValid(clinicId)) {
      res.status(400).json({ success: false, message: 'Invalid clinic ID' })
      return
    }

    const doctor = await Doctor.create({
      name, email, phone, specialization, qualification,
      experience, status: status || 'active', clinicId,
      consultationFee, availableDays: availableDays || [],
      shift, bio, avatar
    })

    const populated = await doctor.populate('clinicId', 'name code city')

    res.status(201).json({ success: true, data: populated })
  } catch (error) {
    next(error)
  }
})

// PUT /api/doctors/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid doctor ID' })
      return
    }

    if (req.body.clinicId && !mongoose.Types.ObjectId.isValid(req.body.clinicId)) {
      res.status(400).json({ success: false, message: 'Invalid clinic ID' })
      return
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('clinicId', 'name code city')

    if (!doctor) {
      res.status(404).json({ success: false, message: 'Doctor not found' })
      return
    }

    res.status(200).json({ success: true, data: doctor })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/doctors/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid doctor ID' })
      return
    }

    const doctor = await Doctor.findByIdAndDelete(req.params.id)
    if (!doctor) {
      res.status(404).json({ success: false, message: 'Doctor not found' })
      return
    }

    res.status(200).json({ success: true, message: 'Doctor deleted successfully' })
  } catch (error) {
    next(error)
  }
})

export default router
