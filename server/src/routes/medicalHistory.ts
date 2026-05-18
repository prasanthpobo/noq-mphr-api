import { Router, Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import { protect } from '../middleware/auth'
import User from '../models/User'

const router = Router()
router.use(protect)

// GET /api/medical-history — fetch all sections for current user
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id).select('conditions allergies medications')
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return }
    res.json({ success: true, data: { conditions: user.conditions, allergies: user.allergies, medications: user.medications } })
  } catch (err) { next(err) }
})

// ── Conditions ────────────────────────────────────────────────────────────────

router.post('/conditions', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, diagnosedAt, notes } = req.body
    if (!name?.trim()) { res.status(400).json({ success: false, message: 'Name is required' }); return }
    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { $push: { conditions: { name: name.trim(), diagnosedAt, notes } } },
      { new: true, select: 'conditions' }
    )
    res.status(201).json({ success: true, data: user!.conditions })
  } catch (err) { next(err) }
})

router.put('/conditions/:itemId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, diagnosedAt, notes } = req.body
    if (!mongoose.Types.ObjectId.isValid(req.params.itemId)) { res.status(400).json({ success: false, message: 'Invalid id' }); return }
    const update: Record<string, unknown> = {}
    if (name !== undefined) update['conditions.$.name'] = name.trim()
    if (diagnosedAt !== undefined) update['conditions.$.diagnosedAt'] = diagnosedAt
    if (notes !== undefined) update['conditions.$.notes'] = notes
    const user = await User.findOneAndUpdate(
      { _id: req.user!.id, 'conditions._id': req.params.itemId },
      { $set: update },
      { new: true, select: 'conditions' }
    )
    if (!user) { res.status(404).json({ success: false, message: 'Condition not found' }); return }
    res.json({ success: true, data: user.conditions })
  } catch (err) { next(err) }
})

router.delete('/conditions/:itemId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.itemId)) { res.status(400).json({ success: false, message: 'Invalid id' }); return }
    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { $pull: { conditions: { _id: new mongoose.Types.ObjectId(req.params.itemId) } } },
      { new: true, select: 'conditions' }
    )
    res.json({ success: true, data: user!.conditions })
  } catch (err) { next(err) }
})

// ── Allergies ─────────────────────────────────────────────────────────────────

router.post('/allergies', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, severity, reaction } = req.body
    if (!name?.trim()) { res.status(400).json({ success: false, message: 'Name is required' }); return }
    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { $push: { allergies: { name: name.trim(), severity, reaction } } },
      { new: true, select: 'allergies' }
    )
    res.status(201).json({ success: true, data: user!.allergies })
  } catch (err) { next(err) }
})

router.put('/allergies/:itemId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, severity, reaction } = req.body
    if (!mongoose.Types.ObjectId.isValid(req.params.itemId)) { res.status(400).json({ success: false, message: 'Invalid id' }); return }
    const update: Record<string, unknown> = {}
    if (name !== undefined) update['allergies.$.name'] = name.trim()
    if (severity !== undefined) update['allergies.$.severity'] = severity
    if (reaction !== undefined) update['allergies.$.reaction'] = reaction
    const user = await User.findOneAndUpdate(
      { _id: req.user!.id, 'allergies._id': req.params.itemId },
      { $set: update },
      { new: true, select: 'allergies' }
    )
    if (!user) { res.status(404).json({ success: false, message: 'Allergy not found' }); return }
    res.json({ success: true, data: user.allergies })
  } catch (err) { next(err) }
})

router.delete('/allergies/:itemId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.itemId)) { res.status(400).json({ success: false, message: 'Invalid id' }); return }
    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { $pull: { allergies: { _id: new mongoose.Types.ObjectId(req.params.itemId) } } },
      { new: true, select: 'allergies' }
    )
    res.json({ success: true, data: user!.allergies })
  } catch (err) { next(err) }
})

// ── Medications ───────────────────────────────────────────────────────────────

router.post('/medications', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, dose, frequency, since, notes } = req.body
    if (!name?.trim() || !dose?.trim() || !frequency?.trim() || !since?.trim()) {
      res.status(400).json({ success: false, message: 'Name, dose, frequency, and since are required' }); return
    }
    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { $push: { medications: { name: name.trim(), dose: dose.trim(), frequency: frequency.trim(), since: since.trim(), notes } } },
      { new: true, select: 'medications' }
    )
    res.status(201).json({ success: true, data: user!.medications })
  } catch (err) { next(err) }
})

router.put('/medications/:itemId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, dose, frequency, since, notes } = req.body
    if (!mongoose.Types.ObjectId.isValid(req.params.itemId)) { res.status(400).json({ success: false, message: 'Invalid id' }); return }
    const update: Record<string, unknown> = {}
    if (name !== undefined) update['medications.$.name'] = name.trim()
    if (dose !== undefined) update['medications.$.dose'] = dose.trim()
    if (frequency !== undefined) update['medications.$.frequency'] = frequency.trim()
    if (since !== undefined) update['medications.$.since'] = since.trim()
    if (notes !== undefined) update['medications.$.notes'] = notes
    const user = await User.findOneAndUpdate(
      { _id: req.user!.id, 'medications._id': req.params.itemId },
      { $set: update },
      { new: true, select: 'medications' }
    )
    if (!user) { res.status(404).json({ success: false, message: 'Medication not found' }); return }
    res.json({ success: true, data: user.medications })
  } catch (err) { next(err) }
})

router.delete('/medications/:itemId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.itemId)) { res.status(400).json({ success: false, message: 'Invalid id' }); return }
    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { $pull: { medications: { _id: new mongoose.Types.ObjectId(req.params.itemId) } } },
      { new: true, select: 'medications' }
    )
    res.json({ success: true, data: user!.medications })
  } catch (err) { next(err) }
})

export default router
