import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar que el usuario es super_admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: callerAdmin, error: callerError } = await supabaseAdmin
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (callerError || !callerAdmin || callerAdmin.role !== 'super_admin') {
      console.error('Permission error:', callerError);
      return new Response(
        JSON.stringify({ error: 'Solo super administradores pueden reenviar credenciales' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener datos del request
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que el usuario objetivo existe y necesita credenciales
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('admin_users')
      .select('user_id, email, full_name, needs_credentials, last_login')
      .eq('user_id', user_id)
      .single();

    if (targetError || !targetUser) {
      console.error('Target user error:', targetError);
      return new Response(
        JSON.stringify({ error: 'Usuario no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!targetUser.needs_credentials) {
      return new Response(
        JSON.stringify({ error: 'El usuario ya ha configurado sus credenciales' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: verificar reenvíos recientes
    const { data: recentResends, error: resendError } = await supabaseAdmin
      .from('admin_audit_log')
      .select('id')
      .eq('target_user_id', user_id)
      .eq('action_type', 'CREDENTIALS_RESENT')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (resendError) {
      console.error('Rate limit check error:', resendError);
    } else if (recentResends && recentResends.length >= 5) {
      return new Response(
        JSON.stringify({ error: 'Límite de reenvíos alcanzado (máximo 5 por día)' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generar nueva contraseña temporal usando función SQL con fallback
    let temporaryPassword: string | null = null;
    const { data: rpcPassword, error: passwordError } = await supabaseAdmin.rpc(
      'generate_secure_temp_password'
    ) as { data: string | null; error: any };

    if (!passwordError && rpcPassword) {
      temporaryPassword = rpcPassword;
    } else {
      console.log('RPC generate_secure_temp_password falló, usando fallback:', passwordError?.message);
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
      const arr = new Uint32Array(20);
      crypto.getRandomValues(arr);
      temporaryPassword = Array.from(arr, n => chars[n % chars.length]).join('') + '1!';
    }

    // Actualizar contraseña en Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { password: temporaryPassword }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Error al actualizar contraseña: ' + updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enviar email con credenciales
    try {
      const loginUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'https://fwhqtzkkvnjkazhaficj.lovableproject.com'}/auth/login`;
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Credenciales de Acceso - Capittal</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Bienvenido a Capittal</h1>
                      </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                          Hola <strong>${targetUser.full_name}</strong>,
                        </p>
                        
                        <p style="margin: 0 0 20px; color: #555555; font-size: 15px; line-height: 1.6;">
                          Se han generado nuevas credenciales de acceso para tu cuenta. Utiliza los siguientes datos para iniciar sesión:
                        </p>
                        
                        <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
                          <p style="margin: 0 0 12px; color: #333; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                            📧 Email
                          </p>
                          <p style="margin: 0 0 20px; color: #667eea; font-size: 16px; font-weight: 500;">
                            ${targetUser.email}
                          </p>
                          
                          <p style="margin: 0 0 12px; color: #333; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                            🔑 Contraseña Temporal
                          </p>
                          <p style="margin: 0; background-color: #ffffff; padding: 15px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 20px; font-weight: 600; color: #667eea; letter-spacing: 2px; border: 2px dashed #667eea;">
                            ${temporaryPassword}
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
                          Si tienes alguna pregunta o problema para acceder, no dudes en contactar con el equipo de soporte.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
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

      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'Capittal <noreply@capittal.es>',
        to: [targetUser.email],
        subject: '🔑 Tus nuevas credenciales de acceso - Capittal',
        html: emailHtml,
      });

      if (emailError) {
        console.error('Email send error:', emailError);
        // No fallar la petición si el email falla, pero logear el error
        await supabaseAdmin
          .from('admin_audit_log')
          .insert({
            admin_user_id: user.id,
            action_type: 'EMAIL_SEND_FAILED',
            target_user_id: user_id,
            target_user_email: targetUser.email,
            new_values: {
              error: emailError.message,
              timestamp: new Date().toISOString()
            }
          });
      } else {
        console.log(`Email sent successfully to ${targetUser.email}:`, emailData);
      }
    } catch (emailError) {
      console.error('Email exception:', emailError);
      // Continuar aunque falle el email
    }

    // Actualizar timestamp de credentials_sent_at
    await supabaseAdmin
      .from('admin_users')
      .update({ credentials_sent_at: new Date().toISOString() })
      .eq('user_id', user_id);

    // Log de auditoría
    await supabaseAdmin
      .from('admin_audit_log')
      .insert({
        admin_user_id: user.id,
        action_type: 'CREDENTIALS_RESENT',
        target_user_id: user_id,
        target_user_email: targetUser.email,
        new_values: {
          credentials_resent_at: new Date().toISOString(),
          resent_by: user.email
        }
      });

    console.log(`Credentials resent for user ${targetUser.email} by ${user.email}`);

    return new Response(
      JSON.stringify({
        user_id: user_id,
        email: targetUser.email,
        temporary_password: temporaryPassword,
        message: 'Credenciales reenviadas correctamente y email enviado'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in resend-admin-credentials:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
