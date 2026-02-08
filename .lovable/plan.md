

# Fase 9: Generacion Automatica de Teasers y CIMs con IA

## Objetivo
Crear un sistema que genere automaticamente el contenido de Teasers (documentos anonimizados de una pagina) y CIMs (Confidential Information Memorandums de varias secciones) a partir de los datos existentes de la empresa y el mandato, con plantillas personalizables y soporte bilingue (ES/EN).

## Contexto: que ya existe en el CRM

| Sistema existente | Relacion con esta fase |
|---|---|
| **Deal Sheet** (`deal_sheets`) | Contiene executive summary, highlights, sale rationale editados manualmente. La IA puede **pre-rellenar** estos campos |
| **Presentaciones** (`presentation_*`) | Motor de slides con AI workflow. Diferente formato (slides vs documento largo) |
| **Teaser Campaigns** (`teaser_campaigns`) | Envio de teasers a destinatarios con watermark. Necesita el **documento** generado |
| **PSH Plantillas** (`psh_plantillas`) | Patron de plantillas reutilizables por tipo de servicio |
| **Empresas** (datos financieros, sector, AI tags) | Fuente principal de datos para generar contenido |

## Arquitectura

```text
  [Boton "Generar Teaser con IA" / "Generar CIM con IA"]
         |
         v
  POST /generate-deal-document
         |
    1. Recibe { mandato_id, document_type: "teaser"|"cim", language: "es"|"en", template_id? }
    2. Carga mandato + empresa principal (sector, financials, descripcion, AI summary, tags)
    3. Carga deal_sheet si existe (como base/complemento)
    4. Carga plantilla seleccionada (estructura de secciones)
    5. Llama a google/gemini-3-flash-preview con tool calling
    6. Para Teaser: genera contenido anonimizado (sin nombre de empresa)
    7. Para CIM: genera secciones completas (executive summary, negocio, mercado, financials, etc.)
    8. Devuelve contenido estructurado por secciones
    9. Log en ai_activity_log (modulo: "document-generation")
         |
         v
  [Editor con contenido pre-generado, editable antes de exportar]
         |
         v
  [Exportar a PDF / Guardar borrador / Enviar via campana teaser]
```

## Tipos de documento

### Teaser (1-2 paginas, anonimizado)
Documento corto para primer contacto con compradores potenciales. NO revela el nombre de la empresa.
- Descripcion generica del sector y posicion
- Highlights de inversion (3-5 puntos)
- Metricas financieras agregadas (rangos, no exactos)
- Tipo de transaccion buscada
- Perfil de comprador ideal
- Siguiente paso / contacto

### CIM - Confidential Information Memorandum (10-20 paginas)
Documento extenso post-NDA con informacion detallada.
- Resumen ejecutivo
- Descripcion del negocio y modelo operativo
- Analisis de mercado y posicion competitiva
- Equipo directivo y organizacion
- Desempeno financiero historico (3-5 anos)
- Proyecciones financieras
- Oportunidades de crecimiento
- Terminos de la transaccion
- Anexos

## Datos que alimentan la generacion

| Fuente | Campos usados |
|--------|---------------|
| `empresas` | sector, subsector, descripcion, ubicacion, revenue, ebitda, margen_ebitda, empleados, ano_fundacion, modelo_negocio, keywords |
| `empresas` (AI) | ai_company_summary, ai_tags, ai_business_model_tags |
| `mandatos` | tipo, valor, nombre_proyecto, perfil_empresa_buscada, tipo_comprador_buscado |
| `deal_sheets` | executive_summary, investment_highlights, sale_rationale, ideal_buyer_profile, transaction_type, financial visibility config |
| `financial_statements` | Datos financieros historicos si existen |
| Plantilla seleccionada | Estructura de secciones, tono, nivel de detalle |

## Archivos a crear

