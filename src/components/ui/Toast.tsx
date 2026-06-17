import { CheckCircle2, X } from 'lucide-react'

type ToastProps = {
  message: string
  onDismiss: () => void
}

export function Toast({ message, onDismiss }: ToastProps) {
  if (!message) return null

  return (
    <div className="toast-viewport" role="status" aria-live="polite">
      <div className="toast-card">
        <CheckCircle2 size={18} />
        <span>{message}</span>
        <button aria-label="Dismiss notification" className="toast-dismiss" onClick={onDismiss} type="button">
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
