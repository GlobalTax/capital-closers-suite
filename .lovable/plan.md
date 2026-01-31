

## Plan: Cambiar Vista de Resultados Apollo a Formato Lista/Tabla

### Situación Actual

Los resultados de la búsqueda en Apollo se muestran como **tarjetas (Cards)** apiladas verticalmente, lo que ocupa mucho espacio y dificulta la comparación rápida entre empresas.

### Solución

Cambiar la visualización a una **tabla compacta** que permita:
- Ver más empresas de un vistazo
- Comparar datos fácilmente (sector, país, empleados)
- Seleccionar múltiples items de forma más eficiente

---

### Cambios a Realizar

#### Modificar `ImportTargetsApolloDrawer.tsx`

Reemplazar el renderizado de Cards por una tabla con estas columnas:

| Checkbox | Empresa | Sector | País | Empleados | Web |
|----------|---------|--------|------|-----------|-----|
| ☐ | Acme Corp | Industrial | España | 150 | acme.com |
| ☐ | Beta SL | Tecnología | Portugal | 45 | beta.io |

**Código actual (líneas 363-427):**
```tsx
<ScrollArea className="h-[400px]">
  <div className="space-y-2">
    {prospects.map((prospect, i) => (
      <Card>...</Card>
    ))}
  </div>
</ScrollArea>
```

**Código propuesto:**
```tsx
<ScrollArea className="h-[400px]">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-10">
          <Checkbox checked={allSelected} onChange={toggleSelectAll} />
        </TableHead>
        <TableHead>Empresa</TableHead>
        <TableHead>Sector</TableHead>
        <TableHead>País</TableHead>
        <TableHead>Empleados</TableHead>
        <TableHead>Web</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {prospects.map((prospect) => (
        <TableRow 
          key={orgName}
          className={isSelected ? 'bg-primary/5' : ''}
          onClick={() => toggleSelection(orgName)}
        >
          <TableCell>
            <Checkbox checked={isSelected} />
          </TableCell>
          <TableCell className="font-medium">{orgName}</TableCell>
          <TableCell>{industry}</TableCell>
          <TableCell>{country}</TableCell>
          <TableCell>{employees}</TableCell>
          <TableCell>
            <a href={domain} target="_blank">
              <ExternalLink className="h-4 w-4" />
            </a>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</ScrollArea>
```

---

### Archivo a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/targets/ImportTargetsApolloDrawer.tsx` | Reemplazar Cards por Table en la sección de resultados |

---

### Resultado Esperado

Antes: Tarjetas apiladas que muestran 3-4 empresas por pantalla

Después: Tabla compacta que muestra 10-15 empresas por pantalla con:
- Checkbox para selección
- Nombre de empresa
- Sector/Industria  
- País
- Número de empleados
- Link a web (si disponible)
- Filas clicables para seleccionar
- Header sticky con "seleccionar todos"

