

# Plan Maestro de Mejoras - CapittalCRM

## Estado actual

El CRM cuenta con aproximadamente 50 paginas, 80+ componentes, 65+ servicios, 57 Edge Functions, y un sistema de permisos de 3 roles. La arquitectura es solida (React Query, lazy loading, BaseService, error handling centralizado), pero hay areas claras de mejora.

---

## FASE 1: Deuda Tecnica y Estabilidad (Prioridad Alta)

### 1.1 Tests unitarios (0 tests actualmente)

No existe ningun archivo `.test.ts` o `.test.tsx` en el proyecto. Se necesitan tests para:
- Servicios criticos: `mandatos.ts`, `empresas.ts`, `contactos.ts`
- Hooks de negocio: `useMandatos`, `useAuth`, `useChecklistTasks`
- Componentes complejos: `TargetCard`, `DataTable`, `CommandPalette`
- Utilidades: `error-handler.ts`, validators

### 1.2 Carpetas duplicadas

Existen dos carpetas con funcionalidad solapada:
- `src/components/tareas/` (3 archivos: drawers de tareas)
- `src/components/tasks/` (9 archivos: AI task components)

Estas deberian unificarse bajo una sola carpeta `tasks/` con subcarpetas si es necesario.

### 1.3 Seguridad de base de datos

El linter de Supabase reporta 103 issues:
- 2 errores de Security Definer Views
- Multiples funciones sin `search_path` configurado
- 1 materialized view expuesta en la API
- Multiples politicas RLS con `USING (true)` (demasiado permisivas)

Esto requiere una revision completa de las politicas RLS para asegurar que los datos sensibles (financieros, contactos) estan correctamente protegidos.

### 1.4 Confirmar acciones destructivas con `confirm()` nativo

En `src/pages/Outbound.tsx` (linea 51) se usa `confirm()` nativo del navegador en vez del componente `ConfirmDialog`. Revisar todo el proyecto y reemplazar por el componente estandar.

---

## FASE 2: UX y Productividad (Prioridad Alta)

### 2.1 Notificaciones en tiempo real

Solo 4 hooks usan Realtime de Supabase (empresas, contactos, alertas, search funds). Faltan suscripciones para:
- Mandatos (cambios de estado, nuevos targets)
- Tareas (asignaciones, completadas)
- Interacciones (nuevos registros)
- Documentos (subidas nuevas)

Ademas, no hay un indicador de notificaciones tipo "campana" en la Topbar con conteo de pendientes.

### 2.2 Undo/Redo global

Existe un hook `useUndoableAction` pero no esta integrado de forma consistente. Las acciones destructivas (eliminar tarea, desvincular target, borrar interaccion) deberian ofrecer un toast con "Deshacer" durante 5 segundos.

### 2.3 Breadcrumbs de navegacion

No hay breadcrumbs en las paginas de detalle. Al navegar a `/mandatos/:id`, el usuario pierde contexto de donde vino. Implementar breadcrumbs automaticos basados en la ruta.

### 2.4 Mejoras de accesibilidad

- No hay `aria-labels` consistentes en botones de icono
- Los atajos de teclado estan definidos pero no documentados visualmente en la UI (solo en el CommandPalette)
- Los estados de carga usan skeletons genericos que no representan la forma real del contenido

---

## FASE 3: Funcionalidad de Negocio (Prioridad Media)

### 3.1 Dashboard de Win/Loss

Existe `winLossAnalytics.service.ts` pero no hay una pagina dedicada. Crear un dashboard visual con:
- Tasa de conversion por tipo de mandato
- Razones de perdida mas comunes
- Tiempo promedio de cierre
- Tendencia mensual

### 3.2 Vista de P&L por mandato

Existen los servicios `mandatoCosts.service.ts` y `TransactionTable.tsx` pero la vista financiera integrada (ingresos vs costes vs margen) no esta consolidada como KPI principal en el detalle del mandato.

### 3.3 Enriquecimiento masivo con UI

El Edge Function `batch-enrich-companies` existe y la pagina `admin/EnrichmentDashboard` esta implementada. Pero falta:
- Cola visual con progreso en tiempo real
- Filtros para seleccionar que empresas enriquecer
- Preview de los datos que se van a sobrescribir (respetar `ai_fields_locked`)

### 3.4 Firma digital de NDA

Existe `ndaWorkflow.service.ts` y el Edge Function `send-nda-email`, pero el flujo esta incompleto. Falta:
- Template editor para el NDA
- Tracking de estado (Enviado, Visto, Firmado)
- Recordatorio automatico si no se firma en X dias

### 3.5 Reporte ejecutivo semanal automatizado

El Edge Function `generate-executive-report` existe. Falta:
- Programacion automatica (cron semanal)
- Seleccion de destinatarios
- Preview antes de enviar
- Historico de reportes enviados

---

## FASE 4: Rendimiento y Arquitectura (Prioridad Media)

### 4.1 Optimizacion de bundle

Con 50+ paginas lazy-loaded, revisar que:
- Los imports pesados (recharts, xlsx, jspdf, html2canvas) solo se cargan cuando se usan
- Los componentes compartidos grandes se splitean correctamente
- Se usa `React.memo` en componentes de lista que se renderizan muchas veces (TargetCard, MandatoCard)

### 4.2 Consolidar Zustand stores

Hay 3 stores (`useAppStore`, `useTimerStore`, `useUIStore`) pero muchos estados locales en componentes que podrian centralizarse:
- Estado de filtros de tablas (actualmente local por pagina)
- Preferencias de vista (lista vs kanban vs grid)

### 4.3 Migrar interacciones.ts legacy

Existen dos archivos de interacciones:
- `src/services/interacciones.ts` (funciones sueltas legacy)
- `src/services/interacciones.service.ts` (clase service moderna)

Migrar todo a la clase service y eliminar el archivo legacy.

---

## FASE 5: Funcionalidades Avanzadas (Prioridad Baja)

### 5.1 Modo offline basico

Para consultas en reunion sin WiFi:
- Cache de mandatos activos en localStorage
- Indicador online/offline en la topbar
- Cola de acciones pendientes que se sincronizan al reconectarse

### 5.2 A/B testing de emails outbound

El sistema de campaigns existe pero no tiene:
- Variantes de subject line por ola
- Metricas de apertura/click por variante
- Seleccion automatica de la mejor variante

### 5.3 Dashboard TV mejorado

La pagina existe pero podria mejorarse con:
- Auto-refresh con animaciones suaves
- Rotacion automatica de pantallas
- Modo "celebration" cuando se cierra un deal

### 5.4 Integracion de calendario con Google/Outlook

El calendario actual es interno. Sincronizar con calendarios externos para evitar duplicar reuniones.

---

## Resumen de prioridades

| Fase | Area | Esfuerzo | Impacto |
|---|---|---|---|
| 1.1 | Tests unitarios | Alto | Critico |
| 1.3 | Seguridad RLS | Medio | Critico |
| 1.2 | Unificar carpetas | Bajo | Medio |
| 1.4 | ConfirmDialog consistente | Bajo | Bajo |
| 2.1 | Notificaciones realtime | Medio | Alto |
| 2.3 | Breadcrumbs | Bajo | Medio |
| 3.1 | Dashboard Win/Loss | Medio | Alto |
| 3.2 | P&L por mandato | Medio | Alto |
| 3.5 | Reporte ejecutivo auto | Medio | Alto |
| 4.3 | Consolidar services legacy | Bajo | Medio |

