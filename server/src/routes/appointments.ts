import { Router, Request, Response, NextFunction } from 'express'
import { protect } from '../middleware/auth'
import Appointment from '../models/Appointment'

const router = Router()

// GET /api/appointments/slots?doctorId=&date=
router.get('/slots', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { doctorId, date } = req.query
    if (!doctorId || !date) {
      res.status(400).json({ success: false, message: 'doctorId and date are required' })
      return
    }

    const d     = new Date(date as string)
    const start = new Date(d); start.setHours(0, 0, 0, 0)
    const end   = new Date(d); end.setHours(23, 59, 59, 999)

    const booked = await Appointment.find({
      doctorId,
      date: { $gte: start, $lte: end },
      status: { $nin: ['cancelled', 'no-show'] },
    }).select('time')

    const bookedTimes = new Set(booked.map(a => a.time).filter(Boolean))

    // Generate 30-min slots from 09:00 to 18:00
    const slots: { time: string; available: boolean }[] = []
    for (let h = 9; h < 18; h++) {
      for (const m of [0, 30]) {
        const hh   = String(h).padStart(2, '0')
        const mm   = String(m).padStart(2, '0')
        const ampm = h < 12 ? 'AM' : 'PM'
        const h12  = h > 12 ? h - 12 : h === 0 ? 12 : h
        const time = `${String(h12).padStart(2, '0')}:${mm} ${ampm}`
        slots.push({ time, available: !bookedTimes.has(time) })
      }
    }

    res.json({ success: true, data: slots })
  } catch (err) {
    next(err)
  }
})

// GET /api/appointments
router.get('/', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { doctorId, patientId, status, date, clinicId, page, limit, search, followUpOf } = req.query
    const filter: Record<string, unknown> = {}

    if (doctorId)  filter.doctorId  = doctorId
    if (patientId) filter.patientId = patientId
    if (status)    filter.status    = status
    if (clinicId)  filter.clinicId  = clinicId
    if (followUpOf) filter.followUpOf = followUpOf
    if (date) {
      const d     = new Date(date as string)
      const start = new Date(d); start.setHours(0, 0, 0, 0)
      const end   = new Date(d); end.setHours(23, 59, 59, 999)
      filter.date = { $gte: start, $lte: end }
    }

    const pageNum  = Math.max(1, parseInt(page  as string) || 1)
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string) || 20))
    const skip     = (pageNum - 1) * limitNum

    if (search) {
      // Fetch all matching docs with populate, then filter + paginate in-memory
      // (avoids complex $lookup aggregation for small-clinic data sizes)
      const all = await Appointment.find(filter)
        .populate('patientId', 'name phone tag')
        .populate('doctorId', 'name specialization')
        .populate('clinicId', 'name')
        .sort({ date: -1, createdAt: -1 })

      const term    = (search as string).toLowerCase()
      const filtered = all.filter(a => {
        const patient = ((a.patientId as any)?.name ?? '').toLowerCase()
        const doctor  = ((a.doctorId  as any)?.name ?? '').toLowerCase()
        const id      = String(a._id).toLowerCase()
        return patient.includes(term) || doctor.includes(term) || id.includes(term)
      })

      const paginated = filtered.slice(skip, skip + limitNum)
      return res.json({ success: true, count: filtered.length, data: paginated })
    }

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate('patientId', 'name phone tag')
        .populate('doctorId', 'name specialization')
        .populate('clinicId', 'name')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Appointment.countDocuments(filter),
    ])

    res.json({ success: true, count: total, data: appointments })
  } catch (err) {
    next(err)
  }
})

// GET /api/appointments/:id
router.get('/:id', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name phone tag gender dob bloodGroup')
      .populate('doctorId', 'name specialization phone email')
      .populate('clinicId', 'name address phone')

    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found' })
      return
    }

    res.json({ success: true, data: appointment })
  } catch (err) {
    next(err)
  }
})

// POST /api/appointments
router.post('/', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await Appointment.create(req.body)
    res.status(201).json({ success: true, data: appointment })
  } catch (err) {
    next(err)
  }
})

// PUT /api/appointments/:id
router.put('/:id', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, prescription, vitals, notes, symptoms, type, time, date, followUpOf, followUpReason } = req.body
    const updateFields: Record<string, unknown> = {}

    if (status !== undefined)        updateFields.status        = status
    if (prescription !== undefined)  updateFields.prescription  = prescription
    if (vitals !== undefined)        updateFields.vitals        = vitals
    if (notes !== undefined)         updateFields.notes         = notes
    if (symptoms !== undefined)      updateFields.symptoms      = symptoms
    if (type !== undefined)          updateFields.type          = type
    if (time !== undefined)          updateFields.time          = time
    if (date !== undefined)          updateFields.date          = date
    if (followUpOf !== undefined)    updateFields.followUpOf    = followUpOf
    if (followUpReason !== undefined) updateFields.followUpReason = followUpReason

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('patientId', 'name phone tag')
      .populate('doctorId', 'name specialization')

    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found' })
      return
    }

    res.json({ success: true, data: appointment })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/appointments/:id
router.delete('/:id', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id)

    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found' })
      return
    }

    res.json({ success: true, data: {} })
  } catch (err) {
    next(err)
  }
})

// PUT /api/appointments/:id/prescription
router.put('/:id/prescription', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prescription } = req.body

    if (!Array.isArray(prescription)) {
      res.status(400).json({ success: false, message: 'prescription must be an array' })
      return
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { prescription },
      { new: true, runValidators: true }
    )
      .populate('patientId', 'name phone tag')
      .populate('doctorId', 'name specialization')

    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found' })
      return
    }

    res.json({ success: true, data: appointment })
  } catch (err) {
    next(err)
  }
})

// PUT /api/appointments/:id/vitals
router.put('/:id/vitals', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bp, pulse, temp, weight, height } = req.body
    const vitals: Record<string, unknown> = {}

    if (bp !== undefined) vitals['vitals.bp'] = bp
    if (pulse !== undefined) vitals['vitals.pulse'] = pulse
    if (temp !== undefined) vitals['vitals.temp'] = temp
    if (weight !== undefined) vitals['vitals.weight'] = weight
    if (height !== undefined) vitals['vitals.height'] = height

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: vitals },
      { new: true, runValidators: true }
    )
      .populate('patientId', 'name phone tag')
      .populate('doctorId', 'name specialization')

    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found' })
      return
    }

    res.json({ success: true, data: appointment })
  } catch (err) {
    next(err)
  }
})

export default router
