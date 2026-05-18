import api from './api'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  avatar?: string
  phone?: string
  gender?: 'M' | 'F' | 'Other'
  dob?: string
  clinicId?: string
  bloodGroup?: string
  height?: number
  weight?: number
}

export interface LoginResponse {
  success: boolean
  token: string
  user: AuthUser
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  phone?: string
  role?: string
  clinicId?: string
}

export interface PatientRegisterPayload {
  name: string
  email: string
  password: string
  phone: string
  gender: 'M' | 'F' | 'Other'
  dob?: string
}

export interface RegisterResponse {
  success: boolean
  token: string
  user: AuthUser
}

export interface MeResponse {
  success: boolean
  data: AuthUser & { createdAt?: string }
}

export interface ForgotPasswordResponse {
  success: boolean
  message: string
  maskedContact?: string
  _dev_otp?: string   // only in development
}

export interface VerifyOtpResponse {
  success: boolean
  resetToken: string
}

export interface ResetPasswordResponse {
  success: boolean
  message: string
}

export interface ChangePasswordResponse {
  success: boolean
  message: string
}

// ── Auth API calls ────────────────────────────────────────────────────────────

/** POST /auth/login — email + password */
export async function login(email: string, password: string): Promise<LoginResponse> {
  return api.post<never, LoginResponse>('/auth/login', { email, password })
}

/** POST /auth/register — create new staff user */
export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return api.post<never, RegisterResponse>('/auth/register', payload)
}

/** POST /auth/patient-register — self-registration for patients */
export async function patientRegister(payload: PatientRegisterPayload): Promise<RegisterResponse> {
  return api.post<never, RegisterResponse>('/auth/patient-register', payload)
}

/** GET /auth/me — fetch authenticated user profile */
export async function getMe(): Promise<MeResponse> {
  return api.get<never, MeResponse>('/auth/me')
}

export interface UpdateProfilePayload {
  name?: string
  phone?: string
  gender?: 'M' | 'F' | 'Other'
  dob?: string
  bloodGroup?: string
  height?: number
  weight?: number
}

/** PUT /auth/me — update own profile */
export async function updateProfile(payload: UpdateProfilePayload): Promise<MeResponse> {
  return api.put<never, MeResponse>('/auth/me', payload)
}

/**
 * POST /auth/forgot-password
 * Accepts email or phone as `identifier`. In dev the server logs the OTP
 * and returns `_dev_otp` in the response body.
 */
export async function forgotPassword(identifier: string): Promise<ForgotPasswordResponse> {
  return api.post<never, ForgotPasswordResponse>('/auth/forgot-password', { identifier })
}

/**
 * POST /auth/verify-otp
 * Verifies the 6-digit OTP. Returns a short-lived `resetToken` on success.
 */
export async function verifyOtp(identifier: string, otp: string): Promise<VerifyOtpResponse> {
  return api.post<never, VerifyOtpResponse>('/auth/verify-otp', { identifier, otp })
}

/**
 * POST /auth/reset-password
 * Sets a new password using the `resetToken` from verifyOtp.
 * Password must be ≥8 chars, contain an uppercase letter and a digit.
 */
export async function resetPassword(
  resetToken: string,
  password: string
): Promise<ResetPasswordResponse> {
  return api.post<never, ResetPasswordResponse>('/auth/reset-password', { resetToken, password })
}

/** PUT /auth/change-password — change password while logged in */
export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<ChangePasswordResponse> {
  return api.put<never, ChangePasswordResponse>('/auth/change-password', { oldPassword, newPassword })
}
