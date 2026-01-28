

## Plan: Arreglar Bug de Guardado de Interacciones

### Diagnóstico Confirmado

**Causa raíz identificada:** La política RLS de INSERT en la tabla `interacciones` requiere que `created_by = auth.uid()`, pero el código frontend no envía este campo.

```text
Tabla: interacciones
Error: RLS violation - "new row violates row-level security policy"
Policy: (current_user_can_read() AND (created_by = auth.uid()))

Payload actual:
{
  empresa_id: "xxx",
  mandato_id: "yyy", 
  tipo: "email",
  titulo: "Test",
  descripcion: "...",
  fecha: "2026-01-28T..."
  // ⚠️ FALTA: created_by: auth.uid()
}
```

---

### Solución: Añadir created_by al Payload

#### 1. Modificar InteraccionTimeline.tsx

```typescript
// Líneas 70-80 - Añadir created_by
const onSubmit = async (data: FormData) => {
  setSaving(true);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await createInteraccion({
      empresa_id: empresaId,
      mandato_id: mandatoId,
      tipo: data.tipo,
      titulo: data.titulo,
      descripcion: data.descripcion || undefined,
      fecha: new Date(data.fecha).toISOString(),
      created_by: user?.id,  // ✅ AÑADIR ESTO
    });
    // ...
  }
};
```

#### 2. Modificar NuevaInteraccionDialog.tsx

```typescript
// Líneas 39-61 - Añadir created_by
const onSubmit = async (data: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await createInteraccion({
      ...data,
      contacto_id: contactoId,
      empresa_id: empresaId,
      mandato_id: mandatoId,
      fecha: fecha.toISOString(),
      fecha_siguiente_accion: fechaSiguienteAccion?.toISOString().split('T')[0],
      duracion_minutos: data.duracion_minutos ? parseInt(data.duracion_minutos) : undefined,
      created_by: user?.id,  // ✅ AÑADIR ESTO
    });
    // ...
  }
};
```

---

### Alternativa: Mejora en el Servicio (Centralizada)

En lugar de modificar cada componente, centralizar la lógica en el servicio:

```typescript
// src/services/interacciones.ts - Líneas 55-64
export const createInteraccion = async (interaccion: Partial<Interaccion>) => {
  // Obtener usuario actual si no viene en el payload
  let created_by = interaccion.created_by;
  if (!created_by) {
    const { data: { user } } = await supabase.auth.getUser();
    created_by = user?.id;
  }

  const { data, error } = await supabase
    .from('interacciones')
    .insert({ ...interaccion, created_by } as any)
    .select()
    .single();
  
  if (error) throw error;
  return data as Interaccion;
};
```

**Ventaja:** Todos los componentes que usen `createInteraccion` funcionarán sin modificaciones adicionales.

---

### Resumen de Archivos a Modificar

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `src/services/interacciones.ts` | Añadir `created_by` automático en `createInteraccion()` | ✅ Opción preferida |
| `src/components/targets/InteraccionTimeline.tsx` | Añadir import de supabase + `created_by` | Alternativa |
| `src/components/shared/NuevaInteraccionDialog.tsx` | Añadir import de supabase + `created_by` | Alternativa |

---

### Pruebas Post-Fix

1. Abrir mandato → Tab Targets → Empresa → Timeline
2. Click "Nueva Interacción"
3. Rellenar tipo (Email), título, descripción
4. Click "Guardar Interacción"
5. Verificar:
   - Toast "Interacción registrada" ✅
   - Interacción aparece en timeline ✅
   - No hay errores en consola ✅
6. Repetir en perfil de empresa (NuevaInteraccionDialog)
7. Verificar que interacciones se listan correctamente

---

### Sección Técnica

**Por qué falla:**
- La tabla `interacciones` tiene RLS habilitado
- La política `interacciones_insert` valida: `created_by = auth.uid()`
- El campo `created_by` es nullable en la BD pero la policy lo requiere
- Sin `created_by`, la comparación `null = auth.uid()` es `false`

**Por qué la solución es segura:**
- Solo añade un campo que ya existe en el schema
- No modifica la estructura de la tabla
- No cambia las policies RLS
- Compatible con todos los componentes existentes
- El usuario siempre está autenticado en esta sección

