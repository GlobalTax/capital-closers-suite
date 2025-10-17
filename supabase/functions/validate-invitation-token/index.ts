import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { token } = await req.json();

    if (!token) {
      throw new Error('Token es requerido');
    }

    // Buscar invitación
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('user_invitations')
      .select('*')
      .eq('invitation_token', token)
      .is('accepted_at', null)
      .single();

    if (invitationError || !invitation) {
      return new Response(
        JSON.stringify({
          error: 'Invitación no encontrada o ya ha sido utilizada',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar expiración
    const now = new Date();
    const expiresAt = new Date(invitation.token_expires_at);
    if (now > expiresAt) {
      return new Response(
        JSON.stringify({
          error: 'El token de invitación ha expirado',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Retornar datos de la invitación (sin el token)
    return new Response(
      JSON.stringify({
        invitation: {
          email: invitation.email,
          full_name: invitation.full_name,
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
    console.error('Error validando token:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Error al validar token',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
