

# Plan: Securizar Edge Functions Internas

## Resumen

6 edge functions carecen de validacion de autorizacion. Ninguna verifica el JWT del usuario ni comprueba su rol en `admin_users`. Cualquier persona con el anon key podria invocarlas directamente.

## Estado Actual

| Funcion | verify_jwt (config) | Auth en codigo | Riesgo |
|---------|---------------------|----------------|--------|
| send-email | true (deprecated) | NINGUNA | ALTO - permite enviar emails |
| send-teaser-email | no aparece | NINGUNA | ALTO - envia teasers con adjuntos |
| process-email-queue | false | NINGUNA | ALTO - procesa cola de emails |
| task-health-check | true (deprecated) | NINGUNA | MEDIO - lee tareas del equipo |
| task-ai | true (deprecated) | NINGUNA | MEDIO - consume creditos AI |
| send-lead-confirmation | false | NINGUNA | MEDIO - envia emails de confirmacion |

## Solucion

### 1. Actualizar `supabase/config.toml`

Cambiar todas a `verify_jwt = false` (segun directrices del proyecto, la validacion se hace en codigo con `getClaims()`).

### 2. Patron de Autorizacion Comun

Cada funcion recibira un bloque de validacion al inicio:

```typescript
// 1. Verificar header Authorization
const authHeader = req.headers.get('Authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return new Response(
    JSON.stringify({ error: 'No autorizado: token requerido' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// 2. Crear cliente Supabase con el token del usuario
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: authHeader } },
});

// 3. Verificar usuario valido
const { data: { user }, error: userError } = await supabase.auth.getUser();
if (userError || !user) {
  return new Response(
    JSON.stringify({ error: 'No autorizado: token invalido' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// 4. Verificar rol admin/super_admin en admin_users
const supabaseAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const { data: adminUser, error: adminError } = await supabaseAdmin
  .from('admin_users')
  .select('role')
  .eq('user_id', user.id)
  .eq('is_active', true)
  .single();

if (adminError || !adminUser || !['admin', 'super_admin'].includes(adminUser.role)) {
  return new Response(
    JSON.stringify({ error: 'Permisos insuficientes: se requiere rol admin' }),
    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

### 3. Caso Especial: process-email-queue

Esta funcion es invocada por cron/scheduler (no por usuarios). Se validara de dos formas:
- Si viene con Authorization header: validar usuario admin como las demas
- Si viene sin Authorization: validar que el request incluya un secret interno (`CRON_SECRET`) como header para invocaciones automatizadas

```typescript
const authHeader = req.headers.get('Authorization');
const cronSecret = req.headers.get('x-cron-secret');
const expectedCronSecret = Deno.env.get('CRON_SECRET');

if (cronSecret && expectedCronSecret && cronSecret === expectedCronSecret) {
  // Invocacion valida por cron - continuar
} else if (authHeader?.startsWith('Bearer ')) {
  // Validar usuario admin (mismo patron que las demas)
} else {
  return 401;
}
```

### 4. Caso Especial: send-lead-confirmation

Esta funcion se invoca desde triggers/webhooks internos sin contexto de usuario. Se aplicara el mismo patron dual (cron secret o usuario admin).

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/config.toml` | Cambiar las 6 funciones a `verify_jwt = false` |
| `supabase/functions/send-email/index.ts` | Agregar validacion auth + rol admin |
| `supabase/functions/send-teaser-email/index.ts` | Agregar validacion auth + rol admin |
| `supabase/functions/process-email-queue/index.ts` | Agregar validacion dual (cron secret o admin) |
| `supabase/functions/task-health-check/index.ts` | Agregar validacion auth + rol admin |
| `supabase/functions/task-ai/index.ts` | Agregar validacion auth + rol admin |
| `supabase/functions/send-lead-confirmation/index.ts` | Agregar validacion dual (cron secret o admin) |

---

## Detalle por Funcion

### send-email
- Agregar bloque auth completo (4 pasos) despues del manejo de OPTIONS
- El `supabaseAdmin` que ya se usa para actualizar la cola se mantiene con SERVICE_ROLE_KEY
- El nuevo `supabase` con token de usuario solo se usa para verificar identidad

### send-teaser-email
- Agregar bloque auth completo (4 pasos) despues del manejo de OPTIONS
- El `supabase` existente con SERVICE_ROLE_KEY se renombra a `supabaseAdmin`
- Nuevo `supabase` con anon key + token para verificar usuario

### process-email-queue
- Agregar validacion dual (cron secret o admin)
- Nota: esta funcion llama a `send-email` con SERVICE_ROLE_KEY, asi que `send-email` tambien necesita aceptar service role como auth valida
- Solucion: en `send-email`, si el Bearer token corresponde al SERVICE_ROLE_KEY, se permite sin validar admin_users

### task-health-check
- Agregar bloque auth completo (4 pasos)
- Eliminar el `user_id` del body y usar `user.id` del token validado (mas seguro)

### task-ai
- Agregar bloque auth completo (4 pasos)
- Ya tiene validacion parcial en el frontend (`taskAI.service.ts`), pero falta en el backend

### send-lead-confirmation
- Agregar validacion dual (cron secret o admin)
- Se invoca desde codigo interno tras crear un lead, necesita permitir ambas vias

---

## Respuestas de Error Estandarizadas

| Codigo | Mensaje | Cuando |
|--------|---------|--------|
| 401 | `No autorizado: token requerido` | Sin header Authorization |
| 401 | `No autorizado: token invalido` | Token expirado o falso |
| 403 | `Permisos insuficientes: se requiere rol admin` | Usuario valido pero sin rol admin |

---

## Consideracion: Llamadas Internas entre Funciones

`process-email-queue` llama a `send-email` con `Authorization: Bearer ${supabaseServiceKey}`. Para que esto siga funcionando:
- En `send-email`, si `getUser()` falla (porque es un service role key, no un user token), verificar si el token es exactamente el SERVICE_ROLE_KEY como fallback
- Esto permite llamadas internas de funcion a funcion

```typescript
// En send-email: fallback para llamadas internas
const token = authHeader.replace('Bearer ', '');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (token === serviceRoleKey) {
  // Llamada interna de confianza - continuar sin verificar admin_users
} else {
  // Verificar usuario y rol admin
}
```

