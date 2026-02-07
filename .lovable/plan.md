

# Plan: Securizar `lead_type` en `send-lead-confirmation`

## Problema

En la linea 229, `lead_type` se pasa directamente a `.from(lead_type)`, lo que permite a un atacante con acceso al endpoint consultar/modificar cualquier tabla de Supabase si logra saltarse o tiene un token valido.

## Cambios en `supabase/functions/send-lead-confirmation/index.ts`

### 1. Whitelist estricta de `lead_type`

Agregar una constante con las 5 tablas permitidas y validar antes de usar:

```typescript
const ALLOWED_LEAD_TYPES = [
  'contact_leads',
  'general_contact_leads', 
  'company_valuations',
  'advisor_valuations',
  'acquisition_leads',
] as const;

type AllowedLeadType = typeof ALLOWED_LEAD_TYPES[number];
```

Validar justo despues de parsear el body (linea ~185):

```typescript
if (lead_type && !ALLOWED_LEAD_TYPES.includes(lead_type)) {
  return new Response(
    JSON.stringify({ error: `lead_type invalido: ${lead_type}` }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

Actualizar el tipo `LeadConfirmationRequest` para usar `AllowedLeadType` en vez de un union literal manual.

### 2. Rate limit simple por email

Usar un `Map<string, number[]>` en memoria para rastrear timestamps de requests por email. Limitar a 3 emails por direccion en una ventana de 5 minutos:

```typescript
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 min
const RATE_LIMIT_MAX = 3;

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(email) || [])
    .filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX) return false;
  timestamps.push(now);
  rateLimitMap.set(email, timestamps);
  return true;
}
```

Si se excede, devolver 429:

```typescript
if (!checkRateLimit(email)) {
  console.warn(`send-lead-confirmation: Rate limit exceeded for ${email}`);
  return new Response(
    JSON.stringify({ error: "Demasiadas solicitudes. Intenta de nuevo mas tarde." }),
    { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

> Nota: El rate limit en memoria se resetea con cada deploy/restart. Es suficiente para prevenir abuso basico en una herramienta interna con trafico externo limitado.

### 3. Logging mejorado

Agregar logs estructurados en puntos clave:
- Al recibir request: IP (via headers), email, lead_type
- En validacion fallida: motivo y datos recibidos
- En rate limit: email afectado
- En exito: lead_id, message_id

```typescript
const clientIP = req.headers.get("x-forwarded-for") || 
                 req.headers.get("cf-connecting-ip") || "unknown";
console.log(`send-lead-confirmation: Request from IP=${clientIP}, email=${email}, lead_type=${lead_type}`);
```

## Orden de validacion en el handler

1. CORS (OPTIONS)
2. Auth (validateInternalAuth)
3. Parse body
4. Validar campos requeridos (email, full_name)
5. **Validar lead_type contra whitelist** (nuevo)
6. **Rate limit por email** (nuevo)
7. Enviar email
8. Actualizar lead en DB (con lead_type ya validado)

## Archivo unico a modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/send-lead-confirmation/index.ts` | Whitelist, rate limit, logging |

