import { Router, Request, Response, NextFunction } from 'express'
import { protect } from '../middleware/auth'
import MasterData from '../models/MasterData'

const router = Router()

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
