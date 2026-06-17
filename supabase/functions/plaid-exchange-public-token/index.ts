import { jsonResponse, optionsResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin, requireUser } from '../_shared/auth.ts'
import {
  exchangePublicToken,
  getAccountBalances,
  getItem,
  normalizeInstitutionName,
  type PlaidAccount,
} from '../_shared/plaid.ts'

type ExchangeRequest = {
  public_token?: string
  metadata?: unknown
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  try {
    const user = await requireUser(req)
    const body = (await req.json()) as ExchangeRequest
    if (!body.public_token) return jsonResponse({ error: 'Missing public_token' }, 400)

    const supabase = getSupabaseAdmin()
    const exchanged = await exchangePublicToken(body.public_token)
    const [itemResult, balanceResult] = await Promise.all([
      getItem(exchanged.access_token),
      getAccountBalances(exchanged.access_token),
    ])

    const plaidItem = itemResult.item
    const institutionName = normalizeInstitutionName(body.metadata)
    const now = new Date().toISOString()

    const { data: itemRow, error: itemError } = await supabase
      .from('plaid_items')
      .upsert(
        {
          user_id: user.id,
          plaid_item_id: exchanged.item_id,
          institution_id: plaidItem.institution_id,
          institution_name: institutionName,
          available_products: plaidItem.available_products ?? [],
          billed_products: plaidItem.billed_products ?? [],
          consent_expiration_time: plaidItem.consent_expiration_time,
          update_type: plaidItem.update_type,
          status: 'active',
          error_code: null,
          error_message: null,
          last_successful_sync_at: now,
          updated_at: now,
        },
        { onConflict: 'user_id,plaid_item_id' },
      )
      .select('id')
      .single()

    if (itemError || !itemRow) throw new Error(itemError?.message ?? 'Unable to store Plaid item')

    const { error: secretError } = await supabase.from('plaid_item_secrets').upsert({
      plaid_item_id: itemRow.id,
      access_token: exchanged.access_token,
      updated_at: now,
    })

    if (secretError) throw new Error(secretError.message)

    const accountRows = balanceResult.accounts.map((account) => toPlaidAccountRow(user.id, itemRow.id, account, now))
    const { error: accountsError } = await supabase
      .from('plaid_accounts')
      .upsert(accountRows, { onConflict: 'user_id,plaid_account_id' })

    if (accountsError) throw new Error(accountsError.message)

    return jsonResponse({
      plaid_item_id: itemRow.id,
      institution_name: institutionName,
      accounts: balanceResult.accounts.map(toPreviewAccount),
      request_id: exchanged.request_id,
    })
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unable to exchange Plaid token' }, 400)
  }
})

function toPlaidAccountRow(userId: string, itemId: string, account: PlaidAccount, syncedAt: string) {
  return {
    user_id: userId,
    plaid_item_id: itemId,
    plaid_account_id: account.account_id,
    name: account.name,
    official_name: account.official_name,
    account_type: account.type,
    account_subtype: account.subtype,
    mask: account.mask,
    iso_currency_code: account.balances.iso_currency_code,
    available_balance: account.balances.available,
    current_balance: account.balances.current,
    limit_amount: account.balances.limit,
    last_balance_sync_at: syncedAt,
    updated_at: syncedAt,
  }
}

function toPreviewAccount(account: PlaidAccount) {
  return {
    plaid_account_id: account.account_id,
    name: account.name,
    official_name: account.official_name,
    type: account.type,
    subtype: account.subtype,
    mask: account.mask,
    available_balance: account.balances.available,
    current_balance: account.balances.current,
    limit_amount: account.balances.limit,
    iso_currency_code: account.balances.iso_currency_code,
  }
}
