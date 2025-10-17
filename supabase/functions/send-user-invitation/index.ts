import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

interface InvitationRequest {
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'editor' | 'viewer';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Crear clientes Supabase
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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No autorización proporcionada');
    }

    const supabaseAsUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabaseAsUser.auth.getUser();

    if (authError || !user) {
      throw new Error('No autenticado');
    }

    // Verificar que el usuario es super_admin
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser || adminUser.role !== 'super_admin') {
      throw new Error('Solo los super administradores pueden enviar invitaciones');
    }

    // Parsear request body
    const { email, full_name, role }: InvitationRequest = await req.json();

    // Validar datos
    if (!email || !full_name || !role) {
      throw new Error('Email, nombre completo y rol son requeridos');
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      throw new Error('Email inválido');
    }

    if (full_name.length < 2 || full_name.length > 100) {
      throw new Error('El nombre debe tener entre 2 y 100 caracteres');
    }

    const validRoles = ['super_admin', 'admin', 'editor', 'viewer'];
    if (!validRoles.includes(role)) {
      throw new Error('Rol inválido');
    }

    // Verificar si ya existe un usuario con ese email
    const { data: existingUser } = await supabaseAdmin
      .from('admin_users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new Error('Ya existe un usuario con ese email');
    }

    // Verificar si ya existe una invitación pendiente
    const { data: existingInvitation } = await supabaseAdmin
      .from('user_invitations')
      .select('id, email')
      .eq('email', email)
      .is('accepted_at', null)
      .single();

    if (existingInvitation) {
      throw new Error('Ya existe una invitación pendiente para este email');
    }

    // Generar token firmado usando la función SQL
    const { data: tokenData, error: tokenError } = await supabaseAdmin.rpc(
      'generate_invitation_token',
      { p_email: email }
    );

    if (tokenError || !tokenData) {
      console.error('Error generando token:', tokenError);
      throw new Error('Error al generar token de invitación');
    }

    const invitation_token = tokenData as string;

    // Crear registro de invitación
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('user_invitations')
      .insert({
        email,
        full_name,
        role,
        invited_by: user.id,
        invitation_token,
      })
      .select()
      .single();

    if (invitationError) {
      console.error('Error creando invitación:', invitationError);
      throw new Error('Error al crear invitación');
    }

    // Construir URL de aceptación
    const appUrl = Deno.env.get('APP_URL') || 'https://capittal.lovable.app';
    const acceptUrl = `${appUrl}/auth/accept-invitation?token=${encodeURIComponent(invitation_token)}`;

    // Enviar email de invitación
    const emailResponse = await resend.emails.send({
      from: 'Capittal <onboarding@resend.dev>',
      to: [email],
      subject: 'Invitación para unirte a Capittal',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitación a Capittal</title>
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
                          Invitación a Capittal
                        </h1>
                      </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                          Hola <strong>${full_name}</strong>,
                        </p>
                        <p style="margin: 0 0 20px; color: #555555; font-size: 15px; line-height: 1.6;">
                          Has sido invitado/a para unirte a <strong>Capittal</strong> con el rol de <strong>${role}</strong>.
                        </p>
                        <p style="margin: 0 0 30px; color: #555555; font-size: 15px; line-height: 1.6;">
                          Para aceptar la invitación y crear tu cuenta, haz clic en el siguiente botón:
                        </p>
                        
                        <!-- CTA Button -->
                        <table role="presentation" style="margin: 0 auto;">
                          <tr>
                            <td style="border-radius: 6px; background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%);">
                              <a href="${acceptUrl}" 
                                 style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                                Aceptar Invitación
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 30px 0 20px; color: #777777; font-size: 14px; line-height: 1.6;">
                          O copia y pega este enlace en tu navegador:
                        </p>
                        <p style="margin: 0 0 20px; padding: 12px; background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; word-break: break-all; color: #495057; font-size: 13px; font-family: monospace;">
                          ${acceptUrl}
                        </p>
                        
                        <p style="margin: 30px 0 0; padding-top: 20px; border-top: 1px solid #e9ecef; color: #999999; font-size: 13px; line-height: 1.6;">
                          <strong>⚠️ Importante:</strong> Este enlace expirará en 7 días.<br>
                          Si no solicitaste esta invitación, puedes ignorar este correo.
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

    console.log('Invitación enviada:', {
      email,
      invitation_id: invitation.id,
      email_id: emailResponse.data?.id,
    });

    // Registrar evento de auditoría
    await supabaseAdmin.from('admin_audit_log').insert({
      admin_user_id: user.id,
      action_type: 'INVITATION_SENT',
      target_user_email: email,
      new_values: {
        full_name,
        role,
        invitation_id: invitation.id,
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent'),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitación enviada correctamente',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expires_at: invitation.token_expires_at,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error en send-user-invitation:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Error al enviar invitación',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
