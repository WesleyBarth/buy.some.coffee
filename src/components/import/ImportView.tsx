import { ArrowDownToLine } from 'lucide-react'
import type { Account, CsvPreviewRow } from '../../domain/types'
import { AccountRequiredPanel } from '../ui/AccountRequiredPanel'
import { MoneyAmount } from '../ui/MoneyAmount'
import { DataTable, TablePanel } from '../ui/Table'

type ImportViewProps = {
  accounts: Account[]
  categoryLabels: string[]
  csvRows: CsvPreviewRow[]
  onImportRows: () => void
  onOpenAccounts: () => void
  onParseCsv: (file: File) => void
  onSelectedAccountChange: (accountId: string) => void
  onUpdateCsvRow: (rowId: string, patch: Partial<CsvPreviewRow>) => void
  selectedAccountId: string
}

export function ImportView({
  accounts,
  categoryLabels,
  csvRows,
  onImportRows,
  onOpenAccounts,
  onParseCsv,
  onSelectedAccountChange,
  onUpdateCsvRow,
  selectedAccountId,
}: ImportViewProps) {
  const selectedRowCount = csvRows.filter((row) => row.shouldImport).length

  return (
    <section className="view-stack">
      {accounts.length === 0 ? (
        <AccountRequiredPanel onOpenAccounts={onOpenAccounts} />
      ) : (
        <section className="panel import-panel">
          <div>
            <h2>CSV import</h2>
            <p>
              Upload exports with date, description, and amount columns. Debit/credit columns are also supported.
            </p>
          </div>
          <div className="import-controls">
            <label>
              Destination account
              <select onChange={(event) => onSelectedAccountChange(event.target.value)} value={selectedAccountId}>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="file-picker">
              <ArrowDownToLine size={18} />
              Choose CSV
              <input
                accept=".csv,text/csv"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) onParseCsv(file)
                }}
                type="file"
              />
            </label>
            <button
              className="primary-action"
              disabled={selectedRowCount === 0}
              onClick={onImportRows}
              type="button"
            >
              Import {selectedRowCount || ''} rows
            </button>
          </div>
        </section>
      )}
      {csvRows.length > 0 && (
        <TablePanel subtitle="Duplicates skipped on import" title="Preview">
          <DataTable
            columns={[
              { label: 'Import' },
              { label: 'Date' },
              { label: 'Description' },
              { label: 'Category' },
              { className: 'amount-cell', label: 'Amount' },
            ]}
          >
            {csvRows.slice(0, 20).map((row) => (
              <tr className={!row.shouldImport ? 'muted-row' : ''} key={row.id}>
                <td>
                  <input
                    checked={row.shouldImport}
                    onChange={(event) => onUpdateCsvRow(row.id, { shouldImport: event.target.checked })}
                    type="checkbox"
                  />
                </td>
                <td>{row.date}</td>
                <td>{row.description}</td>
                <td>
                  <select
                    onChange={(event) => onUpdateCsvRow(row.id, { category: event.target.value })}
                    value={row.category}
                  >
                    {[...new Set([...categoryLabels, row.category])].map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </td>
                <td className="amount-cell">
                  <MoneyAmount amount={row.amount} />
                </td>
              </tr>
            ))}
          </DataTable>
        </TablePanel>
      )}
    </section>
  )
}
