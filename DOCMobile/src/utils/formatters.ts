/** Format ISO date to readable string e.g. "20 May 2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Format ISO date to short form e.g. "20 May" */
export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

/** Format "HH:mm" to "9:30 AM" */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const date = new Date()
  date.setHours(h, m)
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

/** Calculate age from DOB ISO string */
export function calcAge(dob: string): number {
  const diff = Date.now() - new Date(dob).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

/** Pad token number e.g. 7 → "007" */
export function formatToken(n: number): string {
  return String(n).padStart(3, '0')
}
