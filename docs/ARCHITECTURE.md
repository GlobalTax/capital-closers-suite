# Arquitectura del Proyecto

## Descripción General

Este proyecto sigue una arquitectura modular basada en React con TypeScript, utilizando Supabase como backend y React Query para la gestión de estado del servidor.

## Stack Tecnológico

- **Frontend**: React 18 + TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: 
  - Zustand (estado global de aplicación)
  - React Query (estado del servidor)
- **Backend**: Supabase
- **Build Tool**: Vite
- **Form Handling**: React Hook Form + Zod

## Estructura de Carpetas

```
src/
├── components/         # Componentes reutilizables
│   ├── ui/            # Componentes base (shadcn/ui)
│   ├── shared/        # Componentes compartidos
│   ├── layout/        # Layouts de la aplicación
│   ├── contactos/     # Componentes específicos de contactos
│   ├── empresas/      # Componentes específicos de empresas
│   ├── mandatos/      # Componentes específicos de mandatos
│   └── ...
├── features/          # Features organizadas por dominio
│   └── mandatos/
│       ├── components/  # Componentes del feature
│       └── tabs/        # Tabs del feature
├── hooks/             # Custom hooks
│   ├── queries/       # React Query hooks
│   └── ...
├── lib/               # Utilidades y configuraciones
│   ├── validation/    # Schemas y validadores
│   └── ...
├── pages/             # Páginas de la aplicación
├── services/          # Servicios de API
├── stores/            # Stores de Zustand
├── types/             # Definiciones de tipos TypeScript
└── integrations/      # Integraciones externas (Supabase)
```

## Patrones de Diseño

### 1. Service Layer Pattern

Cada entidad tiene su propio servicio que extiende `BaseService`:

```typescript
class EmpresaService extends BaseService<Empresa> {
  constructor() {
    super('empresas');
  }

  protected transform(raw: any): Empresa {
    // Transformación de datos
  }

  // Métodos específicos...
}
```

