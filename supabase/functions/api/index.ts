import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

async function validateSession(supabase: any, sessionToken: string | null): Promise<boolean> {
  if (!sessionToken) return false

  const { data: session, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .gt('expires_at', new Date().toISOString())
    .single()

  return !error && !!session
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get session token from header
    const sessionToken = req.headers.get('x-session-token')
    
    // Validate session for all operations
    const isValid = await validateSession(supabase, sessionToken)
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { resource, action, data, id } = await req.json()
    console.log(`API request: ${resource}/${action}`)

    // Handle streamers operations
    if (resource === 'streamers') {
      switch (action) {
        case 'list': {
          const { data: streamers, error } = await supabase
            .from('streamers')
            .select('*')
            .order('host_crystals', { ascending: false })

          if (error) throw error
          return new Response(
            JSON.stringify({ data: streamers }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        case 'create': {
          const { data: newStreamer, error } = await supabase
            .from('streamers')
            .insert(data)
            .select()
            .single()

          if (error) throw error
          return new Response(
            JSON.stringify({ data: newStreamer }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        case 'update': {
          const { data: updated, error } = await supabase
            .from('streamers')
            .update(data)
            .eq('id', id)
            .select()
            .single()

          if (error) throw error
          return new Response(
            JSON.stringify({ data: updated }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        case 'delete': {
          const { error } = await supabase
            .from('streamers')
            .delete()
            .eq('id', id)

          if (error) throw error
          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        case 'clear-monthly': {
          const { error } = await supabase
            .from('streamers')
            .update({
              luck_gifts: 0,
              exclusive_gifts: 0,
              host_crystals: 0,
              minutes: 0,
              effective_days: 0
            })
            .neq('id', '00000000-0000-0000-0000-000000000000')

          if (error) throw error
          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        default:
          return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
      }
    }

    // Handle snapshots operations
    if (resource === 'snapshots') {
      switch (action) {
        case 'list': {
          const { data: snapshots, error } = await supabase
            .from('snapshots')
            .select('*')
            .order('snapshot_date', { ascending: false })

          if (error) throw error
          return new Response(
            JSON.stringify({ data: snapshots }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        case 'create': {
          const { data: newSnapshot, error } = await supabase
            .from('snapshots')
            .insert(data)
            .select()
            .single()

          if (error) throw error
          return new Response(
            JSON.stringify({ data: newSnapshot }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        case 'delete': {
          const { error } = await supabase
            .from('snapshots')
            .delete()
            .eq('id', id)

          if (error) throw error
          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        default:
          return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid resource' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    console.error('API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
