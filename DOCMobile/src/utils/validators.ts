/** Indian phone number — 10 digits, starts with 6–9 */
export function isValidPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''))
}

/** 6-digit OTP */
export function isValidOtp(otp: string): boolean {
  return /^\d{6}$/.test(otp)
}

/** MCI registration number — alphanumeric, 5–15 chars */
export function isValidMci(mci: string): boolean {
  return /^[A-Z0-9]{5,15}$/i.test(mci)
}

/** Non-empty string after trim */
export function isRequired(value: string): boolean {
  return value.trim().length > 0
}
