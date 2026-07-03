import { Text } from '@hyperview/ui'

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

  const tone = neutral ? 'default' : amount < 0 ? 'danger' : amount > 0 ? 'accent' : 'default'

  return <Text as="span" tone={tone}>{prefix}{formatted}</Text>
}
