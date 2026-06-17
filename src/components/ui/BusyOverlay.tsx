import { LoaderCircle } from 'lucide-react'

type BusyOverlayProps = {
  active: boolean
  message?: string
}

export function BusyOverlay({ active, message = 'Working...' }: BusyOverlayProps) {
  if (!active) return null

  return (
    <div className="busy-overlay" role="status" aria-live="polite">
      <div className="busy-card">
        <LoaderCircle className="busy-spinner" size={22} />
        <span>{message}</span>
      </div>
    </div>
  )
}
