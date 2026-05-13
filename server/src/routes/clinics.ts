import { Router, Request, Response, NextFunction } from 'express'
import { protect } from '../middleware/auth'
import Clinic from '../models/Clinic'
import mongoose from 'mongoose'

const router = Router()

router.use(protect)

// GET /api/clinics
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
        { code: searchRegex },
        { city: searchRegex },
        { state: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ]
    }

    const clinics = await Clinic.find(filter).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: clinics.length,
      data: clinics
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/clinics/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid clinic ID' })
      return
    }

    const clinic = await Clinic.findById(req.params.id)
    if (!clinic) {
      res.status(404).json({ success: false, message: 'Clinic not found' })
      return
    }

    res.status(200).json({ success: true, data: clinic })
  } catch (error) {
    next(error)
  }
})

// POST /api/clinics
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name, code, address, city, state, pincode,
      phone, email, type, capacity, status,
      openDays, openTime, closeTime, logo, about
    } = req.body

    if (!name || !code || !address || !city || !state || !pincode || !phone || !email || !type) {
      res.status(400).json({
        success: false,
        message: 'Name, code, address, city, state, pincode, phone, email, and type are required'
      })
      return
    }

    const existingClinic = await Clinic.findOne({ code: code.toUpperCase() })
    if (existingClinic) {
      res.status(400).json({ success: false, message: 'A clinic with this code already exists' })
      return
    }

    const clinic = await Clinic.create({
      name, code, address, city, state, pincode,
      phone, email, type, capacity,
      status: status || 'active',
      openDays: openDays || [],
      openTime, closeTime, logo, about
    })

    res.status(201).json({ success: true, data: clinic })
  } catch (error) {
    next(error)
  }
})

// PUT /api/clinics/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid clinic ID' })
      return
    }

    const clinic = await Clinic.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )

    if (!clinic) {
      res.status(404).json({ success: false, message: 'Clinic not found' })
      return
    }

    res.status(200).json({ success: true, data: clinic })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/clinics/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid clinic ID' })
      return
    }

    const clinic = await Clinic.findByIdAndDelete(req.params.id)
    if (!clinic) {
      res.status(404).json({ success: false, message: 'Clinic not found' })
      return
    }

    res.status(200).json({ success: true, message: 'Clinic deleted successfully' })
  } catch (error) {
    next(error)
  }
})

export default router
