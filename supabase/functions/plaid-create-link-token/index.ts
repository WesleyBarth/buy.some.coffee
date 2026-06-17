import { jsonResponse, optionsResponse } from '../_shared/cors.ts'
import { requireUser } from '../_shared/auth.ts'
import { createLinkToken } from '../_shared/plaid.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  try {
    const user = await requireUser(req)
    const data = await createLinkToken(user.id)
    return jsonResponse({
      link_token: data.link_token,
      expiration: data.expiration,
      request_id: data.request_id,
    })
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unable to create Link token' }, 400)
  }
})
