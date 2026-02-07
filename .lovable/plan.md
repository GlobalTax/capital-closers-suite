

# Fix: Fases "Due Diligence" y "Cierre" sin tareas en Sell-Side + Mejora UI

## Diagnostico

Las fases "4. Due Diligence" y "5. Cierre" existen en `checklist_fases` para Sell-Side pero **no tienen tareas plantilla** en `mandato_checklist_templates`. Buy-Side si tiene tareas para ambas fases (10 en DD, 8 en Cierre).

## Cambios a realizar

### 1. Insertar tareas plantilla para Sell-Side (datos)

Se insertaran tareas plantilla adaptadas al contexto Sell-Side (el vendedor facilita la DD, no la ejecuta):

**4. Due Diligence (8 tareas):**
| Orden | Tarea | Critica | Dias |
|-------|-------|---------|------|
| 1 | Coordinar kick-off de Due Diligence | Si | 1 |
| 2 | Facilitar acceso al Data Room | Si | 3 |
| 3 | Responder Q&A de compradores | No | 14 |
| 4 | Coordinar management presentations | Si | 5 |
| 5 | Gestionar solicitudes adicionales de info | No | 10 |
| 6 | Monitorizar avance de DD | No | 14 |
| 7 | Revisar hallazgos y preparar respuestas | Si | 7 |
| 8 | Informe resumen DD para el cliente | Si | 3 |

**5. Cierre (8 tareas):**
| Orden | Tarea | Critica | Dias |
|-------|-------|---------|------|
| 1 | Analizar ofertas vinculantes recibidas | Si | 5 |
| 2 | Negociar terminos del SPA | Si | 14 |
| 3 | Definir ajustes de precio y earn-outs | Si | 7 |
| 4 | Coordinar asesores legales del vendedor | No | 7 |
| 5 | Gestionar condiciones suspensivas | Si | 14 |
| 6 | Preparar closing checklist | No | 3 |
| 7 | Firma del SPA | Si | 1 |
| 8 | Closing y transferencia | Si | 1 |

### 2. Mejorar UI de fases sin tareas

En el componente `ChecklistPhaseCard.tsx`, cuando `total === 0`:
- Mostrar un icono distinto (un circulo vacio en vez del reloj)
- Mostrar texto "Sin tareas" en lugar de "0/0 tareas"
- Aplicar estilo visual mas tenue (opacidad reducida)

En el Accordion de `ChecklistDynamicCard.tsx`, linea 307-310:
- Mejorar el mensaje "No hay tareas en esta fase" con un call-to-action para crear una tarea manual

## Archivos afectados

| Archivo | Accion |
|---------|--------|
| Datos (INSERT via tool) | Insertar 16 tareas plantilla para Sell-Side |
| `src/components/mandatos/ChecklistPhaseCard.tsx` | Mejorar visualizacion cuando total=0 |
| `src/components/mandatos/ChecklistDynamicCard.tsx` | Mejorar empty state por fase |

## Lo que NO cambia

- No se modifican mandatos existentes (las nuevas tareas solo se aplican al copiar plantilla en mandatos nuevos)
- No se cambia la estructura de datos ni el schema
- No se agregan features nuevas

