import { Router, Request, Response, NextFunction } from 'express'
import { body, validationResult } from 'express-validator'
import crypto from 'crypto'
import User from '../models/User'
import { generateToken } from '../utils/generateToken'
import { protect } from '../middleware/auth'
import { normalizePhone, sendWactoOtp, sendWelcomeMessage } from '../utils/wacto'

/* ── Helpers ────────────────────────────────────────────────────────────── */
function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

/**
 * Return `true` when the server should include the generated OTP in the response
 * body so the client can show a "Dev Mode" auto-fill pill.
 *
 *   OTP_ENABLE=true       → always expose (use for staging / preview environments)
 *   OTP_ENABLE=false      → never expose (override even in development)
 *   OTP_ENABLE not set    → expose only when NODE_ENV !== 'production' (default)
 */
function shouldExposeOtp(): boolean {
  const raw = (process.env.OTP_ENABLE ?? '').trim().toLowerCase()
  if (raw === 'true'  || raw === '1' || raw === 'yes') return true
  if (raw === 'false' || raw === '0' || raw === 'no')  return false
  return process.env.NODE_ENV !== 'production'
}

function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

const router = Router()

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array()[0].msg })
      return
    }

    try {
      const { email, password } = req.body

      const user = await User.findOne({ email }).select('+password')
      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid email or password' })
        return
      }

      const isMatch = await user.matchPassword(password)
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid email or password' })
        return
      }

      if (user.status === 'inactive' || user.status === 'pending') {
        res.status(403).json({ success: false, message: 'Your account is not active. Please contact the administrator.' })
        return
      }

      const token = generateToken(user._id.toString(), user.role)

      res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          avatar: user.avatar,
          clinicId: user.clinicId
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn([
      'super_admin', 'clinic_admin', 'doctor', 'nurse', 'frontdesk', 'pharmacist', 'lab_tech'
    ]).withMessage('Invalid role')
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array()[0].msg })
      return
    }

    try {
      const { name, email, password, role, phone, clinicId } = req.body

      const existingUser = await User.findOne({ email })
      if (existingUser) {
        res.status(400).json({ success: false, message: 'A user with this email already exists' })
        return
      }

      const user = await User.create({
        name,
        email,
        password,
        role: role || 'clinic_admin',
        phone,
        clinicId: clinicId || undefined
      })

      const token = generateToken(user._id.toString(), user.role)

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          avatar: user.avatar,
          clinicId: user.clinicId
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

// POST /api/auth/patient-register
// Self-registration for patients. Creates a User with role="patient".
// A Patient record (clinic-linked) is created on first appointment booking.
router.post(
  '/patient-register',
  [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('phone').notEmpty().withMessage('Phone number is required').trim(),
    body('gender').isIn(['M', 'F', 'Other']).withMessage('Gender is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array()[0].msg })
      return
    }

    try {
      const { name, email, password, phone, gender, dob } = req.body

      const existingUser = await User.findOne({ email })
      if (existingUser) {
        res.status(400).json({ success: false, message: 'An account with this email already exists' })
        return
      }

      const user = await User.create({
        name,
        email,
        password,
        phone,
        gender,
        dob: dob ? new Date(dob) : undefined,
        role: 'patient',
        status: 'active',
      })

      const token = generateToken(user._id.toString(), user.role)

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          phone: user.phone,
          gender: user.gender,
          dob: user.dob,
          avatar: user.avatar,
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

// GET /api/auth/me
router.get(
  '/me',
  protect,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authorized' })
        return
      }

      const user = await User.findById(req.user.id)
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' })
        return
      }

      res.status(200).json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          avatar: user.avatar,
          phone: user.phone,
          gender: user.gender,
          dob: user.dob,
          bloodGroup: user.bloodGroup,
          height: user.height,
          weight: user.weight,
          clinicId: user.clinicId,
          createdAt: user.createdAt
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

// PUT /api/auth/me — update own profile
router.put(
  '/me',
  protect,
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty').trim(),
    body('email').optional().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
    body('phone').optional().trim(),
    body('gender').optional().isIn(['M', 'F', 'Other']).withMessage('Invalid gender'),
    body('dob').optional().isISO8601().withMessage('Invalid date format'),
    body('bloodGroup').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
    body('height').optional().isFloat({ min: 0 }).withMessage('Invalid height'),
    body('weight').optional().isFloat({ min: 0 }).withMessage('Invalid weight'),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array()[0].msg })
      return
    }
    try {
      const { name, email, phone, gender, dob, bloodGroup, height, weight } = req.body
      const update: Record<string, unknown> = {}
      if (name       !== undefined) update.name       = name
      if (phone      !== undefined) update.phone      = phone
      if (gender     !== undefined) update.gender     = gender
      if (dob        !== undefined) update.dob        = dob ? new Date(dob) : undefined
      if (bloodGroup !== undefined) update.bloodGroup = bloodGroup
      if (height     !== undefined) update.height     = height
      if (weight     !== undefined) update.weight     = weight
      if (email !== undefined) {
        // Check uniqueness — reject if another user already owns this email
        const conflict = await User.findOne({ email, _id: { $ne: req.user!.id } })
        if (conflict) {
          res.status(400).json({ success: false, message: 'This email is already in use by another account' })
          return
        }
        update.email = email
      }

      const user = await User.findByIdAndUpdate(req.user!.id, update, { new: true, runValidators: true })
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' })
        return
      }
      res.json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          avatar: user.avatar,
          phone: user.phone,
          gender: user.gender,
          dob: user.dob,
          bloodGroup: user.bloodGroup,
          height: user.height,
          weight: user.weight,
          clinicId: user.clinicId,
          createdAt: user.createdAt
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

// PUT /api/auth/change-password
router.put(
  '/change-password',
  protect,
  [
    body('oldPassword').notEmpty().withMessage('Old password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters')
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array()[0].msg })
      return
    }

    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authorized' })
        return
      }

      const user = await User.findById(req.user.id).select('+password')
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' })
        return
      }

      const { oldPassword, newPassword } = req.body

      const isMatch = await user.matchPassword(oldPassword)
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Old password is incorrect' })
        return
      }

      user.password = newPassword
      await user.save()

      res.status(200).json({ success: true, message: 'Password changed successfully' })
    } catch (error) {
      next(error)
    }
  }
)

