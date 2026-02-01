
## Plan: Sistema de "Deal Sheet" - Información Estandarizada para Candidatos

### Problema Identificado

Como propietario de una firma M&A, necesitas controlar y estandarizar la información que se transmite a los candidatos (potenciales compradores/inversores). Actualmente:

- La información está dispersa en diferentes secciones (empresa, financieros, mandato)
- No hay un "pack estándar" de información para compartir
- No existe control sobre qué datos específicos se revelan a cada candidato
- Cada operación transmite información de manera inconsistente

### Solución Propuesta: "Deal Sheet" 

Un módulo nuevo dentro de la pestaña **Marketing** que permita definir qué información se comparte de forma estandarizada:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Marketing                                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│  [Teaser Manager]   [Deal Sheet ✨NUEVO]   [Campañas]   [Data Room]          │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### Estructura del Deal Sheet

El Deal Sheet será un formulario estructurado con secciones predefinidas que el equipo completa para cada mandato:

#### Sección 1: Resumen Ejecutivo (Executive Summary)
- Descripción del negocio (1-2 párrafos)
- Propuesta de valor única
- Motivo de venta
- Perfil de comprador ideal

#### Sección 2: Highlights de Inversión
- Lista de 4-6 puntos clave que hacen atractiva la oportunidad
- Ejemplos: "Líder regional", "80% ingresos recurrentes", "CAGR 25%"

#### Sección 3: Información Financiera Compartible
- Checkbox para seleccionar qué métricas se revelan:
  - [ ] Facturación
  - [ ] EBITDA
  - [ ] Margen EBITDA
  - [ ] Crecimiento YoY
  - [ ] Número de empleados
- Opción de mostrar valores exactos o rangos

#### Sección 4: Información Operativa
- Sector y subsector
- Geografía de operaciones
- Modelo de negocio (descripción)
- Base de clientes (tipo, concentración)
- Ventajas competitivas

#### Sección 5: Información del Proceso
- Fase del proceso
- Timeline esperado
- Tipo de transacción buscada (100%, mayoría, minoría)
- Requisitos previos (NDA, capacidad financiera demostrable)

---

### UI del Deal Sheet

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Deal Sheet                                               [Previsualizar] 👁️  │
│ Define qué información se comparte con los candidatos                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ RESUMEN EJECUTIVO                                                    [ES/EN]│
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Empresa líder regional en el sector de [X] con más de 20 años de        │ │
│ │ trayectoria. Facturación superior a €10M con márgenes EBITDA del 15%.   │ │
│ │ Los socios fundadores buscan un socio estratégico que acompañe...       │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ HIGHLIGHTS DE INVERSIÓN                                                      │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ + Líder regional con 35% de cuota de mercado                            │ │
│ │ + 85% de ingresos recurrentes (contratos plurianuales)                  │ │
│ │ + CAGR 15% últimos 5 años                                               │ │
│ │ + Equipo directivo comprometido con la continuidad                      │ │
│ │ + Pipeline comercial de €2M para 2025                                   │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ DATOS FINANCIEROS VISIBLES                                                   │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ ✓ Rango de facturación    €10M - €15M                                   │ │
│ │ ✓ Rango de EBITDA         €1.5M - €2M                                   │ │
│ │ ✓ Margen EBITDA           15-20%                                        │ │
│ │ ○ Facturación exacta      (oculto hasta NDA)                            │ │
│ │ ○ EBITDA exacto           (oculto hasta NDA)                            │ │
│ │ ✓ Empleados               75-100                                        │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ INFORMACIÓN DEL PROCESO                                                      │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Fase:           Marketing / Recepción de IOI                            │ │
│ │ Tipo de Tx:     100% del capital social                                 │ │
│ │ Valoración:     8-10x EBITDA                                            │ │
│ │ Timeline:       Cierre estimado Q2 2025                                 │ │
│ │ Requisitos:     NDA firmado + Carta de capacidad financiera             │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                               [Guardar borrador]   [Publicar Deal Sheet]     │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### Niveles de Información (Disclosure Tiers)

Sistema de 3 niveles para controlar qué se comparte en cada fase:

| Nivel | Fase | Información Disponible |
|-------|------|----------------------|
| **Tier 1** | Teaser | Resumen ejecutivo, highlights, rangos financieros |
| **Tier 2** | Post-NDA | Datos financieros exactos, modelo de negocio detallado |
| **Tier 3** | Due Diligence | Información completa (vía Data Room) |

