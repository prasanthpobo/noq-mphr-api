import { Router, Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import { protect } from '../middleware/auth'
import Appointment from '../models/Appointment'
import Billing from '../models/Billing'
import Token from '../models/Token'

const router = Router()

function getPeriodRange(period: string): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  let start: Date

  if (period === 'week') {
    start = new Date(now)
    start.setDate(now.getDate() - 6)
    start.setHours(0, 0, 0, 0)
  } else if (period === 'year') {
    start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
  } else {
    // default: month
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  }

  return { start, end }
}

// GET /api/reports/summary
router.get('/summary', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const [
      totalAppointments,
      totalRevenue,
      todayTokens,
      pendingBills
    ] = await Promise.all([
      Appointment.countDocuments(),
      Billing.aggregate([
        { $match: { status: { $in: ['paid', 'partial'] } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } }
      ]),
      Token.countDocuments({ issuedAt: { $gte: todayStart, $lte: todayEnd } }),
      Billing.countDocuments({ status: 'pending' })
    ])

    // Try to count from Patient and Doctor models dynamically
    let totalPatients = 0
    let totalDoctors = 0

    try {
      const PatientModel = mongoose.model('Patient')
      totalPatients = await PatientModel.countDocuments()
    } catch (_e) {
      // Patient model not yet registered
    }

    try {
      const DoctorModel = mongoose.model('Doctor')
      totalDoctors = await DoctorModel.countDocuments()
    } catch (_e) {
      // Doctor model not yet registered
    }

    res.json({
      success: true,
      data: {
        totalPatients,
        totalDoctors,
        totalAppointments,
        totalRevenue: totalRevenue[0]?.total ?? 0,
        todayTokens,
        pendingBills
      }
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/reports/revenue
router.get('/revenue', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as string) || 'month'
    const { start, end } = getPeriodRange(period)

    const data = await Billing.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$total' },
          paid: { $sum: '$paidAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    res.json({ success: true, count: data.length, data })
  } catch (err) {
    next(err)
  }
})

// GET /api/reports/appointments
router.get('/appointments', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as string) || 'month'
    const { start, end } = getPeriodRange(period)

    const data = await Appointment.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    res.json({ success: true, count: data.length, data })
  } catch (err) {
    next(err)
  }
})

// GET /api/reports/tokens
router.get('/tokens', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as string) || 'month'
    const { start, end } = getPeriodRange(period)

    const data = await Token.aggregate([
      { $match: { issuedAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$issuedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    res.json({ success: true, count: data.length, data })
  } catch (err) {
    next(err)
  }
})

// GET /api/reports/top-doctors
router.get('/top-doctors', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await Appointment.aggregate([
      {
        $group: {
          _id: '$doctorId',
          appointmentCount: { $sum: 1 }
        }
      },
      { $sort: { appointmentCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      { $unwind: { path: '$doctor', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          appointmentCount: 1,
          doctorName: '$doctor.name',
          specialization: '$doctor.specialization'
        }
      }
    ])

    res.json({ success: true, count: data.length, data })
  } catch (err) {
    next(err)
  }
})

export default router
