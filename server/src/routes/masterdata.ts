import { Router, Request, Response, NextFunction } from 'express'
import { protect } from '../middleware/auth'
import MasterData from '../models/MasterData'
import Pincode from '../models/Pincode'

const router = Router()

// GET /api/masterdata/pincode/:pin  — resolves an Indian PIN to its city/state.
// Lookup order: 1) Pincode collection in DB, 2) India Post API (then persisted to DB).
router.get('/pincode/:pin', protect, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pin = String(req.params.pin || '').trim()
    if (!/^\d{6}$/.test(pin)) {
      res.status(400).json({ success: false, message: 'PIN must be exactly 6 digits' })
      return
    }

    // 1) Try local Pincode collection first
    const existing = await Pincode.findOne({ pin }).lean()
    if (existing) {
      res.json({
        success: true,
        data: { pin, city: existing.city, state: existing.state, district: existing.district, source: 'db' },
      })
      return
    }

    // 2) Fall back to the India Post API (and persist on success)
    try {
      const upstream = await fetch(`https://api.postalpincode.in/pincode/${pin}`)
      if (upstream.ok) {
        const json = (await upstream.json()) as Array<{ Status: string; PostOffice?: Array<{ Name: string; District: string; State: string }> }>
        const entry = Array.isArray(json) ? json[0] : null
        if (entry && entry.Status === 'Success' && entry.PostOffice?.length) {
          const po = entry.PostOffice[0]
          const doc = await Pincode.findOneAndUpdate(
            { pin },
            { pin, city: po.District, district: po.District, state: po.State, country: 'India' },
            { upsert: true, new: true, setDefaultsOnInsert: true },
          ).lean()
          res.json({
            success: true,
            data: { pin, city: doc!.city, state: doc!.state, district: doc!.district, source: 'api' },
          })
          return
        }
      }
    } catch {
      // Upstream failure → fall through to 404 so the UI shows a clear message.
    }

    res.status(404).json({ success: false, message: 'PIN not found' })
  } catch (err) {
    next(err)
  }
})

// POST /api/masterdata/pincode/bulk  — bulk-load pincodes into the local table.
// Body: Array<{ pin, city, district, state, country? }>
router.post('/pincode/bulk', protect, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const entries = req.body as Array<{ pin: string; city: string; district: string; state: string; country?: string }>
    if (!Array.isArray(entries) || entries.length === 0) {
      res.status(400).json({ success: false, message: 'Body must be a non-empty array' })
      return
    }
    const ops = entries
      .filter(e => /^\d{6}$/.test(String(e.pin || '').trim()))
      .map(e => ({
        updateOne: {
          filter: { pin: e.pin },
          update: { $set: { pin: e.pin, city: e.city, district: e.district, state: e.state, country: e.country ?? 'India' } },
          upsert: true,
        },
      }))
    if (!ops.length) {
      res.status(400).json({ success: false, message: 'No valid pincode rows' })
      return
    }
    const result = await Pincode.bulkWrite(ops, { ordered: false })
    res.status(201).json({
      success: true,
      upserted: result.upsertedCount,
      modified: result.modifiedCount,
      matched:  result.matchedCount,
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/masterdata/categories  (must come before /:id)
router.get('/categories', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await MasterData.distinct('category')
    res.json({ success: true, count: categories.length, data: categories })
  } catch (err) {
    next(err)
  }
})

// GET /api/masterdata
router.get('/', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, isActive, search } = req.query
    const filter: Record<string, unknown> = {}

    if (category) filter.category = category
    if (isActive !== undefined) filter.isActive = isActive === 'true'
    if (search) filter.label = { $regex: String(search).trim(), $options: 'i' }

    const items = await MasterData.find(filter)
      .sort({ order: 1, label: 1 })
      .limit(search ? 20 : 0)

    res.json({ success: true, count: items.length, data: items })
  } catch (err) {
    next(err)
  }
})

// POST /api/masterdata/bulk
router.post('/bulk', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entries: Array<{ category: string; value: string; label: string }> = req.body

    if (!Array.isArray(entries) || entries.length === 0) {
      res.status(400).json({ success: false, message: 'Body must be a non-empty array' })
      return
    }

    const results = await MasterData.insertMany(entries, { ordered: false })
    res.status(201).json({ success: true, count: results.length, data: results })
  } catch (err) {
    next(err)
  }
})

// POST /api/masterdata
router.post('/', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await MasterData.create(req.body)
    res.status(201).json({ success: true, data: item })
  } catch (err) {
    next(err)
  }
})

// PUT /api/masterdata/:id
router.put('/:id', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { label, isActive, order } = req.body
    const updateFields: Record<string, unknown> = {}

    if (label !== undefined) updateFields.label = label
    if (isActive !== undefined) updateFields.isActive = isActive
    if (order !== undefined) updateFields.order = order

    const item = await MasterData.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true })

    if (!item) {
      res.status(404).json({ success: false, message: 'Master data entry not found' })
      return
    }

    res.json({ success: true, data: item })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/masterdata/:id
router.delete('/:id', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await MasterData.findByIdAndDelete(req.params.id)

    if (!item) {
      res.status(404).json({ success: false, message: 'Master data entry not found' })
      return
    }

    res.json({ success: true, data: {} })
  } catch (err) {
    next(err)
  }
})

export default router
