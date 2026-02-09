
# Outreach Tracking para Buyer Matching

## Objetivo
Replicar el sistema de outreach que ya existe para Search Funds (`sf_outreach`) en el sistema de Buyer Matching, permitiendo registrar contactos, envio de teasers, NDAs y su seguimiento desde el panel de Matching IA.

---

## 1. Nueva tabla `buyer_outreach`

Crear una tabla con estructura similar a `sf_outreach`, adaptada a corporate buyers:

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | uuid PK | Identificador |
| match_id | uuid FK -> buyer_matches | Vincula al match |
| buyer_id | uuid FK -> corporate_buyers | Comprador |
| mandato_id | uuid FK -> mandatos | Mandato asociado |
| channel | text | email, linkedin, phone, other |
| outreach_type | text | contacto, teaser, nda, followup |
| subject | text nullable | Asunto |
| message_preview | text nullable | Extracto del mensaje |
| sent_at | timestamptz nullable | Fecha de envio |
| status | text default 'draft' | draft, sent, replied, bounced |
| notes | text nullable | Notas internas |
| created_by | uuid nullable | Usuario que registra |
| created_at | timestamptz default now() | Fecha creacion |

RLS: Politicas para usuarios autenticados (select, insert, update, delete).

---

## 2. Nuevos campos en `buyer_matches`

Agregar columnas de tracking de hitos al registro del match (como en sf_matches):

- `contacted_at` (timestamptz) - Fecha primer contacto
- `teaser_sent_at` (timestamptz) - Fecha envio teaser
- `nda_sent_at` (timestamptz) - Fecha envio NDA
- `last_interaction_at` (timestamptz) - Ultima interaccion

---

## 3. Backend: Hook y servicio

**Nuevo archivo `src/hooks/useBuyerOutreach.ts`**:
- `useBuyerOutreach(matchId)` - Query para listar outreach de un match
- `useCreateBuyerOutreach()` - Mutation para registrar nuevo outreach
- `useUpdateBuyerOutreachStatus()` - Mutation para actualizar status

Seguira el mismo patron que `useSearchFundOutreach.ts` y `outreach.service.ts`.

---

## 4. UI: Componente de outreach en el MatchCard

**Nuevo archivo `src/components/mandatos/BuyerOutreachTimeline.tsx`**:
- Timeline de interacciones dentro de cada MatchCard (CollapsibleContent)
- Muestra canal, tipo (contacto/teaser/NDA), fecha, status
- Iconos por canal (email, linkedin, phone)
- Badges de estado por tipo de outreach

**Modificaciones en `BuyerMatchingPanel.tsx`**:
- Agregar seccion de outreach timeline dentro del area expandible del MatchCard
- Boton "Registrar Contacto" abre un dialog/formulario inline
- Botones rapidos para "Enviar Teaser" y "Enviar NDA" que crean el outreach y actualizan las fechas del match
- Badges visuales en la cabecera del card mostrando hitos completados (contactado, teaser enviado, NDA enviado)
- Ampliar los filtros de status para incluir los nuevos estados de outreach (teaser_enviado, nda_enviado)

**Nuevo archivo `src/components/mandatos/BuyerOutreachForm.tsx`**:
- Formulario para registrar un outreach (canal, tipo, asunto, mensaje, fecha, notas)
- Se muestra en un Dialog al pulsar los botones de accion

---

## Seccion Tecnica

### Migracion SQL

```sql
-- Nuevas columnas en buyer_matches
ALTER TABLE buyer_matches
  ADD COLUMN IF NOT EXISTS contacted_at timestamptz,
  ADD COLUMN IF NOT EXISTS teaser_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS nda_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_interaction_at timestamptz;

-- Tabla buyer_outreach
CREATE TABLE buyer_outreach (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES buyer_matches(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES corporate_buyers(id),
  mandato_id uuid NOT NULL REFERENCES mandatos(id),
  channel text NOT NULL DEFAULT 'email',
  outreach_type text NOT NULL DEFAULT 'contacto',
  subject text,
  message_preview text,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'draft',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE buyer_outreach ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage buyer_outreach"
  ON buyer_outreach FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- Indices
CREATE INDEX idx_buyer_outreach_match ON buyer_outreach(match_id);
CREATE INDEX idx_buyer_outreach_buyer ON buyer_outreach(buyer_id);
```

### Archivos a crear
- `src/hooks/useBuyerOutreach.ts`
- `src/components/mandatos/BuyerOutreachTimeline.tsx`
- `src/components/mandatos/BuyerOutreachForm.tsx`

### Archivos a modificar
- `src/components/mandatos/BuyerMatchingPanel.tsx` - Integrar timeline y formulario en el MatchCard
- `src/hooks/useBuyerMatching.ts` - Agregar mutation para actualizar fechas de hitos

### Trigger automatico
Un trigger que al insertar en `buyer_outreach`, actualice automaticamente las fechas correspondientes en `buyer_matches` (contacted_at, teaser_sent_at, nda_sent_at, last_interaction_at) segun el `outreach_type`.
