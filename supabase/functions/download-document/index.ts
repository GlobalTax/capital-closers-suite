import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1. Validate Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado - Token requerido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Verify authenticated user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('User validation error:', userError)
      return new Response(
        JSON.stringify({ error: 'No autorizado - Usuario no válido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Verify active admin (viewer, admin or super_admin)
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, role, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (adminError || !adminUser) {
      console.error('Admin validation error:', adminError)
      return new Response(
        JSON.stringify({ error: 'Acceso denegado - Se requieren permisos de administrador' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Parse request body
    const { filePath, bucket = 'mandato-documentos', expiresIn = 600 } = await req.json()

    if (!filePath) {
      return new Response(
        JSON.stringify({ error: 'Se requiere el parámetro filePath' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Validate allowed buckets
    const allowedBuckets = ['mandato-documentos', 'valuations']
    if (!allowedBuckets.includes(bucket)) {
      return new Response(
        JSON.stringify({ error: 'Bucket no permitido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Use Service Role to bypass RLS completely
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Clamp expiresIn between 60 seconds and 7 days (604800s)
    const validExpiresIn = Math.min(Math.max(60, expiresIn), 604800)

    console.log(`[SignedUrl] Generating signed URL for ${bucket}/${filePath} (expires in ${validExpiresIn}s)`)

    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin
      .storage
      .from(bucket)
      .createSignedUrl(filePath, validExpiresIn)

    if (signedUrlError) {
      console.error('[SignedUrl] Error generating signed URL:', signedUrlError)
      
      // Detectar 404 - archivo no existe
      const errorMessage = signedUrlError.message?.toLowerCase() || ''
      if (errorMessage.includes('not found') || errorMessage.includes('object not found') || errorMessage.includes('no existe')) {
        return new Response(
          JSON.stringify({ error: 'El archivo no existe', code: 'NOT_FOUND' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(
        JSON.stringify({ error: 'Error al generar URL firmada', details: signedUrlError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[SignedUrl] Signed URL generated successfully')

    return new Response(
      JSON.stringify({
        signedUrl: signedUrlData.signedUrl,
        expiresIn: validExpiresIn,
        expiresAt: new Date(Date.now() + validExpiresIn * 1000).toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