// POST /api/auth/forgot-password
// Accepts email or phone. Generates a 6-digit OTP valid for 10 minutes.
router.post(
  '/forgot-password',
  [
    body('identifier')
      .notEmpty().withMessage('Email or mobile number is required')
      .trim()
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array()[0].msg })
      return
    }

    try {
      const { identifier } = req.body as { identifier: string }

      // Find by email or phone
      const user = await User.findOne({
        $or: [
          { email: identifier.toLowerCase().trim() },
          { phone: identifier.trim() }
        ]
      }).select('+resetOtp +resetOtpExpiry +resetOtpVerified')

      if (!user) {
        // Return generic message to prevent enumeration
        res.status(200).json({ success: true, message: 'If that account exists, an OTP has been sent.' })
        return
      }

      const otp        = generateOtp()
      const otpExpiry  = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      user.resetOtp         = otp
      user.resetOtpExpiry   = otpExpiry
      user.resetOtpVerified = false
      user.resetToken       = undefined
      user.resetTokenExpiry = undefined
      await user.save()

      // Send OTP via WhatsApp if user has a phone, otherwise fall back to console log
      if (user.phone) {
        const phone = normalizePhone(user.phone)
        await sendWactoOtp(phone, otp)
        console.log(`\n📱 [Reset OTP] +${phone}  Code: ${otp}\n`)
      } else {
        console.log(`\n📧 [Reset OTP] To: ${identifier}  Code: ${otp}  Expires: ${otpExpiry.toISOString()}\n`)
      }

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        ...(shouldExposeOtp() && { _dev_otp: otp }),
        maskedContact: user.phone
          ? user.phone.replace(/(\d{2})\d+(\d{2})$/, '$1******$2')
          : user.email!.replace(/(.{2}).+(@.+)/, '$1***$2'),
      })
    } catch (error) {
      next(error)
    }
  }
)

// POST /api/auth/verify-otp
// Verifies the OTP. On success returns a short-lived resetToken (15 min).
router.post(
  '/verify-otp',
  [
    body('identifier').notEmpty().withMessage('Identifier is required').trim(),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits').isNumeric()
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array()[0].msg })
      return
    }

    try {
      const { identifier, otp } = req.body as { identifier: string; otp: string }

      const user = await User.findOne({
        $or: [
          { email: identifier.toLowerCase().trim() },
          { phone: identifier.trim() }
        ]
      }).select('+resetOtp +resetOtpExpiry +resetOtpVerified +resetToken +resetTokenExpiry')

      if (!user || !user.resetOtp || !user.resetOtpExpiry) {
        res.status(400).json({ success: false, message: 'No OTP request found. Please request a new OTP.' })
        return
      }

      if (new Date() > user.resetOtpExpiry) {
        res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' })
        return
      }

      if (user.resetOtp !== otp) {
        res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' })
        return
      }

      const resetToken       = generateResetToken()
      const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

      user.resetOtp         = undefined
      user.resetOtpExpiry   = undefined
      user.resetOtpVerified = true
      user.resetToken       = resetToken
      user.resetTokenExpiry = resetTokenExpiry
      await user.save()

      res.status(200).json({ success: true, resetToken })
    } catch (error) {
      next(error)
    }
  }
)

