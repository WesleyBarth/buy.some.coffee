import type { ReactNode } from 'react'
import { clsx } from 'clsx'
import { BusyOverlay } from './BusyOverlay'

type TablePanelProps = {
  actions?: ReactNode
  busy?: boolean
  busyMessage?: string
  children: ReactNode
  className?: string
  fillViewport?: boolean
  subtitle?: ReactNode
  title: ReactNode
}

type TableColumn = {
  ariaLabel?: string
  className?: string
  label?: ReactNode
}

type DataTableProps = {
  children: ReactNode
  className?: string
  colGroup?: ReactNode
  columns: TableColumn[]
}

export function TablePanel({
  actions,
  busy = false,
  busyMessage,
  children,
  className,
  fillViewport = false,
  subtitle,
  title,
}: TablePanelProps) {
  return (
    <section
      aria-busy={busy}
      className={clsx('panel table-panel busy-surface', fillViewport && 'table-panel-fill', className)}
    >
      <div className="panel-heading">
        <h2>{title}</h2>
        {actions ?? (subtitle ? <span>{subtitle}</span> : null)}
      </div>
      <div className="table-scroll">{children}</div>
      <BusyOverlay active={busy} message={busyMessage} />
    </section>
  )
}

export function DataTable({ children, className, colGroup, columns }: DataTableProps) {
  return (
    <table className={className}>
      {colGroup}
      <thead>
        <tr>
          {columns.map((column, index) => (
            <th aria-label={column.ariaLabel} className={column.className} key={index}>
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  )
}

export function EmptyTableRow({ children, colSpan }: { children: ReactNode; colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <span className="quiet-cell">{children}</span>
      </td>
    </tr>
  )
}
