import { clsx } from 'clsx'

export function MoneyAmount({
  amount,
  neutral = false,
  cents = true,
}: {
  amount: number
  neutral?: boolean
  cents?: boolean
}) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  })
  const formatted = formatter.format(Math.abs(amount))
  const prefix = neutral ? (amount < 0 ? '-' : '') : amount > 0 ? '+' : amount < 0 ? '-' : ''

  return (
    <span className={clsx('money-amount', !neutral && amount > 0 && 'positive', !neutral && amount < 0 && 'negative')}>
      {prefix}
      {formatted}
    </span>
  )
}
