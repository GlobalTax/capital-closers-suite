
# Fix: Sincronizacion de plantillas checklist - constraint violation

## Causa raiz

La funcion RPC `sync_template_additions` inserta tareas con `estado = 'pendiente'` (texto plano), pero la constraint de la base de datos (`mandato_checklist_tasks_estado_check`) solo acepta estos valores exactos:

- `'⏳ Pendiente'`
- `'🔄 En curso'`
- `'✅ Completa'`

Esto causa el error: *"new row violates check constraint mandato_checklist_tasks_estado_check"*.

La columna ya tiene `NOT NULL` y `DEFAULT '⏳ Pendiente'`, pero como la funcion RPC especifica explicitamente el valor `'pendiente'`, el default no se aplica.

## Solucion

Un unico cambio: actualizar las dos funciones RPC para usar el valor correcto con emoji.

### Archivo: Nueva migracion SQL

Se recrearan las funciones `sync_template_additions` y `sync_template_full_reset` cambiando:

```
-- ANTES (incorrecto)
'pendiente'

-- DESPUES (correcto)
'⏳ Pendiente'
```

Esto se aplica en ambas funciones, en la linea del INSERT donde se asigna el estado.

### Detalle tecnico

- `sync_template_additions`: linea 48 del INSERT, cambiar `'pendiente'` a `'⏳ Pendiente'`
- `sync_template_full_reset`: linea 92 del SELECT, cambiar `'pendiente'` a `'⏳ Pendiente'`

No se modifican archivos de frontend ni logica de negocio. No se borran datos. No se alteran constraints ni columnas. Solo se corrige el valor literal en las dos funciones.

### Validacion

- La columna `estado` ya es `NOT NULL` con default `'⏳ Pendiente'` (correcto)
- Los 885 registros existentes ya tienen valores validos (700 Pendiente, 173 Completa, 12 En curso)
- No hay datos corruptos que normalizar
