export function parseCurrency(value: string) {
  if (!value) return null
  const parsed = Number(value.replace(/[$,+\s]/g, '').replace(/^\((.*)\)$/, '-$1'))
  return Number.isNaN(parsed) ? null : parsed
}

export function formatSignedMoneyInput(amount: number) {
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : ''
  return `${sign}$${Math.abs(amount).toFixed(2)}`
}
