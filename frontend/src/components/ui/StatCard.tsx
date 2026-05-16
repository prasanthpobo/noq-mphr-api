import Icon from './Icon'
import type { Tone } from '@/types'

interface StatCardProps {
  ic: string
  tone?: Tone | 'green'
  label: string
  value: string
  delta?: string
  up?: boolean
  foot?: string
  accent?: boolean
}

export default function StatCard({ ic, tone, label, value, delta, up, foot, accent }: StatCardProps) {
  return (
    <div className={`stat-card ${accent ? 'accent' : ''}`}>
      <div className="head">
        <div className={`ic ${tone ?? ''}`}>
          <Icon name={ic} size={18} />
        </div>
        {delta && (
          <div className={`delta ${up ? 'up' : 'down'}`}>
            <Icon name={up ? 'trendUp' : 'trendDown'} size={11} stroke={2.4} />
            {delta}
          </div>
        )}
      </div>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {foot && <div className="foot">{foot}</div>}
    </div>
  )
}
