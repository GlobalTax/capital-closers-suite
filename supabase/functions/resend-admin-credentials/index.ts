import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Generar nueva contraseña temporal (8 caracteres: uppercase, lowercase, números)
    const generatePassword = () => {
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      
      const getRandomChar = (chars: string) => chars[Math.floor(Math.random() * chars.length)];
      
      let password = '';
      // Asegurar al menos 1 uppercase, 1 lowercase, 1 número
      password += getRandomChar(uppercase);
      password += getRandomChar(lowercase);
      password += getRandomChar(numbers);
      
      // Completar hasta 8 caracteres
      const allChars = uppercase + lowercase + numbers;
      for (let i = 0; i < 5; i++) {
        password += getRandomChar(allChars);
      }
      
      // Mezclar caracteres
      return password.split('').sort(() => Math.random() - 0.5).join('');
    };

    const temporaryPassword = generatePassword();

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
        message: 'Credenciales reenviadas correctamente'
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
