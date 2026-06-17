import { jsonResponse, optionsResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin, requireUser } from '../_shared/auth.ts'

type CommitRequest = {
  plaid_item_id?: string
  next_cursor?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  try {
    const user = await requireUser(req)
    const body = (await req.json()) as CommitRequest
    if (!body.plaid_item_id) return jsonResponse({ error: 'Missing plaid_item_id' }, 400)
    if (!body.next_cursor) return jsonResponse({ error: 'Missing next_cursor' }, 400)

    const supabase = getSupabaseAdmin()
    const syncedAt = new Date().toISOString()
    const { error } = await supabase
      .from('plaid_items')
      .update({
        transactions_cursor: body.next_cursor,
        last_transaction_sync_at: syncedAt,
        updated_at: syncedAt,
      })
      .eq('id', body.plaid_item_id)
      .eq('user_id', user.id)

    if (error) throw new Error(error.message)

    return jsonResponse({
      plaid_item_id: body.plaid_item_id,
      last_transaction_sync_at: syncedAt,
    })
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unable to commit Plaid cursor' }, 400)
  }
})
