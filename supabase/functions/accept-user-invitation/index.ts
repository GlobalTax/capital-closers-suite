import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

interface AcceptInvitationRequest {
  token: string;
  password: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Parsear request
    const { token, password }: AcceptInvitationRequest = await req.json();

    if (!token || !password) {
      throw new Error('Token y contraseña son requeridos');
    }

    // Validar contraseña (mínimo 12 caracteres, con complejidad)
    if (password.length < 12) {
      throw new Error('La contraseña debe tener al menos 12 caracteres');
    }

    if (!/[A-Z]/.test(password)) {
      throw new Error('La contraseña debe contener al menos una mayúscula');
    }

    if (!/[a-z]/.test(password)) {
      throw new Error('La contraseña debe contener al menos una minúscula');
    }

    if (!/[0-9]/.test(password)) {
      throw new Error('La contraseña debe contener al menos un número');
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      throw new Error('La contraseña debe contener al menos un carácter especial');
    }

    // Buscar invitación pendiente con este token
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('user_invitations')
      .select('*')
      .eq('invitation_token', token)
      .is('accepted_at', null)
      .single();

    if (invitationError || !invitation) {
      throw new Error('Invitación no encontrada o ya ha sido aceptada');
    }

    // Verificar que el token no ha expirado
    const now = new Date();
    const expiresAt = new Date(invitation.token_expires_at);
    if (now > expiresAt) {
      throw new Error('El token de invitación ha expirado');
    }

    // Validar token firmado usando la función SQL
    const { data: isValid, error: validationError } = await supabaseAdmin.rpc(
      'verify_invitation_token',
      {
        token: token,
        expected_email: invitation.email,
      }
    );

    if (validationError || !isValid) {
      console.error('Error validando token:', validationError);
      throw new Error('Token de invitación inválido');
    }

    // Verificar que no existe ya un usuario con este email
    const { data: existingUser } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('email', invitation.email)
      .single();

    if (existingUser) {
      throw new Error('Ya existe un usuario con este email');
    }

    // Crear usuario en auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: invitation.email,
      password: password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        full_name: invitation.full_name,
      },
    });

    if (authError || !authUser.user) {
      console.error('Error creando usuario en auth:', authError);
      throw new Error('Error al crear usuario: ' + (authError?.message || 'Unknown error'));
    }

    // Crear registro en admin_users
    const { error: adminUserError } = await supabaseAdmin.from('admin_users').insert({
      user_id: authUser.user.id,
      email: invitation.email,
      full_name: invitation.full_name,
      role: invitation.role,
      is_active: true,
      needs_credentials: false, // Ya estableció su contraseña
    });

    if (adminUserError) {
      console.error('Error creando admin_user:', adminUserError);
      
      // Rollback: eliminar usuario de auth
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      
      throw new Error('Error al crear perfil de usuario');
    }

    // Marcar invitación como aceptada
    const { error: updateError } = await supabaseAdmin
      .from('user_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Error actualizando invitación:', updateError);
    }

    // Registrar en log de auditoría
    await supabaseAdmin.from('admin_audit_log').insert({
      admin_user_id: authUser.user.id,
      action_type: 'INVITATION_ACCEPTED',
      target_user_email: invitation.email,
      new_values: {
        user_id: authUser.user.id,
        role: invitation.role,
        invited_by: invitation.invited_by,
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent'),
    });

    // Enviar email de bienvenida
    try {
      const appUrl = Deno.env.get('APP_URL') || 'https://capittal.lovable.app';
      
      await resend.emails.send({
        from: 'Capittal <onboarding@resend.dev>',
        to: [invitation.email],
        subject: '¡Bienvenido/a a Capittal!',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Bienvenido a Capittal</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 40px 0;">
                    <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%); padding: 40px; text-align: center;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                            ¡Bienvenido/a a Capittal!
                          </h1>
                        </td>
                      </tr>
                      
                      <!-- Body -->
                      <tr>
                        <td style="padding: 40px;">
                          <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                            Hola <strong>${invitation.full_name}</strong>,
                          </p>
                          <p style="margin: 0 0 20px; color: #555555; font-size: 15px; line-height: 1.6;">
                            Tu cuenta ha sido creada exitosamente. Ya puedes acceder a la plataforma con tu email y la contraseña que estableciste.
                          </p>
                          
                          <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #3b82f6; border-radius: 4px;">
                            <p style="margin: 0 0 10px; color: #333333; font-size: 14px; font-weight: 600;">
                              Detalles de tu cuenta:
                            </p>
                            <p style="margin: 5px 0; color: #555555; font-size: 14px;">
                              <strong>Email:</strong> ${invitation.email}
                            </p>
                            <p style="margin: 5px 0; color: #555555; font-size: 14px;">
                              <strong>Rol:</strong> ${invitation.role}
                            </p>
                          </div>
                          
                          <!-- CTA Button -->
                          <table role="presentation" style="margin: 30px auto;">
                            <tr>
                              <td style="border-radius: 6px; background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%);">
                                <a href="${appUrl}/auth/login" 
                                   style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                                  Iniciar Sesión
                                </a>
                              </td>
                            </tr>
                          </table>
                          
                          <p style="margin: 30px 0 0; padding-top: 20px; border-top: 1px solid #e9ecef; color: #999999; font-size: 13px; line-height: 1.6;">
                            Si necesitas ayuda, no dudes en contactar con el equipo de soporte.
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                          <p style="margin: 0; color: #777777; font-size: 13px;">
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
        `,
      });
    } catch (emailError) {
      console.error('Error enviando email de bienvenida:', emailError);
      // No lanzar error, el usuario ya fue creado exitosamente
    }

    console.log('Usuario creado exitosamente:', {
      user_id: authUser.user.id,
      email: invitation.email,
      role: invitation.role,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cuenta creada exitosamente',
        user: {
          id: authUser.user.id,
          email: authUser.user.email,
          full_name: invitation.full_name,
          role: invitation.role,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error en accept-user-invitation:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Error al aceptar invitación',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
