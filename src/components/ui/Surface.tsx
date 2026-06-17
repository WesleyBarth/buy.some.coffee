import type { ReactNode } from 'react'
import { clsx } from 'clsx'

type SurfaceProps = {
  actions?: ReactNode
  children: ReactNode
  className?: string
  eyebrow?: ReactNode
  title?: ReactNode
  variant?: 'panel' | 'table' | 'toolbar'
}

export function Surface({ actions, children, className, eyebrow, title, variant = 'panel' }: SurfaceProps) {
  const hasHeader = title || eyebrow || actions

  return (
    <section className={clsx('surface', `surface-${variant}`, className)}>
      {hasHeader && (
        <div className="surface-header">
          <div>
            {eyebrow && <span className="surface-eyebrow">{eyebrow}</span>}
            {title && <h2>{title}</h2>}
          </div>
          {actions && <div className="surface-actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('toolbar', className)}>{children}</div>
}
