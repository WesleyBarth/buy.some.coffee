import { requireEnv } from './auth.ts'

export type PlaidAccount = {
  account_id: string
  balances: {
    available: number | null
    current: number | null
    limit: number | null
    iso_currency_code: string | null
  }
  mask: string | null
  name: string
  official_name: string | null
  subtype: string | null
  type: string
}

export type PlaidTransaction = {
  account_id: string
  account_owner: string | null
  amount: number
  authorized_date: string | null
  date: string
  iso_currency_code: string | null
  merchant_name: string | null
  name: string
  payment_channel: string
  pending: boolean
  pending_transaction_id: string | null
  transaction_id: string
}

type PlaidItem = {
  item_id: string
  institution_id: string | null
  available_products?: string[]
  billed_products?: string[]
  consent_expiration_time?: string | null
  update_type?: string | null
}

type PlaidResponse<T> = T & {
  error_code?: string
  error_message?: string
  request_id?: string
}

function plaidBaseUrl() {
  const env = requireEnv('PLAID_ENV')
  if (env === 'production') return 'https://production.plaid.com'
  if (env === 'development') return 'https://development.plaid.com'
  return 'https://sandbox.plaid.com'
}

async function plaidPost<T>(path: string, body: Record<string, unknown>): Promise<PlaidResponse<T>> {
  const response = await fetch(`${plaidBaseUrl()}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: requireEnv('PLAID_CLIENT_ID'),
      secret: requireEnv('PLAID_SECRET'),
      ...body,
    }),
  })

  const data = (await response.json()) as PlaidResponse<T>
  if (!response.ok) {
    throw new Error(data.error_message ?? data.error_code ?? `Plaid request failed: ${response.status}`)
  }
  return data
}

export async function createLinkToken(userId: string) {
  return plaidPost<{
    link_token: string
    expiration: string
  }>('/link/token/create', {
    client_name: 'Buy Some Coffee',
    country_codes: ['US'],
    language: 'en',
    products: ['transactions'],
    user: {
      client_user_id: userId,
    },
  })
}

export async function exchangePublicToken(publicToken: string) {
  return plaidPost<{
    access_token: string
    item_id: string
  }>('/item/public_token/exchange', {
    public_token: publicToken,
  })
}

export async function getItem(accessToken: string) {
  return plaidPost<{
    item: PlaidItem
  }>('/item/get', {
    access_token: accessToken,
  })
}

export async function getAccountBalances(accessToken: string) {
  return plaidPost<{
    accounts: PlaidAccount[]
    item: PlaidItem
  }>('/accounts/balance/get', {
    access_token: accessToken,
  })
}

export async function removeItem(accessToken: string) {
  return plaidPost<Record<string, never>>('/item/remove', {
    access_token: accessToken,
  })
}

export async function syncTransactionsPage(accessToken: string, cursor?: string | null) {
  return plaidPost<{
    added: PlaidTransaction[]
    modified: PlaidTransaction[]
    removed: Array<{ account_id: string; transaction_id: string }>
    next_cursor: string
    has_more: boolean
  }>('/transactions/sync', {
    access_token: accessToken,
    cursor: cursor ?? null,
    count: 100,
  })
}

export async function syncAllTransactions(accessToken: string, cursor?: string | null) {
  const added: PlaidTransaction[] = []
  const modified: PlaidTransaction[] = []
  const removed: Array<{ account_id: string; transaction_id: string }> = []
  let nextCursor = cursor ?? null
  let hasMore = true
  let requestId: string | undefined
  let pageCount = 0

  while (hasMore && pageCount < 10) {
    const page = await syncTransactionsPage(accessToken, nextCursor)
    added.push(...page.added)
    modified.push(...page.modified)
    removed.push(...page.removed)
    nextCursor = page.next_cursor
    hasMore = page.has_more
    requestId = page.request_id
    pageCount += 1
  }

  return {
    added,
    modified,
    removed,
    next_cursor: nextCursor ?? '',
    has_more: hasMore,
    request_id: requestId,
    page_count: pageCount,
  }
}

export function normalizeInstitutionName(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object') return null
  const institution = (metadata as { institution?: unknown }).institution
  if (!institution || typeof institution !== 'object') return null
  const name = (institution as { name?: unknown }).name
  return typeof name === 'string' ? name : null
}
