import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteUserRequest {
  user_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      console.error('❌ No Authorization header');
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cliente con JWT del usuario para verificar permisos
    const supabaseClient = createClient(
      supabaseUrl!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Cliente admin para operaciones de auth
    const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);

    // Verificar sesión del usuario que hace la petición
    const { data: { user: currentUser }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !currentUser) {
      console.error('❌ Error de autenticación:', authError);
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Usuario autenticado: ${currentUser.email}`);

    // Verificar que el usuario es super_admin
    const { data: adminData, error: adminError } = await supabaseClient
      .from('admin_users')
      .select('role, is_active')
      .eq('user_id', currentUser.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminData || adminData.role !== 'super_admin') {
      console.error('❌ Sin permisos: no es super_admin', { adminData, adminError });
      return new Response(
        JSON.stringify({ error: 'Solo super_admin puede eliminar usuarios' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parsear body
    const body: DeleteUserRequest = await req.json();
    const { user_id } = body;

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar que no se está eliminando a sí mismo
    if (user_id === currentUser.id) {
      console.error('❌ Intento de auto-eliminación');
      return new Response(
        JSON.stringify({ error: 'No puedes eliminar tu propio usuario' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Intentando eliminar usuario: ${user_id}`);

    // Obtener datos del usuario antes de eliminar (para logs)
    const { data: targetUser, error: getUserError } = await supabaseClient
      .from('admin_users')
      .select('email, full_name, role')
      .eq('user_id', user_id)
      .single();

    if (getUserError || !targetUser) {
      console.error('❌ Usuario no encontrado en admin_users:', getUserError);
      return new Response(
        JSON.stringify({ error: 'Usuario no encontrado en admin_users' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Usuario a eliminar: ${targetUser.email} (${targetUser.role})`);

    // PASO 1: Eliminar de auth.users (PRIMERO)
    console.log('🗑️ Eliminando de auth.users...');
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (deleteAuthError) {
      console.error('❌ Error al eliminar de auth.users:', deleteAuthError);
      return new Response(
        JSON.stringify({ 
          error: 'Error al eliminar usuario del sistema de autenticación',
          details: deleteAuthError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Usuario eliminado de auth.users');

    // PASO 2: Eliminar de admin_users
    console.log('🗑️ Eliminando de admin_users...');
    const { error: deleteAdminError } = await supabaseClient
      .from('admin_users')
      .delete()
      .eq('user_id', user_id);

    if (deleteAdminError) {
      console.error('⚠️ Error al eliminar de admin_users (pero ya se eliminó de auth):', deleteAdminError);
      // No lanzamos error porque ya eliminamos de auth, pero registramos el problema
    } else {
      console.log('✅ Usuario eliminado de admin_users');
    }

    // PASO 3: Registrar en audit log
    console.log('📝 Registrando en audit log...');
    const { error: auditError } = await supabaseClient
      .from('admin_audit_log')
      .insert({
        action_type: 'user_deleted',
        admin_user_id: currentUser.id,
        target_user_id: user_id,
        target_user_email: targetUser.email,
        new_values: {
          email: targetUser.email,
          full_name: targetUser.full_name,
          role: targetUser.role,
          deleted_at: new Date().toISOString(),
        },
      });

    if (auditError) {
      console.error('⚠️ Error al registrar en audit log:', auditError);
      // No lanzamos error, solo registramos
    } else {
      console.log('✅ Eliminación registrada en audit log');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuario eliminado permanentemente del sistema',
        deleted_user: {
          user_id,
          email: targetUser.email,
          full_name: targetUser.full_name,
          role: targetUser.role,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
