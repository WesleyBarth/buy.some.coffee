import { jsonResponse, optionsResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin, requireUser } from '../_shared/auth.ts'
import { syncAllTransactions, type PlaidTransaction } from '../_shared/plaid.ts'

type PreviewRequest = {
  plaid_item_id?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  try {
    const user = await requireUser(req)
    const body = (await req.json()) as PreviewRequest
    if (!body.plaid_item_id) return jsonResponse({ error: 'Missing plaid_item_id' }, 400)

    const supabase = getSupabaseAdmin()
    const { data: item, error: itemError } = await supabase
      .from('plaid_items')
      .select('id, user_id, transactions_cursor')
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

    const { data: plaidAccounts, error: plaidAccountsError } = await supabase
      .from('plaid_accounts')
      .select('plaid_account_id, linked_account_id, name')
      .eq('plaid_item_id', item.id)
      .eq('user_id', user.id)
      .not('linked_account_id', 'is', null)

    if (plaidAccountsError) throw new Error(plaidAccountsError.message)

    const linkedAccountByPlaidId = new Map(
      (plaidAccounts ?? []).map((account) => [
        account.plaid_account_id,
        {
          linkedAccountId: account.linked_account_id,
          plaidAccountName: account.name,
        },
      ]),
    )

    const synced = await syncAllTransactions(secret.access_token, item.transactions_cursor)
    const transactions = [
      ...synced.added.map((transaction) => toPreviewTransaction(transaction, 'added')),
      ...synced.modified.map((transaction) => toPreviewTransaction(transaction, 'modified')),
    ].filter((transaction) => Boolean(transaction))

    return jsonResponse({
      plaid_item_id: item.id,
      transactions,
      next_cursor: synced.next_cursor,
      has_more: synced.has_more,
      added_count: synced.added.length,
      modified_count: synced.modified.length,
      removed_count: synced.removed.length,
      page_count: synced.page_count,
      request_id: synced.request_id,
    })

    function toPreviewTransaction(transaction: PlaidTransaction, updateType: 'added' | 'modified') {
      const account = linkedAccountByPlaidId.get(transaction.account_id)
      if (!account) return null

      return {
        update_type: updateType,
        plaid_transaction_id: transaction.transaction_id,
        pending_transaction_id: transaction.pending_transaction_id,
        plaid_account_id: transaction.account_id,
        linked_account_id: account.linkedAccountId,
        plaid_account_name: account.plaidAccountName,
        date: transaction.date,
        authorized_date: transaction.authorized_date,
        description: transaction.merchant_name ?? transaction.name,
        original_description: transaction.name,
        amount: -transaction.amount,
        pending: transaction.pending,
        payment_channel: transaction.payment_channel,
        iso_currency_code: transaction.iso_currency_code,
      }
    }
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unable to preview Plaid transactions' }, 400)
  }
})
