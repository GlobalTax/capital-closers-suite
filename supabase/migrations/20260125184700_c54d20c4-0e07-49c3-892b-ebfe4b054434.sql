-- Create help_sections table for manual content
CREATE TABLE public.help_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content_md TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  parent_id UUID REFERENCES public.help_sections(id) ON DELETE SET NULL,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for full-text search
CREATE INDEX idx_help_sections_search 
ON public.help_sections USING gin(to_tsvector('spanish', title || ' ' || COALESCE(content_md, '')));

-- Index for ordering
CREATE INDEX idx_help_sections_order ON public.help_sections(order_index);

-- Enable RLS
ALTER TABLE public.help_sections ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read published sections
CREATE POLICY "Authenticated users can read help sections"
ON public.help_sections FOR SELECT
TO authenticated
USING (is_published = true);

-- Policy: Super admins can manage all sections
CREATE POLICY "Super admins can manage help sections"
ON public.help_sections FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_help_sections_updated_at
BEFORE UPDATE ON public.help_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial content
INSERT INTO public.help_sections (title, slug, content_md, description, icon, order_index) VALUES
(
  'Introducción',
  'introduccion',
  '# Introducción

Bienvenido al **CRM de Capittal Partners**. Esta guía te ayudará a navegar y utilizar todas las funcionalidades de la plataforma de manera efectiva.

## ¿Qué es este CRM?

Es una herramienta integral diseñada para gestionar:

- **Mandatos de venta** de empresas
- **Mandatos de compra** para inversores
- **Search Funds** y sus criterios de inversión
- **Empresas y contactos** del ecosistema M&A
- **Documentos y teasers** de operaciones
- **Tareas y seguimiento** de procesos

## Primeros pasos

1. Accede al **Dashboard** para ver un resumen de actividad
2. Revisa tus **tareas pendientes** en el menú lateral
3. Explora los **mandatos activos** de tu equipo

> 💡 **Tip**: Usa el menú lateral izquierdo para navegar entre las diferentes secciones.',
  'Bienvenida y primeros pasos en el CRM',
  'BookOpen',
  1
),
(
  'Navegación',
  'navegacion',
  '# Navegación

## Estructura del menú

El menú lateral izquierdo está organizado en secciones:

### Área principal
- **Dashboard**: Vista general con métricas y actividad reciente
- **Mandatos**: Gestión de operaciones de venta y compra
- **Empresas**: Base de datos de empresas
- **Contactos**: Directorio de contactos profesionales

### Herramientas
- **Search Funds**: Gestión de fondos de búsqueda
- **Documentos**: Repositorio de archivos
- **Tareas**: Gestión de actividades pendientes
- **Calendario**: Vista de eventos y reuniones

### Configuración
- **Ayuda**: Este manual (donde estás ahora)
- **Perfil**: Configuración de tu cuenta

## Atajos de teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl + K` | Búsqueda rápida global |
| `Ctrl + N` | Nuevo elemento (contexto) |
| `Esc` | Cerrar modal/diálogo |

> 💡 **Tip**: Puedes colapsar el menú lateral haciendo clic en el icono de hamburguesa.',
  'Cómo moverse por la aplicación',
  'Compass',
  2
),
(
  'Mandatos',
  'mandatos',
  '# Mandatos

Los mandatos son el corazón del CRM. Representan operaciones de M&A en curso.

## Tipos de mandatos

### 1. Mandato de Venta
Cuando representamos a un vendedor que quiere vender su empresa.

**Flujo típico:**
1. Captación del mandato
2. Preparación de documentación (Teaser, CIM)
3. Identificación de targets (compradores)
4. Envío de teasers
5. Gestión de NDAs
6. Proceso competitivo
7. Negociación y cierre

### 2. Mandato de Compra (Buy-Side)
Cuando un inversor nos encarga buscar empresas que cumplan sus criterios.

**Información clave:**
- Sector objetivo
- Rango de EBITDA
- Geografía
- Criterios específicos

### 3. Search Funds
Gestión de relaciones con Search Funds activos buscando adquisiciones.

## Estados de un mandato

| Estado | Significado |
|--------|-------------|
| Nuevo | Recién creado |
| Activo | En proceso de comercialización |
| En Due Diligence | Compradores analizando |
| En Negociación | Discutiendo términos |
| Cerrado | Operación completada |
| Pausado | Temporalmente detenido |

> 💡 **Tip**: Usa los filtros en la vista de mandatos para encontrar rápidamente lo que buscas.',
  'Gestión de operaciones de venta y compra',
  'FileText',
  3
),
(
  'Empresas y Contactos',
  'empresas-contactos',
  '# Empresas y Contactos

## Empresas

Las empresas son entidades que pueden ser:
- **Targets** (empresas en venta)
- **Potenciales compradores**
- **Inversores**
- **Asesores**

### Crear una empresa

1. Ve a **Empresas** en el menú
2. Haz clic en **+ Nueva Empresa**
3. Completa los datos básicos:
   - Nombre
   - CIF
   - Sector
   - Ubicación
4. Añade información financiera si está disponible

### Datos financieros

Puedes registrar:
- Facturación anual
- EBITDA
- Número de empleados
- Año de fundación

## Contactos

Los contactos son personas vinculadas a empresas.

### Crear un contacto

1. Ve a **Contactos** en el menú
2. Haz clic en **+ Nuevo Contacto**
3. Completa:
   - Nombre completo
   - Email
   - Teléfono
   - Cargo
   - Empresa asociada

### Vincular contactos

Un contacto puede estar vinculado a:
- Una o más empresas
- Uno o más mandatos
- Tareas específicas

> 💡 **Tip**: Usa la importación masiva para añadir múltiples contactos desde un CSV.',
  'Base de datos de empresas y personas',
  'Building2',
  4
),
(
  'Documentos y Teasers',
  'documentos-teasers',
  '# Documentos y Teasers

## Gestión de documentos

Cada mandato puede tener documentos asociados:

### Tipos de documentos

| Tipo | Descripción |
|------|-------------|
| **Teaser** | Documento anónimo para captar interés |
| **CIM** | Cuaderno de venta detallado |
| **NDA** | Acuerdo de confidencialidad |
| **Financieros** | Estados financieros, proyecciones |
| **Legales** | Contratos, estatutos |
| **Due Diligence** | Informes y análisis |

### Subir documentos

1. Accede al mandato
2. Ve a la pestaña **Documentos**
3. Arrastra archivos o haz clic en **Subir**
4. Selecciona el tipo de documento

## Campañas de Teaser

Las campañas permiten enviar teasers a múltiples targets.

### Crear una campaña

1. En el mandato, ve a **Marketing**
2. Crea una **Nueva Campaña**
3. Selecciona los destinatarios
4. Personaliza el mensaje
5. Programa o envía inmediatamente

### Tracking

El sistema rastrea automáticamente:
- ✉️ Emails enviados
- 👁️ Aperturas
- 📄 NDAs solicitados/firmados
- 📊 CIMs accedidos

> 💡 **Tip**: Usa los templates de email para mantener consistencia en la comunicación.',
  'Gestión de archivos y envío de teasers',
  'Files',
  5
),
(
  'Tareas y Calendario',
  'tareas-calendario',
  '# Tareas y Calendario

## Gestión de tareas

Las tareas te ayudan a organizar el trabajo diario.

### Crear una tarea

1. Ve a **Tareas** en el menú
2. Haz clic en **+ Nueva Tarea**
3. Completa:
   - Título descriptivo
   - Fecha límite
   - Prioridad (Alta, Media, Baja)
   - Asignado a (usuario)
   - Mandato relacionado (opcional)

### Estados de tareas

- **Pendiente**: Por hacer
- **En progreso**: Trabajando en ella
- **Completada**: Finalizada
- **Cancelada**: Ya no es necesaria

### Vistas disponibles

| Vista | Descripción |
|-------|-------------|
| Lista | Todas las tareas en formato lista |
| Kanban | Tablero por estados |
| Calendario | Vista mensual/semanal |

## Calendario

El calendario muestra:
- Tareas con fecha límite
- Reuniones programadas
- Eventos del equipo

### Crear un evento

1. Haz clic en una fecha
2. Selecciona **Nuevo Evento**
3. Añade detalles y participantes

> 💡 **Tip**: Las tareas vencidas se muestran en rojo para fácil identificación.',
  'Organización del trabajo diario',
  'CheckSquare',
  6
),
(
  'Reportes',
  'reportes',
  '# Reportes

## Tipos de reportes

### Dashboard

El dashboard principal muestra:
- Mandatos activos por tipo
- Pipeline de operaciones
- Actividad reciente
- Métricas de rendimiento

### Reportes de mandato

Cada mandato puede generar:
- **Informe de actividad**: Timeline de acciones
- **Estado de targets**: Funnel de conversión
- **Métricas de campaña**: Resultados de marketing

### Reportes de equipo

- Tareas por usuario
- Mandatos asignados
- Tiempo de respuesta

## Exportación

Los datos pueden exportarse en varios formatos:

| Formato | Uso recomendado |
|---------|-----------------|
| PDF | Presentaciones, informes formales |
| Excel | Análisis de datos, manipulación |
| CSV | Importación a otros sistemas |

### Generar un reporte

1. Accede a la sección deseada
2. Configura los filtros
3. Haz clic en **Exportar**
4. Selecciona el formato

> 💡 **Tip**: Los reportes del dashboard se actualizan automáticamente.',
  'Métricas y exportación de datos',
  'BarChart3',
  7
),
(
  'Preguntas Frecuentes',
  'faq',
  '# Preguntas Frecuentes (FAQ)

## General

### ¿Cómo cambio mi contraseña?
Ve a tu perfil (icono de usuario) > Configuración > Cambiar contraseña.

### ¿Puedo trabajar offline?
No, el CRM requiere conexión a internet para funcionar correctamente.

### ¿Cómo contacto a soporte?
Envía un email a soporte@capittal.com o usa el chat integrado.

---

## Mandatos

### ¿Cómo creo un nuevo mandato?
1. Ve a Mandatos > + Nuevo Mandato
2. Selecciona el tipo (Venta/Compra)
3. Completa la información requerida

### ¿Puedo duplicar un mandato existente?
Sí, en el menú de acciones del mandato selecciona "Duplicar".

### ¿Cómo cambio el estado de un mandato?
En la vista del mandato, haz clic en el badge de estado y selecciona el nuevo estado.

---

## Documentos

### ¿Qué formatos de archivo puedo subir?
PDF, Word, Excel, PowerPoint e imágenes (JPG, PNG).

### ¿Hay límite de tamaño?
Sí, máximo 25MB por archivo.

### ¿Los documentos están encriptados?
Sí, usamos encriptación AES-256 para todos los archivos.

---

## Errores comunes

### "No tienes permisos para esta acción"
Contacta a tu administrador para solicitar los permisos necesarios.

### "Error al cargar datos"
Refresca la página. Si persiste, verifica tu conexión a internet.

### "Sesión expirada"
Vuelve a iniciar sesión. Las sesiones expiran por seguridad después de inactividad.

---

> 💬 ¿No encuentras tu pregunta? Contacta a soporte@capittal.com',
  'Respuestas a dudas comunes',
  'HelpCircle',
  8
);