import type { RxLine as RxLineType } from '@/types'

interface RxLineProps {
  line: RxLineType
  index: number
  onChange: (index: number, patch: Partial<RxLineType>) => void
  onRemove: (index: number) => void
  showRemove?: boolean
}

const FREQUENCY_OPTIONS = [
  { value: 'OD', label: 'OD — Once daily' },
  { value: 'BD', label: 'BD — Twice daily' },
  { value: 'TDS', label: 'TDS — Three times' },
  { value: 'QID', label: 'QID — Four times' },
  { value: 'SOS', label: 'SOS — When needed' },
]

export function RxLine({ line, index, onChange, onRemove, showRemove = true }: RxLineProps) {
  return (
    <div className="bg-surface rounded-xl p-3 space-y-2">
      {/* Drug name row */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-primary-dark w-5 shrink-0">{index + 1}.</span>
        <input
          type="text"
          value={line.medicine}
          onChange={(e) => onChange(index, { medicine: e.target.value })}
          placeholder="Medicine name"
          className="flex-1 bg-white px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
        {showRemove && (
          <button
            onClick={() => onRemove(index)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 tap-none"
          >
            <TrashIcon />
          </button>
        )}
      </div>

      {/* Dose / Frequency / Duration */}
      <div className="grid grid-cols-3 gap-2 pl-7">
        <input
          type="text"
          value={line.dose}
          onChange={(e) => onChange(index, { dose: e.target.value })}
          placeholder="Dose"
          className="bg-white px-2 py-1.5 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20"
        />
        <select
          value={line.frequency}
          onChange={(e) => onChange(index, { frequency: e.target.value })}
          className="bg-white px-2 py-1.5 rounded-lg text-xs outline-none appearance-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Freq</option>
          {FREQUENCY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.value}</option>
          ))}
        </select>
        <input
          type="text"
          value={line.duration}
          onChange={(e) => onChange(index, { duration: e.target.value })}
          placeholder="e.g. 5 days"
          className="bg-white px-2 py-1.5 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>
  )
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4M3 7h18" />
    </svg>
  )
}
