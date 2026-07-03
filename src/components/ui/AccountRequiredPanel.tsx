import { Button, EmptyState } from '@hyperview/ui'
import { Plus } from 'lucide-react'

export function AccountRequiredPanel({ onOpenAccounts }: { onOpenAccounts: () => void }) {
  return (
    <EmptyState
      actions={
        <Button onClick={onOpenAccounts} size="sm">
          <Plus size={18} />
          Open accounts
        </Button>
      }
      description="Transactions and CSV imports need a destination account. Create your real accounts, then come back here."
      title="Add an account first"
    />
  )
}
