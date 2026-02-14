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

    // Permitir reenvío siempre (funciona como reset de contraseña)
    console.log(`Reenviando credenciales a: ${targetUser.email}`);

    // Rate limiting: verificar reenvíos recientes (no bloquear generación del enlace)
    let rateLimited = false;
    const { data: recentResends, error: resendError } = await supabaseAdmin
      .from('admin_audit_log')
      .select('id')
      .eq('target_user_id', user_id)
      .eq('action_type', 'CREDENTIALS_RESENT')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (resendError) {
      console.error('Rate limit check error:', resendError);
    } else if (recentResends && recentResends.length >= 5) {
      rateLimited = true;
      console.warn('Rate limit reached for user:', user_id);
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

    // Generar enlace de recuperación de contraseña
    let actionLink: string | null = null;
    try {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: targetUser.email,
        options: {
          redirectTo: 'https://capittal.es/auth/login'
        }
      });
      
      if (!linkError && linkData?.properties?.action_link) {
        actionLink = linkData.properties.action_link;
      }
    } catch (linkErr) {
      console.error('Error generating action link:', linkErr);
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

    // Variables para tracking del email (declaradas fuera del try para acceso global)
    let emailSent = false;
    let emailId: string | null = null;
    let emailErrorReason: string | null = null;
    let usedFallback = false;
    let finalFrom = 'Capittal <noreply@capittal.es>';

    // Preparar contenido del email
    const loginUrl = 'https://capittal.es/auth/login';
    const emailText = `Hola ${targetUser.full_name || 'Usuario'},

Se han generado nuevas credenciales de acceso para tu cuenta en Capittal.

Email: ${targetUser.email}
Contraseña temporal: ${temporaryPassword}

${actionLink ? `También puedes restablecer tu contraseña con este enlace:\n${actionLink}\n\n` : ''}Accede aquí: ${loginUrl}

Por seguridad, deberás cambiar esta contraseña en tu primer acceso.

Si no solicitaste este cambio, por favor contacta con soporte inmediatamente.

Saludos,
El equipo de Capittal`;

    // Enviar email con credenciales (omitir si está rate-limited)
    if (!rateLimited) {
      try {
      const emailHtml = `<p style="margin: 0 0 20px; color: #333; font-size: 16px; line-height: 1.6;">
  Hola <strong>${targetUser.full_name || 'Usuario'}</strong>,
</p>

<p style="margin: 0 0 20px; color: #333; font-size: 16px; line-height: 1.6;">
  Se han generado nuevas credenciales de acceso para tu cuenta en Capittal.
</p>

<div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
  <p style="margin: 0 0 10px; color: #666; font-size: 14px;"><strong>Email:</strong></p>
  <p style="margin: 0 0 20px; color: #333; font-size: 16px; font-weight: 600;">${targetUser.email}</p>
  
  <p style="margin: 0 0 10px; color: #666; font-size: 14px;"><strong>Contraseña temporal:</strong></p>
  <p style="margin: 0; color: #333; font-size: 16px; font-weight: 600; font-family: 'Courier New', monospace; word-break: break-all;">
    ${temporaryPassword}
  </p>
</div>

${actionLink ? `
<p style="margin: 20px 0; color: #333; font-size: 14px;">
  También puedes restablecer tu contraseña con este enlace:
</p>
<p style="margin: 0 0 20px;">
  <a href="${actionLink}" style="color: #667eea; text-decoration: underline; word-break: break-all;">${actionLink}</a>
</p>
` : ''}

<div style="text-align: center; margin: 30px 0;">
  <a href="${loginUrl}" style="display: inline-block; padding: 14px 32px; background-color: #667eea; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
    Iniciar Sesión
  </a>
</div>

<div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
  <p style="margin: 0; color: #856404; font-size: 14px;">
    <strong>⚠️ Importante:</strong> Por seguridad, deberás cambiar esta contraseña en tu primer acceso.
  </p>
</div>

<p style="margin: 20px 0 0; color: #666; font-size: 14px;">
  Si no solicitaste este cambio, por favor contacta con soporte inmediatamente.
</p>

<p style="margin: 20px 0 0; color: #999; font-size: 12px; text-align: center; border-top: 1px solid #e9ecef; padding-top: 20px;">
  © ${new Date().getFullYear()} Capittal. Este es un correo automático.
</p>`;

      // Enviar desde capittal.es (dominio verificado)
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'Capittal <noreply@capittal.es>',
        to: [targetUser.email],
        subject: 'Tus credenciales de acceso - Capittal',
        text: emailText,
        html: emailHtml,
      });

      if (emailError) {
        console.error('Email send error (primer intento):', emailError);
        const isDomainError = emailError.message?.includes('domain') || 
                             emailError.message?.includes('not verified') ||
                             (emailError as any).statusCode === 403;

        if (isDomainError) {
          // Fallback: intentar con dominio verificado de Resend
          console.log('Dominio no verificado, usando fallback a onboarding@resend.dev');
          emailErrorReason = 'domain_not_verified';
          finalFrom = 'Capittal via Resend <onboarding@resend.dev>';

          const fallbackHtml = `<div style="background-color: #fff3cd; padding: 15px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
  <p style="margin: 0; color: #856404; font-size: 13px;">
    ⚠️ Este email se envía desde un dominio temporal porque <strong>capittal.es</strong> no está verificado en Resend.
  </p>
</div>
${emailHtml}`;

          const { data: fallbackData, error: fallbackError } = await resend.emails.send({
            from: finalFrom,
            to: [targetUser.email],
            subject: 'Tus credenciales de acceso - Capittal',
            text: emailText,
            html: fallbackHtml,
          });

          if (fallbackError) {
            console.error('Fallback email también falló:', fallbackError);
            emailErrorReason = 'send_failed_after_fallback';
            
            // Logear el fallo del fallback
            await supabaseAdmin
              .from('admin_audit_log')
              .insert({
                admin_user_id: user.id,
                action_type: 'EMAIL_SEND_FAILED',
                target_user_id: user_id,
                target_user_email: targetUser.email,
                new_values: {
                  error: fallbackError.message,
                  error_reason: emailErrorReason,
                  from: finalFrom,
                  tried_fallback: true,
                  timestamp: new Date().toISOString()
                }
              });
          } else {
            // Fallback exitoso
            emailSent = true;
            emailId = fallbackData?.id || null;
            usedFallback = true;
            console.log(`Email sent via fallback to ${targetUser.email}:`, fallbackData);
          }
        } else {
          // Error no relacionado con dominio
          emailErrorReason = 'send_failed';
          
          await supabaseAdmin
            .from('admin_audit_log')
            .insert({
              admin_user_id: user.id,
              action_type: 'EMAIL_SEND_FAILED',
              target_user_id: user_id,
              target_user_email: targetUser.email,
              new_values: {
                error: emailError.message,
                error_reason: emailErrorReason,
                from: finalFrom,
                timestamp: new Date().toISOString()
              }
            });
        }
      } else {
        // Primer intento exitoso
        emailSent = true;
        emailId = emailData?.id || null;
        console.log(`Email sent successfully to ${targetUser.email}:`, emailData);
      }
    } catch (emailException) {
      console.error('Email exception:', emailException);
      emailErrorReason = 'exception';
      // Continuar aunque falle el email
    }
    } else {
      // No enviar email por límite alcanzado, pero devolver credenciales y enlace para compartir manualmente
      emailSent = false;
      emailErrorReason = 'rate_limited';
    }
    // Actualizar timestamp de credentials_sent_at
    await supabaseAdmin
      .from('admin_users')
      .update({ credentials_sent_at: new Date().toISOString() })
      .eq('user_id', user_id);

    // Log de auditoría completo
    await supabaseAdmin
      .from('admin_audit_log')
      .insert({
        admin_user_id: user.id,
        action_type: 'CREDENTIALS_RESENT',
        target_user_id: user_id,
        target_user_email: targetUser.email,
        new_values: {
          credentials_resent_at: new Date().toISOString(),
          resent_by: user.email,
          email_sent: emailSent,
          email_id: emailId,
          provider: 'resend',
          from: finalFrom,
          used_fallback: usedFallback,
          error_reason: emailErrorReason,
          action_link_provided: !!actionLink,
          action_link_preview: actionLink ? actionLink.substring(0, 50) + '...' : null
        }
      });

    console.log(`Credentials resent for user ${targetUser.email} by ${user.email}`);

    return new Response(
      JSON.stringify({
        user_id: user_id,
        email: targetUser.email,
        credentials_sent_via_email: emailSent,
        email_sent: emailSent,
        email_id: emailId,
        provider: 'resend',
        from: finalFrom,
        used_fallback: usedFallback,
        error_reason: emailErrorReason,
          message: rateLimited
            ? 'Límite de reenvíos alcanzado. Se generó enlace para compartir manualmente.'
            : (emailSent 
              ? 'Credenciales reenviadas correctamente'
              : 'Credenciales generadas. Email falló pero el enlace de recuperación está disponible.'
            )
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
