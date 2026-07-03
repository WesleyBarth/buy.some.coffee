import {
  Button,
  Checkbox,
  Field,
  Inline,
  Input,
  Label,
  Panel,
  PanelBody,
  PanelHeader,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from '@hyperview/ui'
import { ArrowDownToLine } from 'lucide-react'
import type { Account, CsvPreviewRow } from '../../domain/types'
import { AccountRequiredPanel } from '../ui/AccountRequiredPanel'
import { MoneyAmount } from '../ui/MoneyAmount'

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
    <Stack gap="sm">
      {accounts.length === 0 ? (
        <AccountRequiredPanel onOpenAccounts={onOpenAccounts} />
      ) : (
        <Panel>
          <PanelHeader
            description="Upload exports with date, description, and amount columns. Debit/credit columns are also supported."
            heading="CSV import"
          />
          <PanelBody padding="sm">
          <Inline align="end" gap="sm" wrap>
            <Field>
              <Label>Destination account</Label>
              <Select
                onChange={(event) => onSelectedAccountChange(event.target.value)}
                selectSize="sm"
                value={selectedAccountId}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label>CSV file</Label>
              <Input
                accept=".csv,text/csv"
                inputSize="sm"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) onParseCsv(file)
                }}
                type="file"
              />
            </Field>
            <Button disabled={selectedRowCount === 0} onClick={onImportRows} size="sm">
              <ArrowDownToLine size={18} />
              Import {selectedRowCount || ''} rows
            </Button>
          </Inline>
          </PanelBody>
        </Panel>
      )}
      {csvRows.length > 0 && (
        <TableFrame
          density="compact"
          heading="Preview"
          toolbar={<Text size="sm" tone="muted">Duplicates skipped on import</Text>}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Import</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Description</TableHeaderCell>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell align="right">Amount</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
            {csvRows.slice(0, 20).map((row) => (
              <TableRow selected={row.shouldImport} key={row.id}>
                <TableCell>
                  <Checkbox
                    aria-label={`Import ${row.description}`}
                    checked={row.shouldImport}
                    onChange={(event) => onUpdateCsvRow(row.id, { shouldImport: event.target.checked })}
                  />
                </TableCell>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.description}</TableCell>
                <TableCell>
                  <Select
                    aria-label={`Category for ${row.description}`}
                    onChange={(event) => onUpdateCsvRow(row.id, { category: event.target.value })}
                    selectSize="sm"
                    value={row.category}
                  >
                    {[...new Set([...categoryLabels, row.category])].map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </Select>
                </TableCell>
                <TableCell align="right">
                  <MoneyAmount amount={row.amount} />
                </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </TableFrame>
      )}
    </Stack>
  )
}
