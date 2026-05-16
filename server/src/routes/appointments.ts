import { Router, Request, Response, NextFunction } from 'express'
import { body, validationResult } from 'express-validator'
import { protect } from '../middleware/auth'
import Appointment from '../models/Appointment'
import Doctor from '../models/Doctor'
import Patient from '../models/Patient'
import User from '../models/User'
import FamilyMember from '../models/FamilyMember'

const router = Router()

// GET /api/appointments/mine?filter=upcoming|past
// Returns all appointments belonging to the logged-in patient (matched by phone/email across clinics).
router.get('/mine', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.id)
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    // Find all Patient records belonging to this user across clinics
    const patientQuery: Record<string, unknown>[] = []
    if (user.phone) patientQuery.push({ phone: user.phone })
    if (user.email) patientQuery.push({ email: user.email })

    if (patientQuery.length === 0) {
      res.json({ success: true, count: 0, data: [] })
      return
    }

    const patients = await Patient.find({ $or: patientQuery }).select('_id')
    const patientIds = patients.map((p) => p._id)

    if (patientIds.length === 0) {
      res.json({ success: true, count: 0, data: [] })
      return
    }

    const { filter } = req.query
    const now = new Date()
    const statusFilter: Record<string, unknown> = {}

    if (filter === 'upcoming') {
      statusFilter.status = { $in: ['scheduled', 'in-progress'] }
    } else if (filter === 'past') {
      statusFilter.status = { $in: ['completed', 'cancelled', 'no-show'] }
    }

    const appointments = await Appointment.find({
      patientId: { $in: patientIds },
      ...statusFilter,
    })
      .populate('patientId', 'name phone tag gender')
      .populate('doctorId', 'name specialization consultationFee')
      .populate('clinicId', 'name address')
      .sort({ date: filter === 'past' ? -1 : 1, createdAt: -1 })

    res.json({ success: true, count: appointments.length, data: appointments })
  } catch (err) {
    next(err)
  }
})

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

// POST /api/appointments/book — patient-facing booking
// Finds or creates a Patient record at the doctor's clinic, then creates the appointment.
router.post(
  '/book',
  protect,
  [
    body('doctorId').notEmpty().withMessage('doctorId is required'),
    body('date').notEmpty().withMessage('date is required'),
    body('time').notEmpty().withMessage('time is required'),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array()[0].msg })
      return
    }
    try {
      const { doctorId, date, time, reason, familyMemberId } = req.body as {
        doctorId: string
        date: string
        time: string
        reason?: string
        familyMemberId?: string
      }

      const doctor = await Doctor.findById(doctorId)
      if (!doctor) {
        res.status(404).json({ success: false, message: 'Doctor not found' })
        return
      }
      const clinicId = doctor.clinicId

      // Determine the person being booked for
      let patientName: string
      let patientPhone: string
      let patientGender: 'M' | 'F' | 'Other'
      let patientDob: Date | undefined
      let patientEmail: string | undefined

      if (familyMemberId) {
        const fm = await FamilyMember.findOne({ _id: familyMemberId, userId: req.user!.id })
        if (!fm) {
          res.status(404).json({ success: false, message: 'Family member not found' })
          return
        }
        patientName   = fm.name
        patientPhone  = fm.phone || ''
        patientGender = (fm.gender as 'M' | 'F' | 'Other') || 'Other'
        patientDob    = fm.dob
      } else {
        const user = await User.findById(req.user!.id)
        if (!user) {
          res.status(404).json({ success: false, message: 'User not found' })
          return
        }
        patientName   = user.name
        patientPhone  = user.phone || ''
        patientGender = (user.gender as 'M' | 'F' | 'Other') || 'Other'
        patientDob    = user.dob
        patientEmail  = user.email
      }

      if (!patientPhone) {
        res.status(400).json({ success: false, message: 'Phone number is required for booking. Please update your profile.' })
        return
      }

      // Find or create Patient record for this clinic
      let patient = await Patient.findOne({ phone: patientPhone, clinicId })
      if (!patient) {
        patient = await Patient.create({
          name: patientName,
          phone: patientPhone,
          gender: patientGender,
          dob: patientDob,
          email: patientEmail,
          clinicId,
          tag: 'new',
        })
      }

      const appointmentDate = new Date(date)

      const appointment = await Appointment.create({
        patientId: patient._id,
        doctorId,
        clinicId,
        date: appointmentDate,
        time,
        notes: reason || '',
        symptoms: reason ? [reason] : [],
        status: 'scheduled',
        type: 'consultation',
      })

      const populated = await Appointment.findById(appointment._id)
        .populate('patientId', 'name phone tag')
        .populate('doctorId', 'name specialization consultationFee')
        .populate('clinicId', 'name address')

      res.status(201).json({ success: true, data: populated })
    } catch (err) {
      next(err)
    }
  }
)

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
