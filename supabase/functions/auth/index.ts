import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { action, password, sessionToken } = await req.json()
    console.log(`Auth action: ${action}`)

    // Get client info for session tracking
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    switch (action) {
      case 'login': {
        if (!password) {
          return new Response(
            JSON.stringify({ success: false, error: 'Password required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Fetch password from secure storage (service role bypasses RLS)
        const { data: settings, error: settingsError } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'global_password')
          .single()

        if (settingsError || !settings) {
          console.error('Error fetching password:', settingsError)
          return new Response(
            JSON.stringify({ success: false, error: 'Configuration error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Validate password server-side (password never exposed to client)
        if (settings.value !== password) {
          console.log('Invalid password attempt')
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid password' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Generate secure session token
        const newSessionToken = crypto.randomUUID()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30)

        // Create session with security metadata
        const { error: sessionError } = await supabase
          .from('user_sessions')
          .insert({
            session_token: newSessionToken,
            expires_at: expiresAt.toISOString(),
            ip_address: clientIp,
            user_agent: userAgent,
            last_validated_at: new Date().toISOString()
          })

        if (sessionError) {
          console.error('Error creating session:', sessionError)
          return new Response(
            JSON.stringify({ success: false, error: 'Session creation failed' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('Login successful, session created')
        return new Response(
          JSON.stringify({ success: true, sessionToken: newSessionToken }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'validate': {
        if (!sessionToken) {
          return new Response(
            JSON.stringify({ valid: false }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Check if session exists and is not expired
        const { data: session, error: sessionError } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('session_token', sessionToken)
          .gt('expires_at', new Date().toISOString())
          .single()

        if (sessionError || !session) {
          return new Response(
            JSON.stringify({ valid: false }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Update last validated timestamp
        await supabase
          .from('user_sessions')
          .update({ last_validated_at: new Date().toISOString() })
          .eq('session_token', sessionToken)

        return new Response(
          JSON.stringify({ valid: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'validate-password': {
        if (!password) {
          return new Response(
            JSON.stringify({ valid: false }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: settings, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'global_password')
          .single()

        if (error || !settings) {
          return new Response(
            JSON.stringify({ valid: false }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ valid: settings.value === password }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'logout': {
        if (sessionToken) {
          await supabase
            .from('user_sessions')
            .delete()
            .eq('session_token', sessionToken)
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Auth error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
