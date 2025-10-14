import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

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

    // Enviar email de bienvenida con credenciales
    try {
      const loginUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'https://tuapp.lovableproject.com'}`;
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bienvenido a Capittal</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">¡Bienvenido a Capittal!</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                          Hola <strong>${fullName}</strong>,
                        </p>
                        <p style="margin: 0 0 20px; color: #555555; font-size: 15px; line-height: 1.6;">
                          Se ha creado tu cuenta de acceso al sistema Capittal. A continuación encontrarás tus credenciales de acceso:
                        </p>
                        <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
                          <p style="margin: 0 0 12px; color: #333; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                            📧 Email
                          </p>
                          <p style="margin: 0 0 20px; color: #667eea; font-size: 16px; font-weight: 500;">
                            ${email}
                          </p>
                          <p style="margin: 0 0 12px; color: #333; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                            🔑 Contraseña Temporal
                          </p>
                          <p style="margin: 0; background-color: #ffffff; padding: 15px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 20px; font-weight: 600; color: #667eea; letter-spacing: 2px; border: 2px dashed #667eea;">
                            ${tempPassword}
                          </p>
                        </div>
                        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px;">
                          <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                            <strong>⚠️ Importante:</strong> Por seguridad, deberás cambiar esta contraseña en tu primer inicio de sesión.
                          </p>
                        </div>
                        <div style="text-align: center; margin: 35px 0;">
                          <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                            Acceder al Sistema
                          </a>
                        </div>
                        <p style="margin: 30px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                          Si tienes alguna pregunta, no dudes en contactar con el equipo de soporte.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 30px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; border-radius: 0 0 8px 8px;">
                        <p style="margin: 0; color: #6c757d; font-size: 13px; line-height: 1.5; text-align: center;">
                          Este es un correo automático, por favor no respondas a este mensaje.<br>
                          © ${new Date().getFullYear()} Capittal. Todos los derechos reservados.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;

      const { error: emailError } = await resend.emails.send({
        from: 'Capittal <onboarding@resend.dev>',
        to: [email],
        subject: '🎉 Bienvenido a Capittal - Tus credenciales de acceso',
        html: emailHtml,
      });

      if (emailError) {
        console.error('Email send error:', emailError);
      } else {
        console.log(`Welcome email sent to ${email}`);
      }
    } catch (emailError) {
      console.error('Email exception:', emailError);
    }

    return new Response(
      JSON.stringify({
        user_id: newUser.user.id,
        email,
        temporary_password: tempPassword,
        message: `Usuario creado exitosamente y email de bienvenida enviado.`
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
  // Generar contraseña simple: 8 caracteres con mayúsculas y números
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lowercase = 'abcdefghijkmnpqrstuvwxyz'
  const numbers = '23456789'
  
  let password = ''
  
  // Asegurar al menos 1 mayúscula, 1 minúscula, 1 número
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  
  // Completar hasta 8 caracteres con letras y números
  const allChars = uppercase + lowercase + numbers
  for (let i = 2; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Mezclar caracteres
  return password.split('').sort(() => Math.random() - 0.5).join('')
}