// POST /api/auth/reset-password
// Uses the resetToken to set a new password.
router.post(
  '/reset-password',
  [
    body('resetToken').notEmpty().withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/).withMessage('Password must contain at least one number')
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array()[0].msg })
      return
    }

    try {
      const { resetToken, password } = req.body as { resetToken: string; password: string }

      const user = await User.findOne({
        resetToken,
        resetOtpVerified: true,
      }).select('+resetToken +resetTokenExpiry +resetOtpVerified +password')

      if (!user || !user.resetTokenExpiry) {
        res.status(400).json({ success: false, message: 'Invalid or expired reset link. Please start over.' })
        return
      }

      if (new Date() > user.resetTokenExpiry) {
        res.status(400).json({ success: false, message: 'Reset session has expired. Please start over.' })
        return
      }

      user.password         = password
      user.resetToken       = undefined
      user.resetTokenExpiry = undefined
      user.resetOtpVerified = false
      await user.save()

      res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' })
    } catch (error) {
      next(error)
    }
  }
)

// ── Registration OTP store (server-side, for users who don't exist yet) ──────
interface RegOtpEntry { otp: string; expiry: number }
const registerOtpStore = new Map<string, RegOtpEntry>()
const REGISTER_OTP_TTL = 5 * 60 * 1000  // 5 minutes

// POST /api/auth/send-register-otp
// Sends an OTP to a phone number that is NOT yet registered.
router.post(
  '/send-register-otp',
  [body('phone').notEmpty().withMessage('Phone number is required').trim()],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array()[0].msg })
      return
    }
    try {
      const raw   = (req.body as { phone: string }).phone
      const phone = normalizePhone(raw)

      const existing = await User.findOne({ phone: { $in: [phone, raw] } })
      if (existing) {
        res.status(400).json({ success: false, message: 'This mobile number is already registered. Please log in.' })
        return
      }

      const otp = generateOtp()
      registerOtpStore.set(phone, { otp, expiry: Date.now() + REGISTER_OTP_TTL })

      await sendWactoOtp(phone, otp)

      console.log(`\n📱 [Register OTP] +${phone}  Code: ${otp}\n`)

      res.status(200).json({
        success: true,
        message: `OTP sent to WhatsApp +${phone}`,
        ...(shouldExposeOtp() && { _dev_otp: otp }),
      })
    } catch (error) {
      next(error)
    }
  }
)