**Beneficios:**
- Código DRY (Don't Repeat Yourself)
- Manejo de errores centralizado
- Transformaciones consistentes
- Fácil de testear

### 2. React Query para Estado del Servidor

Utilizamos React Query hooks para todas las operaciones CRUD:

```typescript
// Lectura
const { data, isLoading, error } = useMandatos();

// Mutación
const { mutate } = useUpdateMandato();
```

**Beneficios:**
- Cache inteligente (5 minutos de staleTime)
- Refetch automático
- Optimistic updates
- Loading y error states automáticos

### 3. Zustand para Estado Global

Estado de aplicación en `useAppStore`:

```typescript
interface AppState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  // ...
}
```

**Cuándo usar:**
- Preferencias de usuario
- Estado de UI (sidebar, modales)
- Datos que no vienen del servidor

### 4. Validación Centralizada

Schemas de Zod en `lib/validation/schemas.ts`:

```typescript
export const mandatoCreateSchema = z.object({
  titulo: z.string().min(3),
  // ...
});
```

**Beneficios:**
- Validación consistente
- Type-safe
- Mensajes de error centralizados
- Reutilizable en forms y API

### 5. Error Handling Unificado

Sistema de errores en `lib/error-handler.ts`:

```typescript
try {
  await operation();
} catch (error) {
  handleError(error, 'Contexto de la operación');
}
```

**Tipos de errores:**
- `DatabaseError` - Errores de BD
- `ValidationError` - Errores de validación
- `AuthenticationError` - Errores de auth
- `AppError` - Errores genéricos de app

### 6. Loading States Centralizados

Componentes de skeleton en `components/shared/LoadingStates.tsx`:

```typescript
<WithLoading
  isLoading={isLoading}
  data={data}
  fallback={<PageSkeleton />}
>
  {(data) => <Content data={data} />}
</WithLoading>
```

### 7. Modularización de Páginas

Las páginas grandes se dividen en features y tabs:

```
pages/MandatoDetalle.tsx       (179 líneas)
  ├── features/mandatos/
  │   ├── components/
  │   │   ├── MandatoHeader.tsx
  │   │   └── MandatoKPIs.tsx
  │   └── tabs/
  │       ├── ResumenTab.tsx
  │       ├── FinanzasTab.tsx
  │       ├── ChecklistTab.tsx
  │       └── DocumentosTab.tsx
```

## Flujo de Datos

### 1. Lectura de Datos

```
Componente
  → useQuery hook
    → Service
      → Supabase Client
        → Base de Datos
      ← Datos raw
    ← Datos transformados
  ← Estado (data, loading, error)
```

### 2. Mutación de Datos

```
Componente (form submit)
  → useMutation hook
    → Optimistic update (cache)
    → Service
      → Validación
      → Supabase Client
        → Base de Datos
      ← Respuesta
    ← Invalidate queries
    ← Toast notification
```

## Convenciones de Código

### Nomenclatura

- **Componentes**: PascalCase (`MandatoCard.tsx`)
- **Hooks**: camelCase con prefijo `use` (`useMandatos.ts`)
- **Services**: camelCase con sufijo `Service` (`mandatoService`)
- **Types**: PascalCase (`Mandato`, `Empresa`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_UPLOAD_SIZE`)

### Archivos

- **Componentes**: Un componente por archivo
- **Exports**: Named exports preferidos
- **Index files**: Evitar archivos index.ts genéricos

### TypeScript

- **Tipos explícitos**: Preferir tipos explícitos en funciones públicas
- **`any` prohibido**: Usar tipos específicos o `unknown`
- **Interfaces vs Types**: Types para composición, Interfaces para extensión

### Estilos

- **Tailwind**: Usar semantic tokens del design system
- **No inline styles**: Evitar style={}
- **No custom colors**: Usar variables CSS del tema

## Performance

### Optimizaciones Implementadas

1. **Lazy Loading**: Páginas cargadas bajo demanda
   ```typescript
   const Mandatos = lazy(() => import('./pages/Mandatos'));
   ```

2. **React Query Cache**: 5 minutos de staleTime
3. **Prefetching**: En hover para navegación anticipada
4. **Code Splitting**: Por ruta
5. **Optimistic Updates**: En mutaciones críticas

### Métricas Objetivo

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.0s
- Largest Contentful Paint: < 2.5s

## Testing

### Estrategia

- **Unit Tests**: Services y utilidades
- **Integration Tests**: Hooks de React Query
- **E2E Tests**: Flujos críticos de usuario

### Herramientas

- Vitest (unit tests)
- React Testing Library (component tests)
- Playwright (E2E tests)

## Seguridad

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado en Supabase.

### Validación

- **Frontend**: Zod schemas
- **Backend**: RLS + Database constraints
- **Doble validación**: Cliente y servidor

### Autenticación

- Supabase Auth
- JWT tokens
- Refresh tokens automáticos

## Deployment

### Entornos

- **Development**: Local con Supabase local
- **Staging**: Vercel + Supabase staging
- **Production**: Vercel + Supabase production

### CI/CD

1. Push a GitHub
2. Tests automáticos
3. Build en Vercel
4. Deploy automático

## Roadmap

### Completado ✅

- [x] Arquitectura base
- [x] Sistema de errores
- [x] React Query integrado
- [x] Validación centralizada
- [x] Loading states
- [x] BaseService abstraction
- [x] Lazy loading

### En Progreso 🔄

- [ ] Eliminar `as any` (52 ocurrencias)
- [ ] Migrar todas las páginas a React Query
- [ ] Refactorizar servicios restantes

### Futuro 📋

- [ ] Prefetching en hover
- [ ] Error boundaries
- [ ] Tests unitarios
- [ ] E2E tests
- [ ] Performance monitoring
- [ ] Analytics
