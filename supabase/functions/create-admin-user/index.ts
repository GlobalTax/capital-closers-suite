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
    
    // Cliente impersonado con el JWT del usuario para que auth.uid() funcione en triggers
    const supabaseAsUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { 
          headers: { Authorization: `Bearer ${token}` } 
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
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

    console.log(`Processing user creation for: ${email}`)

    // 1. Verificar si el email ya existe en auth.users
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = existingUsers?.users?.find(u => u.email === email)

    if (authUser) {
      console.log(`User ${email} already exists in auth.users, checking admin_users...`)
      
      // El usuario existe en auth.users, verificar si tiene registro en admin_users
      const { data: adminUser } = await supabaseAdmin
        .from('admin_users')
        .select('user_id')
        .eq('email', email)
        .single()

      if (adminUser) {
        // Usuario ya existe completamente en ambas tablas
        console.log(`User ${email} already exists in both tables`)
        return new Response(
          JSON.stringify({ error: 'Este email ya está registrado como usuario administrador' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Usuario huérfano: existe en auth.users pero no en admin_users
      console.log(`Orphan user detected: ${email}, linking to admin_users...`)

      // Resetear contraseña del usuario existente y confirmar email
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        authUser.id,
        {
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name,
            needs_credentials: true
          }
        }
      )

      if (updateError) {
        console.error('Error updating orphan user:', updateError)
        return new Response(
          JSON.stringify({ error: `Error al actualizar usuario: ${updateError.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Crear registro en admin_users con el user_id existente
      // Usar supabaseAsUser para que auth.uid() esté disponible en triggers
      const { error: dbError } = await supabaseAsUser
        .from('admin_users')
        .insert({
          user_id: authUser.id,
          email,
          full_name,
          role,
          is_active: true,
          needs_credentials: true
        })

      if (dbError) {
        console.error('Error linking orphan user to admin_users:', dbError)
        return new Response(
          JSON.stringify({ error: `Error al vincular usuario: ${dbError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // El trigger de admin_users ya creó el audit log automáticamente

      console.log(`Orphan user linked successfully: ${email}`)

      return new Response(
        JSON.stringify({
          user_id: authUser.id,
          email,
          temporary_password: tempPassword,
          message: `Usuario vinculado exitosamente (usuario huérfano reparado).`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Usuario no existe en auth.users, proceder con creación normal
    console.log(`Creating new user in auth.users: ${email}`)

    // 2. Crear usuario en auth.users usando Admin API
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

    // 3. Crear registro en admin_users con el user_id real
    // Usar supabaseAsUser para que auth.uid() esté disponible en triggers
    const { error: dbError } = await supabaseAsUser
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

    // El trigger de admin_users ya creó el audit log automáticamente

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