---

### Cambios Técnicos

#### 1. Nueva Tabla: `deal_sheets`

```sql
CREATE TABLE deal_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandato_id UUID REFERENCES mandatos(id) ON DELETE CASCADE,
  
  -- Resumen ejecutivo (multilingüe)
  executive_summary_es TEXT,
  executive_summary_en TEXT,
  
  -- Highlights (array de puntos clave)
  investment_highlights_es TEXT[],
  investment_highlights_en TEXT[],
  
  -- Motivo de venta
  sale_rationale_es TEXT,
  sale_rationale_en TEXT,
  
  -- Perfil de comprador ideal
  ideal_buyer_profile_es TEXT,
  ideal_buyer_profile_en TEXT,
  
  -- Configuración de visibilidad financiera
  show_revenue_range BOOLEAN DEFAULT true,
  show_ebitda_range BOOLEAN DEFAULT true,
  show_ebitda_margin BOOLEAN DEFAULT true,
  show_employees BOOLEAN DEFAULT true,
  show_exact_financials BOOLEAN DEFAULT false,
  
  -- Rangos personalizados (si no quieren auto-calcular)
  custom_revenue_min NUMERIC,
  custom_revenue_max NUMERIC,
  custom_ebitda_min NUMERIC,
  custom_ebitda_max NUMERIC,
  
  -- Información del proceso
  transaction_type TEXT, -- '100%', 'majority', 'minority'
  valuation_multiple_min NUMERIC,
  valuation_multiple_max NUMERIC,
  expected_timeline TEXT,
  process_requirements TEXT[],
  
  -- Estados
  status TEXT DEFAULT 'draft', -- draft, published
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(mandato_id)
);
```

#### 2. Nuevos Componentes

| Componente | Descripción |
|------------|-------------|
| `DealSheetEditor.tsx` | Formulario principal para editar el Deal Sheet |
| `DealSheetPreview.tsx` | Vista previa de cómo verán los candidatos la información |
| `HighlightsEditor.tsx` | Editor de lista de highlights con drag & drop |
| `FinancialDisclosureConfig.tsx` | Configurador de qué datos financieros se muestran |

#### 3. Modificar Pestaña Marketing

Añadir sub-tabs dentro de Marketing:
- Teaser Manager (existente)
- Deal Sheet (nuevo)
- Campañas (link a /campaigns)

---

### Integración con Flujo Existente

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Deal Sheet    │     │     Teaser      │     │   Campañas      │
│   (Contenido)   │ ──▶ │   (Documento)   │ ──▶ │   (Envío)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               │
        │                                               ▼
        │                                    ┌─────────────────┐
        │                                    │  Candidatos     │
        │                                    │  Ven Teaser     │
        │                                    └─────────────────┘
        │                                               │
        ▼                                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      POST-NDA (Data Room)                        │
│  - Deal Sheet completo con datos exactos                        │
│  - CIM / Information Memorandum                                 │
│  - Documentación adicional                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

### Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| `src/features/mandatos/components/DealSheetEditor.tsx` | Editor principal del Deal Sheet |
| `src/features/mandatos/components/DealSheetPreview.tsx` | Vista previa |
| `src/features/mandatos/components/HighlightsEditor.tsx` | Editor de highlights |
| `src/features/mandatos/components/FinancialDisclosureConfig.tsx` | Config de visibilidad |
| `src/hooks/useDealSheet.ts` | Hook para CRUD del Deal Sheet |
| `src/services/dealSheet.service.ts` | Servicio de acceso a datos |

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/MandatoDetalle.tsx` | Añadir sub-tabs en Marketing |
| `src/features/mandatos/tabs/MarketingTab.tsx` | Crear nuevo tab con sub-navegación |

---

### Beneficios

1. **Estandarización**: Toda la información sigue el mismo formato
2. **Control**: Decides exactamente qué se comparte en cada fase
3. **Multilingüe**: Soporte ES/EN desde el inicio
4. **Trazabilidad**: Historial de cambios y publicación
5. **Integración**: Se conecta con el sistema de teasers y campañas existente
6. **Profesionalismo**: Los candidatos reciben información estructurada y consistente

---

### Fase 2 (Futuro)

- Generación automática de Teaser PDF desde Deal Sheet
- Plantillas de Deal Sheet por sector
- Métricas de engagement por sección
- Comparador de Deal Sheets entre operaciones
