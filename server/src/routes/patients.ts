import { Router, Request, Response, NextFunction } from 'express'
import { protect } from '../middleware/auth'
import Patient from '../models/Patient'
import mongoose from 'mongoose'

const router = Router()

router.use(protect)

// GET /api/patients
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, tag, clinicId } = req.query
    const filter: Record<string, unknown> = {}

    if (tag && typeof tag === 'string') {
      filter.tag = tag
    }

    if (clinicId && typeof clinicId === 'string' && mongoose.Types.ObjectId.isValid(clinicId)) {
      filter.clinicId = new mongoose.Types.ObjectId(clinicId)
    }

    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(search, 'i')
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ]
    }

    const patients = await Patient.find(filter)
      .populate('clinicId', 'name code city')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/patients/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid patient ID' })
      return
    }

    const patient = await Patient.findById(req.params.id).populate('clinicId', 'name code city')
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found' })
      return
    }

    res.status(200).json({ success: true, data: patient })
  } catch (error) {
    next(error)
  }
})

// POST /api/patients
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name, email, phone, dob, gender, bloodGroup,
      address, clinicId, tag, medicalHistory, allergies,
      emergencyContact
    } = req.body

    if (!name || !phone || !gender || !clinicId) {
      res.status(400).json({
        success: false,
        message: 'Name, phone, gender, and clinicId are required'
      })
      return
    }

    if (!mongoose.Types.ObjectId.isValid(clinicId)) {
      res.status(400).json({ success: false, message: 'Invalid clinic ID' })
      return
    }

    const patient = await Patient.create({
      name, email, phone, dob, gender, bloodGroup,
      address, clinicId, tag: tag || 'active',
      medicalHistory: medicalHistory || [],
      allergies: allergies || [],
      emergencyContact
    })

    const populated = await patient.populate('clinicId', 'name code city')

    res.status(201).json({ success: true, data: populated })
  } catch (error) {
    next(error)
  }
})

// PUT /api/patients/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid patient ID' })
      return
    }

    if (req.body.clinicId && !mongoose.Types.ObjectId.isValid(req.body.clinicId)) {
      res.status(400).json({ success: false, message: 'Invalid clinic ID' })
      return
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('clinicId', 'name code city')

    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found' })
      return
    }

    res.status(200).json({ success: true, data: patient })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/patients/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid patient ID' })
      return
    }

    const patient = await Patient.findByIdAndDelete(req.params.id)
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found' })
      return
    }

    res.status(200).json({ success: true, message: 'Patient deleted successfully' })
  } catch (error) {
    next(error)
  }
})

export default router
