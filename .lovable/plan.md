

# Fase 8: Matching Automatico Compradores-Targets con IA

## Objetivo
Crear un sistema de matching semantico que analice los perfiles de compradores corporativos (`corporate_buyers`) y los compare con empresas target de mandatos de venta activos, generando recomendaciones priorizadas de conexiones con justificacion y score de compatibilidad.

## Por que NO usar embeddings vectoriales (y que hacer en su lugar)

Los embeddings requieren infraestructura adicional (pgvector, almacenamiento de vectores, pipeline de re-embedding). Para el volumen actual del CRM (cientos de compradores, no miles), un enfoque mas pragmatico y mantenible es:

1. **Pre-filtrado deterministico**: Descartar incompatibilidades obvias (sector, geografia, rango financiero) con queries SQL
2. **Scoring IA por lotes**: Enviar los candidatos pre-filtrados a `google/gemini-3-flash-preview` para evaluacion semantica profunda usando tool calling

Este enfoque es mas rapido de implementar, mas facil de depurar y escala bien hasta ~500 compradores.

## Arquitectura

```text
  [Boton "Buscar Matches" en mandato de venta]
         |
         v
  POST /match-buyers
         |
    1. Carga mandato de venta + empresa principal (sector, financials, descripcion)
    2. Carga todos los corporate_buyers activos
    3. Pre-filtro deterministico:
       - Sector overlap (sector_focus del buyer vs sector/ai_tags de empresa)
       - Geografia compatible (geography_focus vs ubicacion)
       - Rango financiero compatible (revenue/ebitda ranges)
    4. Envia top 30 candidatos pre-filtrados a Gemini
    5. IA evalua fit semantico considerando:
       - Investment thesis vs descripcion de empresa
       - Search keywords vs ai_tags / keywords
       - Sector exclusions (descarte)
       - Tamano y modelo de negocio
    6. Devuelve matches rankeados con score + justificacion
    7. Guarda en buyer_matches
    8. Log en ai_activity_log
         |
         v
  [Panel de Matches en MandatoDetalle]
```

## Datos usados para matching

### Del comprador (`corporate_buyers`)
| Campo | Uso |
|-------|-----|
| `sector_focus` (text[]) | Sectores de interes |
| `sector_exclusions` (text[]) | Sectores descartados |
| `geography_focus` (text[]) | Geografias objetivo |
| `revenue_min/max` | Rango de facturacion aceptado |
| `ebitda_min/max` | Rango de EBITDA aceptado |
| `deal_size_min/max` | Tamano de deal aceptado |
| `investment_thesis` (text) | Tesis de inversion (clave para matching semantico) |
| `search_keywords` (text[]) | Palabras clave de busqueda |
| `description` (text) | Descripcion general |
| `key_highlights` (text[]) | Aspectos destacados |

### De la empresa target (via `mandatos` + `empresas`)
| Campo | Uso |
|-------|-----|
| `sector`, `subsector` | Clasificacion sectorial |
| `ubicacion` | Geografia |
| `revenue`, `ebitda` | Datos financieros |
| `descripcion` | Descripcion de la empresa |
| `ai_company_summary` | Resumen generado por IA |
| `ai_tags`, `ai_business_model_tags` | Tags semanticos |
| `keywords` | Palabras clave |
| `empleados` | Tamano |
| `mandatos.valor` | Valor del mandato (proxy de deal size) |
| `mandatos.perfil_empresa_buscada` | Perfil buscado (para compra) |
| `mandatos.tipo_comprador_buscado` | Tipo de comprador preferido |

## Archivos a crear

### 1. Migracion: `buyer_matches`
Nueva tabla para guardar resultados de matching:
- `id` (uuid PK)
- `mandato_id` (uuid FK -> mandatos)
- `buyer_id` (uuid FK -> corporate_buyers)
- `match_score` (integer 0-100) - score de compatibilidad
- `match_reasoning` (text) - justificacion del modelo
- `fit_dimensions` (jsonb) - desglose: {sector_fit, financial_fit, geographic_fit, strategic_fit}
- `risk_factors` (text[]) - posibles incompatibilidades
- `recommended_approach` (text) - sugerencia de como abordar al comprador
- `status` (text default 'suggested') - suggested | contacted | dismissed | converted
- `dismissed_reason` (text) - motivo si se descarto
- `generated_at` (timestamptz)
- `generated_by` (uuid)
- `created_at` (timestamptz default now())

RLS: Lectura para usuarios autenticados, insert via service role.