### 1. Migracion: `deal_document_templates`
Tabla para plantillas personalizables de teasers y CIMs:
- `id` (uuid PK)
- `name` (text) - nombre de la plantilla
- `document_type` (text) - "teaser" o "cim"
- `language` (text default 'es') - idioma por defecto
- `sections` (jsonb) - array de secciones con orden, titulo, instrucciones para la IA
- `tone` (text default 'professional') - professional, conservative, dynamic
- `branding` (jsonb) - colores, logo, footer
- `is_default` (boolean default false)
- `is_active` (boolean default true)
- `created_by` (uuid)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 2. Migracion: `generated_deal_documents`
Tabla para guardar documentos generados:
- `id` (uuid PK)
- `mandato_id` (uuid FK)
- `template_id` (uuid FK -> deal_document_templates, nullable)
- `document_type` (text) - "teaser" o "cim"
- `language` (text)
- `title` (text)
- `sections` (jsonb) - contenido generado por seccion [{title, content, order}]
- `metadata` (jsonb) - datos de empresa usados, modelo, tokens
- `status` (text default 'draft') - draft, reviewed, approved, exported
- `version` (integer default 1)
- `pdf_storage_path` (text, nullable) - ruta del PDF exportado
- `generated_by` (uuid)
- `reviewed_by` (uuid, nullable)
- `approved_at` (timestamptz, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

RLS: Lectura/escritura para usuarios autenticados.

### 3. `supabase/functions/generate-deal-document/index.ts`
Edge Function principal:
- Recibe `{ mandato_id, document_type, language, template_id? }`
- Auth requerida
- Carga todos los datos de empresa + mandato + deal_sheet + financial_statements
- Carga la plantilla (o usa una por defecto si no se especifica)
- Construye prompt con:
  - System: analista M&A senior redactando documentos de transaccion
  - Para teaser: instrucciones de anonimizacion (no mencionar nombre, ubicacion exacta, etc.)
  - Para CIM: instrucciones de profundidad por seccion
  - Datos de la empresa como contexto factual
- Tool calling con `generate_deal_document`:
  - `title`: titulo del documento
  - `sections`: array de {section_title, content (markdown), order}
  - `anonymization_notes`: (solo teaser) notas sobre que se anonimizo
- Guarda en `generated_deal_documents`
- Log en `ai_activity_log` (modulo: `document-generation`)
- Manejo de errores 429/402

### 4. `src/hooks/useDealDocuments.ts`
- `useDealDocuments(mandatoId)`: query para listar documentos generados de un mandato
- `useGenerateDealDocument()`: mutation para disparar generacion
- `useDealDocumentTemplates(type?)`: query para listar plantillas
- `useUpdateDealDocument()`: mutation para editar contenido de secciones
- `useApproveDealDocument()`: mutation para aprobar un documento

### 5. `src/components/mandatos/DealDocumentGenerator.tsx`
Panel principal en el detalle del mandato (mandatos de venta):
- Selector de tipo de documento (Teaser / CIM)
- Selector de plantilla (con preview de secciones)
- Selector de idioma (ES / EN)
- Boton "Generar con IA" con icono Sparkles + FileText
- Lista de documentos generados previamente con status badges

### 6. `src/components/mandatos/DealDocumentEditor.tsx`
Editor de contenido generado (drawer o pagina):
- Vista por secciones con titulo editable y contenido markdown
- Cada seccion es un textarea/editor independiente
- Boton "Regenerar seccion" para re-generar una seccion individual
- Preview del documento completo
- Acciones: Guardar borrador, Aprobar, Exportar PDF
- Indicador de version

### 7. `src/components/mandatos/DealDocumentPreview.tsx`
Modal de preview del documento generado:
- Renderizado de markdown a HTML con estilos profesionales
- Header con branding Capittal
- Separadores entre secciones
- Footer con disclaimer de confidencialidad
- Boton de exportar a PDF

## Archivos a modificar

### 8. `src/pages/MandatoDetalle.tsx`
- Agregar acceso al `DealDocumentGenerator` en mandatos de venta
- Puede ser un boton en la seccion de Deal Sheet o una sub-tab en "Marketing"

### 9. `supabase/config.toml`
- Agregar `[functions.generate-deal-document]` con `verify_jwt = true`

## Detalles tecnicos

### System prompt para Teaser
Instruye al modelo como banquero de inversion senior redactando un teaser confidencial. Reglas de anonimizacion:
- NO mencionar el nombre de la empresa ni marcas
- Usar "La Compania" o "La Sociedad"
- Sector y posicion genericos ("empresa lider en el sector de servicios industriales")
- Ubicacion vaga ("con sede en el norte de Espana")
- Financials solo en rangos
- Tono profesional, atractivo para generar interes

### System prompt para CIM
Instruye al modelo como analista de M&A senior redactando un CIM completo. Debe:
- Ser exhaustivo pero conciso
- Usar datos reales proporcionados (no inventar numeros)
- Estructurar cada seccion segun la plantilla
- Incluir analisis de mercado basado en el sector/subsector
- Destacar fortalezas y oportunidades de crecimiento
- Presentar financials historicos de forma profesional

### Tool calling para output estructurado
Tool `generate_deal_document`:
- `title` (string): Titulo del documento
- `sections` (array): [{section_title: string, content: string (markdown), order: number}]
- `anonymization_notes` (string, opcional): Notas sobre datos anonimizados (solo teaser)
- `key_metrics_used` (array de strings): Metricas de la empresa utilizadas

### Plantillas por defecto (seed data)
Se insertan 4 plantillas predeterminadas:
1. **Teaser Estandar (ES)**: 6 secciones (Oportunidad, Highlights, Metricas, Transaccion, Perfil Comprador, Contacto)
2. **Teaser Estandar (EN)**: Mismas secciones en ingles
3. **CIM Completo (ES)**: 9 secciones (Resumen, Negocio, Mercado, Equipo, Financials, Proyecciones, Crecimiento, Transaccion, Anexos)
4. **CIM Completo (EN)**: Mismas secciones en ingles

### Integracion con Deal Sheet existente
Si el mandato ya tiene un Deal Sheet con contenido (executive_summary, highlights, etc.), ese contenido se incluye en el prompt como "base editada por el equipo" para que la IA lo respete y expanda, no lo reescriba desde cero.

### Exportacion PDF
Reutiliza el patron existente de jspdf + html2canvas del proyecto para generar PDFs con branding Capittal. El PDF se sube al bucket `mandato-documentos` y se vincula al documento generado.

### Seguridad
- Auth requerida (usuario CRM autenticado)
- Service role para queries
- Insert/update en `generated_deal_documents`
- No streaming (respuesta unica con tool calling)
- Contenido generado siempre en estado "draft" hasta aprobacion manual

