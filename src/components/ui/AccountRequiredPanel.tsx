import { Plus } from 'lucide-react'

export function AccountRequiredPanel({ onOpenAccounts }: { onOpenAccounts: () => void }) {
  return (
    <section className="panel empty-state">
      <h2>Add an account first</h2>
      <p>Transactions and CSV imports need a destination account. Create your real accounts, then come back here.</p>
      <button className="primary-action" onClick={onOpenAccounts} type="button">
        <Plus size={18} />
        Open accounts
      </button>
    </section>
  )
}