// POST /api/auth/otp-register
// Verifies register OTP and creates a new patient account.
router.post(
  '/otp-register',
  [
    body('name').notEmpty().withMessage('Full name is required').trim(),
    body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(),
    body('phone').notEmpty().withMessage('Phone number is required').trim(),
    body('gender').isIn(['M', 'F', 'Other']).withMessage('Gender is required'),
    body('dob').notEmpty().withMessage('Date of birth is required').isISO8601().withMessage('Invalid date'),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits'),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array()[0].msg })
      return
    }
    try {
      const { name, email, phone: rawPhone, gender, dob, otp } = req.body as {
        name: string; email: string; phone: string; gender: string; dob: string; otp: string
      }
      const phone  = normalizePhone(rawPhone)
      const entry  = registerOtpStore.get(phone)

      if (!entry) {
        res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' })
        return
      }
      if (Date.now() > entry.expiry) {
        registerOtpStore.delete(phone)
        res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' })
        return
      }
      if (entry.otp !== otp.trim()) {
        res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' })
        return
      }

      registerOtpStore.delete(phone)

      // Double-check phone & email not already taken (race condition guard)
      const existing = await User.findOne({ $or: [{ phone: { $in: [phone, rawPhone] } }, { email }] })
      if (existing) {
        const conflict = existing.phone === phone || existing.phone === rawPhone
          ? 'This mobile number is already registered. Please log in.'
          : 'This email address is already registered. Please log in.'
        res.status(400).json({ success: false, message: conflict })
        return
      }

      // Age validation (≥ 18)
      const dobDate = new Date(dob)
      const age18   = new Date()
      age18.setFullYear(age18.getFullYear() - 18)
      if (dobDate > age18) {
        res.status(400).json({ success: false, message: 'You must be at least 18 years old to register.' })
        return
      }

      // Create patient — random password (never exposed; OTP login only)
      const { randomBytes } = await import('crypto')
      const user = await User.create({
        name: name.trim(),
        email,
        phone,
        gender,
        dob: dobDate,
        role: 'patient',
        status: 'active',
        password: randomBytes(24).toString('hex'),
      })

      const token = generateToken(user._id.toString(), user.role)

      // Send welcome message fire-and-forget — never block or fail the response
      sendWelcomeMessage(phone, user.name).catch((e) =>
        console.error('[Welcome msg error]', e?.message)
      )

      res.status(201).json({
        success: true,
        token,
        user: {
          id:     user._id,
          name:   user.name,
          email:  user.email,
          role:   user.role,
          status: user.status,
          phone:  user.phone,
          gender: user.gender,
          dob:    user.dob,
          avatar: user.avatar,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

const LOGIN_OTP_TTL = 5 * 60 * 1000  // 5 minutes

// POST /api/auth/send-otp
// Generates a login OTP, stores it in the DB, and sends it via WhatsApp (Wacto).
router.post(
  '/send-otp',
  [body('phone').notEmpty().withMessage('Phone number is required').trim()],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array()[0].msg })
      return
    }

    try {
      const raw = (req.body as { phone: string }).phone
      const phone = normalizePhone(raw)

      let user = await User.findOne({ phone: { $in: [phone, raw] } })

      // Test-env convenience: when OTP_ENABLE=true and the phone isn't registered
      // yet, auto-provision a patient user so the OTP preview / login flow works
      // end-to-end without a separate registration step.
      if (!user && shouldExposeOtp()) {
        const last4 = phone.slice(-4)
        user = await User.create({
          phone,
          name: `Test User ${last4}`,
          email: `patient-${last4}@zerotoken.test`,
          role: 'patient',
          status: 'active',
          // Password is required by the schema but unused for phone-OTP login.
          password: crypto.randomBytes(16).toString('hex'),
        })
        console.log(`\n🆕 [Auto-provisioned test patient] +${phone} as ${user._id}\n`)
      }

      if (!user) {
        // Generic response to avoid enumeration — still send a 200
        res.status(200).json({ success: true, message: 'If that number is registered, an OTP has been sent.' })
        return
      }

      const otp    = generateOtp()
      const expiry = new Date(Date.now() + LOGIN_OTP_TTL)

      await User.findByIdAndUpdate(user._id, { loginOtp: otp, loginOtpExpiry: expiry })

      await sendWactoOtp(phone, otp)

      console.log(`\n📱 [Login OTP] +${phone}  Code: ${otp}\n`)

      res.status(200).json({
        success: true,
        message: `OTP sent to WhatsApp +${phone}`,
        ...(shouldExposeOtp() && { _dev_otp: otp }),
      })
    } catch (error) {
      next(error)
    }
  }
)

// POST /api/auth/phone-login
// Verifies the WhatsApp OTP and returns a JWT on success.
router.post(
  '/phone-login',
  [
    body('phone').notEmpty().withMessage('Phone number is required').trim(),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits'),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: errors.array()[0].msg })
      return
    }

    try {
      const { phone: rawPhone, otp } = req.body as { phone: string; otp: string }
      const phone = normalizePhone(rawPhone)

      const user = await User.findOne({ phone: { $in: [phone, rawPhone] } })
        .select('+loginOtp +loginOtpExpiry')

      if (!user || !user.loginOtp || !user.loginOtpExpiry) {
        res.status(400).json({ success: false, message: 'No OTP found for this number. Please request a new one.' })
        return
      }

      if (new Date() > user.loginOtpExpiry) {
        await User.findByIdAndUpdate(user._id, { $unset: { loginOtp: 1, loginOtpExpiry: 1 } })
        res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' })
        return
      }

      if (user.loginOtp !== otp.trim()) {
        res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' })
        return
      }

      // Consume the OTP
      await User.findByIdAndUpdate(user._id, { $unset: { loginOtp: 1, loginOtpExpiry: 1 } })

      if (user.status === 'inactive' || user.status === 'pending') {
        res.status(403).json({ success: false, message: 'Your account is not active. Please contact the administrator.' })
        return
      }

      const token = generateToken(user._id.toString(), user.role)

      res.status(200).json({
        success: true,
        token,
        user: {
          id:       user._id,
          name:     user.name,
          email:    user.email,
          role:     user.role,
          status:   user.status,
          avatar:   user.avatar,
          phone:    user.phone,
          gender:   user.gender,
          dob:      user.dob,
          clinicId: user.clinicId,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
