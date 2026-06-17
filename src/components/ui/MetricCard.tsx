import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'

export function MetricGrid({
  children,
  className,
  minTileWidth = 220,
}: {
  children: ReactNode
  className?: string
  minTileWidth?: number
}) {
  return (
    <div
      className={clsx('metrics-grid', className)}
      style={{ '--metric-min-width': `${minTileWidth}px` } as CSSProperties}
    >
      {children}
    </div>
  )
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  tone = 'blue',
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  tone?: 'blue' | 'amber' | 'green'
}) {
  return (
    <section className={clsx('metric-card', tone)}>
      <div className="metric-card-header">
        <Icon size={20} />
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
    </section>
  )
}
