import { jsonResponse, optionsResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin, requireUser } from '../_shared/auth.ts'
import { getAccountBalances, type PlaidAccount } from '../_shared/plaid.ts'

type RefreshRequest = {
  plaid_item_id?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  try {
    const user = await requireUser(req)
    const body = (await req.json()) as RefreshRequest
    if (!body.plaid_item_id) return jsonResponse({ error: 'Missing plaid_item_id' }, 400)

    const supabase = getSupabaseAdmin()
    const { data: item, error: itemError } = await supabase
      .from('plaid_items')
      .select('id, user_id')
      .eq('id', body.plaid_item_id)
      .eq('user_id', user.id)
      .single()

    if (itemError || !item) throw new Error(itemError?.message ?? 'Plaid item not found')

    const { data: secret, error: secretError } = await supabase
      .from('plaid_item_secrets')
      .select('access_token')
      .eq('plaid_item_id', item.id)
      .single()

    if (secretError || !secret?.access_token) throw new Error(secretError?.message ?? 'Plaid token not found')

    const balanceResult = await getAccountBalances(secret.access_token)
    const now = new Date().toISOString()
    const accountRows = balanceResult.accounts.map((account) => toPlaidAccountRow(user.id, item.id, account, now))

    const { error: accountsError } = await supabase
      .from('plaid_accounts')
      .upsert(accountRows, { onConflict: 'user_id,plaid_account_id' })

    if (accountsError) throw new Error(accountsError.message)

    const { error: updateError } = await supabase
      .from('plaid_items')
      .update({
        status: 'active',
        error_code: null,
        error_message: null,
        last_successful_sync_at: now,
        updated_at: now,
      })
      .eq('id', item.id)

    if (updateError) throw new Error(updateError.message)

    return jsonResponse({
      plaid_item_id: item.id,
      accounts: balanceResult.accounts.map(toPreviewAccount),
      request_id: balanceResult.request_id,
    })
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unable to refresh Plaid accounts' }, 400)
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