### 2. `supabase/functions/match-buyers/index.ts`
Edge Function principal:
- Recibe `{ mandato_id }` + auth del usuario
- Valida que el mandato es de tipo "venta" y esta activo
- Carga empresa principal del mandato con todos los datos relevantes
- Carga todos los `corporate_buyers` activos
- Pre-filtrado deterministico en la Edge Function:
  - Elimina buyers cuyo `sector_exclusions` contenga el sector de la empresa
  - Filtra por overlap de `geography_focus` con `ubicacion` (si disponible)
  - Filtra por rango financiero compatible (revenue/ebitda del target dentro del rango del buyer)
- Construye prompt con datos del target + lista de candidatos pre-filtrados (max 30)
- Llama a `google/gemini-3-flash-preview` con tool calling (`evaluate_buyer_matches`)
- Extrae array de matches con score, reasoning, y dimensiones de fit
- Guarda resultados en `buyer_matches` (elimina matches anteriores del mismo mandato si se recalcula)
- Log en `ai_activity_log` (modulo: `buyer-matching`)
- Manejo de errores 429/402

### 3. `src/hooks/useBuyerMatching.ts`
- `useBuyerMatches(mandatoId)`: query para obtener matches de un mandato con datos del buyer joinados
- `useGenerateBuyerMatches()`: mutation para disparar el matching
- `useUpdateMatchStatus()`: mutation para cambiar status (contacted, dismissed, converted)
- Invalidacion de queries al completar

### 4. `src/components/mandatos/BuyerMatchingPanel.tsx`
Panel en la pagina de detalle del mandato (solo mandatos de venta):

**Seccion superior:**
- Boton "Buscar Compradores Compatibles" con icono Sparkles + Users
- Indicador de ultimo matching realizado
- Contador de matches encontrados

**Lista de matches:**
- Cards ordenadas por match_score (descendente)
- Cada card muestra:
  - Nombre del comprador + tipo (badge)
  - Score circular (gauge mini similar al ScoringGauge)
  - Barras de fit por dimension (sector, financiero, geografico, estrategico)
  - Razonamiento resumido (expandible)
  - Approach recomendado
  - Botones de accion: "Contactar" (cambia status), "Descartar" (con motivo), "Ver perfil"
- Filtros por score minimo y por status

**Estado vacio:**
- Mensaje invitando a generar el primer matching

### 5. `src/components/mandatos/MatchScoreBar.tsx`
Componente visual para mostrar barras de fit por dimension:
- 4 barras horizontales (sector, financial, geographic, strategic)
- Colores por nivel (rojo < 40, amarillo 40-70, verde > 70)
- Labels con porcentaje

## Archivos a modificar

### 6. `src/pages/MandatoDetalle.tsx`
- Importar y renderizar `BuyerMatchingPanel` en mandatos de tipo "venta"
- Agregar en la tab "Resumen" o como tab separada "Matching IA"

### 7. `supabase/config.toml`
- Agregar `[functions.match-buyers]` con `verify_jwt = true`

## Detalles tecnicos

### System prompt del modelo
El system prompt instruye al modelo como analista de M&A senior especializado en buyer identification. Debe evaluar cada comprador candidato contra el perfil de la empresa target considerando: alineacion sectorial (no solo nombre del sector sino logica de negocio), compatibilidad financiera (el target esta en el rango del comprador?), geografia, y fit estrategico (la tesis de inversion del buyer encaja con lo que ofrece el target?).

### Tool calling para output estructurado
Tool `evaluate_buyer_matches` con parametros:
```text
matches: array de objetos:
  - buyer_name: string (nombre del comprador evaluado)
  - match_score: integer (0-100, score general)
  - sector_fit: integer (0-100)
  - financial_fit: integer (0-100)
  - geographic_fit: integer (0-100)
  - strategic_fit: integer (0-100)
  - reasoning: string (2-3 frases explicando el match)
  - risk_factors: array de strings
  - recommended_approach: string (como abordar a este comprador)
```

### Pre-filtrado deterministico (antes de IA)
Para evitar enviar demasiados candidatos y reducir tokens/costes:
1. Si la empresa tiene sector, filtrar buyers cuyo `sector_focus` contenga algo similar O cuyo `sector_exclusions` NO contenga el sector
2. Si la empresa tiene revenue/ebitda, eliminar buyers cuyo rango no sea compatible
3. Limitar a 30 candidatos pre-filtrados para el prompt

### Seguridad
- Auth requerida (usuario CRM autenticado)
- Service role para queries
- Solo lectura de datos + insert/update en buyer_matches
- No streaming (respuesta unica con tool calling)

