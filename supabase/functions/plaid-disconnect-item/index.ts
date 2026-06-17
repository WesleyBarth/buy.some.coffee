import { jsonResponse, optionsResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin, requireUser } from '../_shared/auth.ts'
import { removeItem } from '../_shared/plaid.ts'

type DisconnectRequest = {
  plaid_item_id?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  try {
    const user = await requireUser(req)
    const body = (await req.json()) as DisconnectRequest
    if (!body.plaid_item_id) return jsonResponse({ error: 'Missing plaid_item_id' }, 400)

    const supabase = getSupabaseAdmin()
    const { data: item, error: itemError } = await supabase
      .from('plaid_items')
      .select('id, user_id, institution_name')
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

    await removeItem(secret.access_token)

    const { error: deleteError } = await supabase
      .from('plaid_items')
      .delete()
      .eq('id', item.id)
      .eq('user_id', user.id)

    if (deleteError) throw new Error(deleteError.message)

    return jsonResponse({
      plaid_item_id: item.id,
      institution_name: item.institution_name,
    })
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unable to disconnect Plaid item' }, 400)
  }
})
