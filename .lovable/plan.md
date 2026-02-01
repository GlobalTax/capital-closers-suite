
## Plan: Paginación Automática para Listas Apollo

### Problema Actual

La función `loadListContacts` solo carga los primeros 100 contactos de una lista Apollo:

```typescript
const { data, error } = await supabase.functions.invoke('get-apollo-list-contacts', {
  body: { label_id: selectedLabelId, page: 1, per_page: 100 },
});
```

Si una lista tiene 500 contactos, solo se importan los primeros 100.

### Solución: Carga Paginada con Progreso

Implementar un loop que cargue todas las páginas automáticamente, mostrando el progreso al usuario:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  Cargando contactos de "Lista M&A España"                                    │
│                                                                              │
│  ████████████████████░░░░░░░░░░░░░░░░░░░░  75%                              │
│                                                                              │
│  Página 3 de 4  •  375 de 500 contactos cargados                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### Cambios Técnicos

#### 1. Añadir Estado para Progreso de Paginación

Nuevas variables de estado para mostrar el progreso:

```typescript
// Pagination state for list loading
const [listLoadingProgress, setListLoadingProgress] = useState({
  currentPage: 0,
  totalPages: 0,
  loadedContacts: 0,
  totalContacts: 0,
});
```

#### 2. Modificar `loadListContacts` con Loop de Paginación

Reescribir la función para cargar todas las páginas:

```typescript
const loadListContacts = async () => {
  if (!selectedLabelId) {
    toast.error('Selecciona una lista');
    return;
  }

  setLoadingContacts(true);
  setContacts([]);
  
  const allContacts: ApolloContact[] = [];
  let currentPage = 1;
  let totalPages = 1;
  let totalEntries = 0;

  try {
    // Loop through all pages
    while (currentPage <= totalPages) {
      const { data, error } = await supabase.functions.invoke('get-apollo-list-contacts', {
        body: { label_id: selectedLabelId, page: currentPage, per_page: 100 },
      });
      
      if (error) throw error;
      
      const pageContacts = data?.contacts || [];
      allContacts.push(...pageContacts);
      
      // Update pagination info from first request
      if (currentPage === 1) {
        totalPages = data?.pagination?.total_pages || 1;
        totalEntries = data?.pagination?.total_entries || pageContacts.length;
      }
      
      // Update progress state
      setListLoadingProgress({
        currentPage,
        totalPages,
        loadedContacts: allContacts.length,
        totalContacts: totalEntries,
      });
      
      currentPage++;
    }
    
    setContacts(allContacts);
    setStep('results');
    
    if (allContacts.length === 0) {
      toast.info('La lista no tiene contactos');
    } else {
      toast.success(`${allContacts.length} contactos cargados`);
    }
  } catch (error: any) {
    console.error('[Apollo] Error loading contacts:', error);
    toast.error('Error al cargar contactos', { description: error.message });
  } finally {
    setLoadingContacts(false);
    setListLoadingProgress({ currentPage: 0, totalPages: 0, loadedContacts: 0, totalContacts: 0 });
  }
};
```

#### 3. Mostrar UI de Progreso Durante Carga

En el botón y en la sección de lista, mostrar el progreso:

**En el footer (botón):**
```tsx
{step === 'select' && method === 'list' && (
  <Button 
    className="flex-1" 
    onClick={loadListContacts}
    disabled={loadingContacts || !selectedLabelId}
  >
    {loadingContacts ? (
      <>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        {listLoadingProgress.totalPages > 1 
          ? `Página ${listLoadingProgress.currentPage}/${listLoadingProgress.totalPages}...`
          : 'Cargando...'
        }
      </>
    ) : (
      <><List className="h-4 w-4 mr-2" />Cargar contactos</>
    )}
  </Button>
)}
```

**En el contenido de la pestaña (opcional, mostrar barra de progreso):**
```tsx
{loadingContacts && listLoadingProgress.totalPages > 1 && (
  <Card>
    <CardContent className="py-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Cargando contactos...</span>
          <span className="text-muted-foreground">
            {listLoadingProgress.loadedContacts} de {listLoadingProgress.totalContacts}
          </span>
        </div>
        <Progress 
          value={(listLoadingProgress.currentPage / listLoadingProgress.totalPages) * 100} 
        />
        <p className="text-xs text-muted-foreground text-center">
          Página {listLoadingProgress.currentPage} de {listLoadingProgress.totalPages}
        </p>
      </div>
    </CardContent>
  </Card>
)}
```

#### 4. Reset del Estado de Progreso

Añadir reset en `resetState`:
```typescript
setListLoadingProgress({ currentPage: 0, totalPages: 0, loadedContacts: 0, totalContacts: 0 });
```

---

### Diagrama del Flujo

```text
Usuario selecciona lista (500 contactos)
         │
         ▼
   [Cargar contactos]
         │
         ▼
┌─────────────────────────┐
│ Página 1: 100 contactos │ → Progress: 20%
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Página 2: 100 contactos │ → Progress: 40%
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Página 3: 100 contactos │ → Progress: 60%
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Página 4: 100 contactos │ → Progress: 80%
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Página 5: 100 contactos │ → Progress: 100%
└─────────────────────────┘
         │
         ▼
  500 contactos cargados
    → Paso "results"
```

---

### Archivo a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/targets/ImportTargetsApolloDrawer.tsx` | Añadir estado de progreso, reescribir `loadListContacts` con loop, añadir UI de progreso |

### Comportamiento

1. **Listas pequeñas (≤100)**: Sin cambios visibles, carga en una sola petición
2. **Listas grandes (>100)**: Muestra barra de progreso con página actual y contactos cargados
3. **Errores**: Si falla en cualquier página, se muestra error y se mantienen los contactos ya cargados

### Beneficios

- **Completitud**: Se cargan todos los contactos, sin límite de 100
- **Transparencia**: El usuario ve el progreso en tiempo real
- **Robustez**: La Edge Function ya soporta paginación, solo falta el loop en frontend
