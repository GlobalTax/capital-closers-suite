import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar que el usuario que llama es super_admin
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: callingUser } } = await supabaseAdmin.auth.getUser(token)

    if (!callingUser) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar que el usuario es super_admin
    const { data: adminUser } = await supabaseAdmin
      .from('admin_users')
      .select('role')
      .eq('user_id', callingUser.id)
      .single()

    if (adminUser?.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Solo los super administradores pueden crear usuarios' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { email, full_name, role } = await req.json()

    // Validar email
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generar contraseña temporal segura (20 caracteres)
    const tempPassword = generateSecurePassword()

    console.log(`Creating user with email: ${email}`)

    // 1. Crear usuario en auth.users usando Admin API
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        full_name,
        needs_credentials: true
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return new Response(
        JSON.stringify({ error: `Error al crear usuario: ${authError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`User created in auth.users with id: ${newUser.user.id}`)

    // 2. Crear registro en admin_users con el user_id real
    const { error: dbError } = await supabaseAdmin
      .from('admin_users')
      .insert({
        user_id: newUser.user.id,
        email,
        full_name,
        role,
        is_active: true,
        needs_credentials: true
      })

    if (dbError) {
      // Si falla la inserción en admin_users, eliminar el usuario de auth
      console.error('Error inserting admin_users, rolling back:', dbError)
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      
      return new Response(
        JSON.stringify({ error: `Error al crear registro de usuario: ${dbError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`User record created in admin_users`)

    // 3. Log de auditoría
    await supabaseAdmin
      .from('admin_audit_log')
      .insert({
        admin_user_id: callingUser.id,
        action_type: 'CREATE',
        target_user_id: newUser.user.id,
        target_user_email: email,
        new_values: { email, full_name, role }
      })

    console.log(`User created successfully: ${email}`)

    return new Response(
      JSON.stringify({
        user_id: newUser.user.id,
        email,
        temporary_password: tempPassword,
        message: `Usuario creado exitosamente. Contraseña temporal generada.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*'
  let password = ''
  const array = new Uint8Array(20)
  crypto.getRandomValues(array)
  
  for (let i = 0; i < 20; i++) {
    password += chars[array[i] % chars.length]
  }
  
  return password
}
