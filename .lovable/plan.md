
## Plan: Sección "Reuniones" en Perfil de Empresa

### Resumen Ejecutivo

Crear un nuevo apartado completo para gestionar reuniones asociadas directamente a empresas, separado de mandatos y contactos. Incluirá gestión de notas de preparación, notas de reunión y documentos adjuntos, con histórico cronológico completo.

---

### 1. Modelo de Datos

#### 1.1 Tabla `company_meetings`

```sql
CREATE TABLE company_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT NOT NULL,
  preparation_notes TEXT,
  meeting_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_company_meetings_company ON company_meetings(company_id);
CREATE INDEX idx_company_meetings_date ON company_meetings(meeting_date DESC);

-- Trigger para updated_at
CREATE TRIGGER set_company_meetings_updated_at
  BEFORE UPDATE ON company_meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

#### 1.2 Tabla `company_meeting_documents`

```sql
CREATE TABLE company_meeting_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES company_meetings(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para buscar documentos por reunión
CREATE INDEX idx_meeting_documents_meeting ON company_meeting_documents(meeting_id);
```

#### 1.3 Políticas RLS

```sql
-- Habilitar RLS
ALTER TABLE company_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_meeting_documents ENABLE ROW LEVEL SECURITY;

-- Políticas usando funciones helper existentes
CREATE POLICY "meetings_read" ON company_meetings
FOR SELECT USING (public.current_user_can_read());

CREATE POLICY "meetings_write" ON company_meetings
FOR INSERT WITH CHECK (public.current_user_can_write());

CREATE POLICY "meetings_update" ON company_meetings
FOR UPDATE USING (public.current_user_can_write());

CREATE POLICY "meetings_delete" ON company_meetings
FOR DELETE USING (public.current_user_can_write());

-- Mismas políticas para documentos
CREATE POLICY "meeting_docs_read" ON company_meeting_documents
FOR SELECT USING (public.current_user_can_read());

CREATE POLICY "meeting_docs_write" ON company_meeting_documents
FOR INSERT WITH CHECK (public.current_user_can_write());

CREATE POLICY "meeting_docs_delete" ON company_meeting_documents
FOR DELETE USING (public.current_user_can_write());
```

---

### 2. Almacenamiento de Documentos

#### 2.1 Estructura en Storage

Ruta: `companies/{company_id}/meetings/{meeting_id}/{timestamp}_{filename}`

Bucket: `mandato-documentos` (reutilizar bucket existente con políticas ya configuradas)

#### 2.2 Políticas de Storage

Las políticas actuales del bucket `mandato-documentos` ya permiten:
- Lectura para usuarios autenticados con `current_user_can_read()`
- Escritura/eliminación para admins con `current_user_can_write()`

---

### 3. Servicios (Backend)

#### 3.1 Nuevo archivo: `src/services/companyMeetings.service.ts`

```typescript
// Interfaces
export interface CompanyMeeting {
  id: string;
  company_id: string;
  meeting_date: string;
  title: string;
  preparation_notes: string | null;
  meeting_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingDocument {
  id: string;
  meeting_id: string;
  file_name: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  storage_path: string;
  uploaded_by: string | null;
  uploaded_at: string;
}

// Funciones CRUD
export const fetchMeetingsByCompany = async (companyId: string): Promise<CompanyMeeting[]>
export const getMeetingById = async (id: string): Promise<CompanyMeeting>
export const createMeeting = async (meeting: Partial<CompanyMeeting>): Promise<CompanyMeeting>
export const updateMeeting = async (id: string, data: Partial<CompanyMeeting>): Promise<CompanyMeeting>
export const deleteMeeting = async (id: string): Promise<void>

// Funciones para documentos
export const fetchMeetingDocuments = async (meetingId: string): Promise<MeetingDocument[]>
export const uploadMeetingDocument = async (meetingId: string, companyId: string, file: File): Promise<MeetingDocument>
export const deleteMeetingDocument = async (docId: string, storagePath: string): Promise<void>
```

#### 3.2 Hook: `src/hooks/queries/useCompanyMeetings.ts`

```typescript
// Hooks con React Query
export function useCompanyMeetings(companyId: string | undefined)
export function useMeeting(id: string | undefined)
export function useCreateMeeting()
export function useUpdateMeeting()
export function useDeleteMeeting()
export function useMeetingDocuments(meetingId: string | undefined)
export function useUploadMeetingDocument()
export function useDeleteMeetingDocument()
```

---

### 4. Componentes UI

#### 4.1 Nueva Tab "Reuniones" en EmpresaDetalle.tsx

Añadir una nueva tab al TabsList existente (actualmente hay 7 tabs):

```text
[General] [Financiero] [Valoración] [Contactos] [Mandatos] [Actividad] [Documentos] [Reuniones]
                                                                                    ↑ NUEVO
```

#### 4.2 Componente: `src/components/empresas/CompanyMeetingsTab.tsx`

Componente principal de la sección con:

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Reuniones                                      [+ Nueva Reunión]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ▼ 15 Ene 2026 - Reunión de seguimiento Q1                          │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ Notas de preparación:                          [Editar]     │  │
│   │ ─────────────────────────────────────────────               │  │
│   │ Revisar propuesta anterior...                               │  │
│   │                                                             │  │
│   │ Notas de la reunión:                                        │  │
│   │ ─────────────────────────────────────────────               │  │
│   │ El cliente mostró interés en...                             │  │
│   │                                                             │  │
│   │ Documentos (2):                                             │  │
│   │ 📄 Propuesta_Q1.pdf                      [👁️] [⬇️] [🗑️]     │  │
│   │ 📄 Presentacion.pptx                     [👁️] [⬇️] [🗑️]     │  │
│   │                                         [+ Subir documento] │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ ▶ 10 Dic 2025 - Primera reunión comercial                          │
│                                                                     │
│ ▶ 1 Nov 2025 - Contacto inicial                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Características:**
- Lista ordenada por fecha (más reciente arriba)
- Cada reunión es expandible (Accordion)
- Separación visual clara entre notas de preparación y notas de reunión
- Documentos listados dentro de cada reunión
- Botones de acción para cada documento

#### 4.3 Componente: `src/components/empresas/NewMeetingDialog.tsx`

Dialog para crear nueva reunión:

```text
┌─────────────────────────────────────────────────────────────┐
│ Nueva Reunión                                          [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Título *                                                    │
│ [___________________________________________________]       │
│                                                             │
│ Fecha de la reunión *                                       │
│ [📅 Seleccionar fecha_______________________]               │
│                                                             │
│ Notas de preparación                                        │
│ [___________________________________________________]       │
│ [                                                   ]       │
│ [___________________________________________________]       │
│                                                             │
│                              [Cancelar]  [Guardar Reunión]  │
└─────────────────────────────────────────────────────────────┘
```

#### 4.4 Componente: `src/components/empresas/MeetingCard.tsx`

Card individual para cada reunión con:
- Accordion trigger con fecha + título
- Secciones editables inline para notas
- Lista de documentos con acciones
- Zona de upload para nuevos documentos (dropzone simplificado)

#### 4.5 Componente: `src/components/empresas/MeetingDocumentUpload.tsx`

Zona de upload simplificada reutilizando patrones de `DocumentUploadZone.tsx`:
- Dropzone para arrastrar archivos
- Soporta: PDF, DOCX, XLSX, PPTX, PNG, JPG
- Máximo 20MB por archivo
- Múltiples archivos permitidos

---

### 5. Integración en EmpresaDetalle.tsx

#### 5.1 Nuevos imports

```typescript
import { CompanyMeetingsTab } from "@/components/empresas/CompanyMeetingsTab";
import { useCompanyMeetings } from "@/hooks/queries/useCompanyMeetings";
import { Calendar as CalendarMeeting } from "lucide-react"; // Icono para la tab
```

#### 5.2 Nueva query

```typescript
const { data: meetings = [], isLoading: loadingMeetings } = useCompanyMeetings(id);
```

#### 5.3 Nueva Tab

```typescript
// En TabsList (después de Documentos)
<TabsTrigger value="reuniones">
  <CalendarMeeting className="h-5 w-5 mr-2" />
  Reuniones ({meetings.length})
</TabsTrigger>

// En TabsContent
<TabsContent value="reuniones">
  <CompanyMeetingsTab companyId={id!} />
</TabsContent>
```

---

### 6. Flujos de Usuario

#### 6.1 Crear Reunión

```text
Usuario hace clic en "+ Nueva Reunión"
         │
         ▼
   Dialog se abre con campos:
   - Título (obligatorio)
   - Fecha (obligatorio)
   - Notas de preparación (opcional)
         │
         ▼
   Usuario llena y hace clic en "Guardar"
         │
         ▼
   Se crea registro en company_meetings
   Toast: "Reunión creada correctamente"
         │
         ▼
   Lista se actualiza mostrando nueva reunión
```

#### 6.2 Editar Notas

```text
Usuario expande una reunión (accordion)
         │
         ▼
   Ve campos de notas con texto actual
         │
         ▼
   Hace clic en "Editar" (o edición inline)
         │
         ▼
   Modifica notas de preparación o reunión
         │
         ▼
   Hace clic en "Guardar" (o auto-save con debounce)
         │
         ▼
   Toast: "Notas guardadas"
```

#### 6.3 Subir Documentos

```text
Usuario abre reunión expandida
         │
         ▼
   Hace clic en "+ Subir documento" o arrastra archivo
         │
         ▼
   Archivo se sube a storage:
   companies/{company_id}/meetings/{meeting_id}/{file}
         │
         ▼
   Se crea registro en company_meeting_documents
         │
         ▼
   Toast: "Documento subido"
   Lista de documentos se actualiza
```

---

### 7. Validaciones y UX

| Acción | Validación | Feedback |
|--------|------------|----------|
| Crear reunión | Título y fecha obligatorios | Error inline si faltan |
| Guardar notas | Sin restricción mínima | Toast "Notas guardadas" |
| Subir documento | Tipo válido + <20MB | Toast error si falla |
| Eliminar documento | Confirmación previa | Toast "Documento eliminado" |
| Eliminar reunión | Confirmación + elimina docs | Toast "Reunión eliminada" |

---

### 8. Estados Vacíos

```text
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                       📅                                    │
│                                                             │
│         No hay reuniones registradas                        │
│                                                             │
│    Registra tu primera reunión para mantener un            │
│    histórico de las interacciones con esta empresa          │
│                                                             │
│                   [+ Nueva Reunión]                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 9. Resumen de Archivos

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| **Nueva migración SQL** | Crear | Tablas + RLS + índices |
| `src/services/companyMeetings.service.ts` | Crear | CRUD para reuniones y documentos |
| `src/hooks/queries/useCompanyMeetings.ts` | Crear | Hooks React Query |
| `src/components/empresas/CompanyMeetingsTab.tsx` | Crear | Tab principal con lista |
| `src/components/empresas/NewMeetingDialog.tsx` | Crear | Dialog para nueva reunión |
| `src/components/empresas/MeetingCard.tsx` | Crear | Card expandible por reunión |
| `src/components/empresas/MeetingDocumentUpload.tsx` | Crear | Zona de upload para docs |
| `src/pages/EmpresaDetalle.tsx` | Modificar | Añadir tab Reuniones |
| `src/integrations/supabase/types.ts` | Auto-update | Tipos generados |

---

### Sección Técnica

**Reutilización de patrones:**
- RLS: funciones `current_user_can_read()` y `current_user_can_write()` existentes
- Storage: bucket `mandato-documentos` con políticas ya configuradas
- UI: componentes Accordion, Dialog, Card de shadcn/ui
- Upload: patrón de `useDocumentStorage` adaptado

**Seguridad:**
- Solo usuarios con rol `viewer+` pueden ver reuniones
- Solo usuarios con rol `admin+` pueden crear/editar/eliminar
- Documentos almacenados en storage privado con signed URLs

**Performance:**
- Índices en `company_id` y `meeting_date` para queries rápidas
- React Query con staleTime para cache eficiente
- Documentos cargados lazy (solo al expandir)

**Compatibilidad:**
- No afecta funcionalidades existentes del perfil
- Tab nueva al final de la lista existente
- Datos completamente separados de interacciones/mandatos
