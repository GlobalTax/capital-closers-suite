

## Plan: Sistema Robusto de Importacion de Excel para Contactos

### Diagnostico del Problema

He identificado la causa raiz por la cual todos los registros se marcan como "Invalidos" al importar archivos Excel:

**Problemas Criticos Encontrados:**

1. **Sin soporte para Excel (XLSX/XLS)**: El sistema solo acepta CSV (`ImportarDatos.tsx:54-61`)
2. **No existe biblioteca de parsing Excel**: `package.json` no incluye ninguna libreria como `xlsx` o `sheetjs`
3. **Normalizacion no aplicada**: La funcion `normalizeContactoRow` existe pero NO SE USA antes de validar
4. **Validacion demasiado estricta**: Requiere AMBOS `nombre` (min 2 chars) Y `email` valido

```text
FLUJO ACTUAL (ROTO):
┌─────────────────┐     ┌──────────────┐     ┌───────────────┐
│ Archivo Excel   │────▶│ parseCSV()   │────▶│ Datos corrup- │
│ (.xlsx)         │     │ (solo CSV!)  │     │ tos/vacios    │
└─────────────────┘     └──────────────┘     └───────────────┘
                                                     │
                                                     ▼
                               ┌───────────────────────────────────┐
                               │ validateContactoRow()             │
                               │ - busca row.nombre → undefined    │
                               │ - busca row.email → undefined     │
                               │ → TODOS INVALIDOS                 │
                               └───────────────────────────────────┘
```

---

### Solucion Propuesta

```text
FLUJO CORREGIDO:
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│ Archivo Excel   │────▶│ parseSpreadsheet │────▶│ Datos JSON     │
│ (.xlsx/.csv)    │     │ (detecta formato)│     │ estructurados  │
└─────────────────┘     └──────────────────┘     └────────────────┘
                                                        │
                        ┌───────────────────────────────┘
                        ▼
            ┌─────────────────────────┐     ┌───────────────────────┐
            │ normalizeContactoRow()  │────▶│ Mapeo de columnas:    │
            │ - Mapea "Nombre" → nombre   │ "Correo" → email      │
            │ - Trim + lowercase          │ "Empresa" → empresa   │
            └─────────────────────────┘     └───────────────────────┘
                                                        │
                                                        ▼
                               ┌───────────────────────────────────┐
                               │ validateContactoRowTolerant()     │
                               │ - Valido si: email                │
                               │   OR (nombre + empresa)           │
                               │ - Trim emails antes de validar    │
                               │ - Case-insensitive                │
                               └───────────────────────────────────┘
```

---

### Archivos a Modificar/Crear

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `package.json` | Modificar | Agregar dependencia `xlsx` (SheetJS) |
| `src/services/importacion/spreadsheetParser.ts` | Crear | Parser universal para CSV y XLSX |
| `src/services/importacion/columnNormalizer.ts` | Modificar | Ampliar aliases y agregar normalizacion de headers |
| `src/services/importacion/validator.ts` | Modificar | Hacer validacion tolerante, usar normalizacion previa |
| `src/pages/ImportarDatos.tsx` | Modificar | Aceptar XLSX/XLS, usar nuevo parser |
| `src/services/importacion/importContactos.ts` | Modificar | Aplicar normalizacion antes de importar |

---

### Cambios Detallados

#### 1. package.json - Agregar Dependencia XLSX

```json
"dependencies": {
  "xlsx": "^0.18.5",
  // ... resto de dependencias
}
```

La libreria `xlsx` (SheetJS) es el estandar de la industria para parsear archivos Excel en JavaScript. Soporta XLS, XLSX, CSV, y muchos mas formatos.

---

#### 2. Nuevo: `src/services/importacion/spreadsheetParser.ts`

Parser universal que detecta automaticamente el formato del archivo:

```typescript
import * as XLSX from 'xlsx';

export interface ParsedSpreadsheet {
  headers: string[];
  rows: Record<string, string>[];
  rawRows: string[][];
  format: 'xlsx' | 'xls' | 'csv';
}

// Normaliza headers: trim, lowercase, eliminar acentos
const normalizeHeader = (header: string): string => {
  return header
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Eliminar acentos
};

// Detectar si una fila esta completamente vacia
const isEmptyRow = (row: any[]): boolean => {
  return row.every(cell => 
    cell === null || 
    cell === undefined || 
    String(cell).trim() === ''
  );
};

export const parseSpreadsheet = async (file: File): Promise<ParsedSpreadsheet> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const isExcel = ['xlsx', 'xls'].includes(extension || '');
  
  if (!isExcel && extension !== 'csv') {
    throw new Error('Formato no soportado. Use CSV, XLS o XLSX.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  
  // Tomar primera hoja
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convertir a JSON (array de arrays)
  const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { 
    header: 1,
    defval: '',
    raw: false // Convertir todo a string
  });

  if (rawData.length < 2) {
    throw new Error('El archivo debe tener al menos headers y una fila de datos');
  }

  // Normalizar headers
  const headers = (rawData[0] as string[])
    .map(h => normalizeHeader(h))
    .filter(h => h.length > 0);

  const rawRows: string[][] = [];
  const rows: Record<string, string>[] = [];

  // Procesar filas (saltando header)
  for (let i = 1; i < rawData.length; i++) {
    const rowArray = rawData[i] as any[];
    
    // Ignorar filas completamente vacias
    if (isEmptyRow(rowArray)) continue;

    rawRows.push(rowArray.map(String));

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      const value = rowArray[index];
      row[header] = value !== null && value !== undefined 
        ? String(value).trim() 
        : '';
    });
    rows.push(row);
  }

  if (rows.length === 0) {
    throw new Error('No se encontraron filas con datos validos');
  }

  return {
    headers,
    rows,
    rawRows,
    format: extension as 'xlsx' | 'xls' | 'csv'
  };
};
```

---

#### 3. Modificar: `src/services/importacion/columnNormalizer.ts`

Ampliar los aliases y agregar normalizacion robusta:

```typescript
// Ampliar aliases para contactos
const contactAliases: Record<string, string[]> = {
  nombre: [
    'nombre', 'name', 'first_name', 'firstname', 'first name',
    'nombre completo', 'full_name', 'fullname', 'contacto', 'contact_name'
  ],
  apellidos: [
    'apellidos', 'apellido', 'lastname', 'last_name', 'surname', 
    'last name', 'segundo nombre'
  ],
  email: [
    'email', 'e-mail', 'correo', 'mail', 'correo electronico',
    'email_address', 'emailaddress', 'correo_electronico'
  ],
  telefono: [
    'telefono', 'teléfono', 'phone', 'mobile', 'movil', 'móvil',
    'celular', 'tel', 'telephone', 'phone_number'
  ],
  cargo: [
    'cargo', 'position', 'job_title', 'title', 'puesto', 'rol',
    'role', 'job', 'ocupacion'
  ],
  empresa_nombre: [
    'empresa_nombre', 'empresa', 'company', 'company_name', 
    'compania', 'compañia', 'organizacion', 'organization'
  ],
  linkedin: [
    'linkedin', 'linkedin_url', 'linkedin_profile', 'perfil_linkedin'
  ]
};

// Normaliza una fila aplicando mapeo flexible + limpieza
export const normalizeContactoRow = (
  row: Record<string, string>
): Record<string, string> => {
  const normalized: Record<string, string> = {};

  // Normalizar la clave para comparacion
  const normalizeKey = (key: string): string => {
    return key
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[_\-\s]+/g, '')
      .trim();
  };

  for (const [standardField, aliases] of Object.entries(contactAliases)) {
    for (const alias of aliases) {
      const normalizedAlias = normalizeKey(alias);
      const matchingKey = Object.keys(row).find(
        k => normalizeKey(k) === normalizedAlias
      );
      
      if (matchingKey && row[matchingKey]) {
        let value = row[matchingKey].trim();
        
        // Limpiezas especificas por campo
        if (standardField === 'email') {
          value = value.toLowerCase().trim();
        }
        
        normalized[standardField] = value;
        break;
      }
    }
  }

  return normalized;
};
```

---

#### 4. Modificar: `src/services/importacion/validator.ts`

Hacer la validacion tolerante:

```typescript
// Regex mas tolerante para email
const EMAIL_REGEX_TOLERANT = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

// Nueva funcion de validacion tolerante
export const validateContactoRowTolerant = (
  row: Record<string, string>
): ValidationResult => {
  const errors: ValidationError[] = [];

  // Limpiar email antes de validar
  const email = (row.email || '').trim().toLowerCase();
  const nombre = (row.nombre || '').trim();
  const empresa = (row.empresa_nombre || '').trim();

  // Regla principal: es valido si tiene email valido
  // O si tiene (nombre + empresa)
  const hasValidEmail = email && EMAIL_REGEX_TOLERANT.test(email);
  const hasNameAndCompany = nombre.length >= 2 && empresa.length >= 2;

  if (!hasValidEmail && !hasNameAndCompany) {
    errors.push({
      field: 'email',
      message: 'Se requiere email valido O (nombre + empresa)',
      severity: 'error'
    });
  }

  // Validaciones secundarias (warnings, no bloquean)
  if (email && !hasValidEmail) {
    errors.push({
      field: 'email',
      message: `Email "${email}" tiene formato invalido`,
      severity: 'warning'
    });
  }

  if (row.telefono) {
    const phone = row.telefono.replace(/[\s\-\(\)]/g, '');
    if (phone.length < 9) {
      errors.push({
        field: 'telefono',
        message: 'Telefono muy corto (se importara igualmente)',
        severity: 'warning'
      });
    }
  }

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors
  };
};
```

---

#### 5. Modificar: `src/pages/ImportarDatos.tsx`

Aceptar Excel y usar nuevo parser:

```typescript
// Cambiar imports
import { parseSpreadsheet } from "@/services/importacion/spreadsheetParser";
import { normalizeContactoRow } from "@/services/importacion/columnNormalizer";

// Modificar dropzone config
const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop,
  accept: { 
    'text/csv': ['.csv'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-excel': ['.xls']
  },
  maxFiles: 1,
  maxSize: 10 * 1024 * 1024 // 10MB para Excel
});

// Modificar onDrop
const onDrop = useCallback(async (acceptedFiles: File[]) => {
  if (acceptedFiles.length === 0) return;

  const file = acceptedFiles[0];
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  // Validar extension
  if (!['csv', 'xlsx', 'xls'].includes(extension || '')) {
    toast({
      title: "Formato no soportado",
      description: "Use archivos CSV, XLSX o XLS",
      variant: "destructive"
    });
    return;
  }

  try {
    // Usar parser universal
    const parsed = await parseSpreadsheet(file);
    
    // Normalizar filas antes de validar
    const normalizedRows = parsed.rows.map(row => {
      if (activeTab === 'contactos') {
        return normalizeContactoRow(row);
      }
      return normalizeMandatoRow(row);
    });
    
    setParsedData({
      ...parsed,
      rows: normalizedRows
    });
    
    // Validar con funcion tolerante
    const validator = activeTab === 'mandatos' 
      ? validateMandatoRow 
      : validateContactoRowTolerant;
    const validations = normalizedRows.map(row => validator(row));
    setValidationResults(validations);

    const valid = validations.filter(v => v.isValid).length;
    const invalid = validations.filter(v => !v.isValid).length;
    
    toast({
      title: `Archivo cargado (${parsed.format.toUpperCase()})`,
      description: `${valid} validos, ${invalid} requieren revision`,
    });

  } catch (error: any) {
    toast({
      title: "Error al leer archivo",
      description: error.message,
      variant: "destructive"
    });
  }
}, [activeTab, toast]);
```

---

#### 6. Modificar: `src/services/importacion/importContactos.ts`

Aplicar normalizacion antes de importar:

```typescript
import { normalizeContactoRow } from "./columnNormalizer";
import { validateContactoRowTolerant } from "./validator";

export const importContacto = async (
  row: Record<string, string>,
  rowIndex: number,
  config: ImportConfig,
  importLogId: string
): Promise<ImportResult> => {
  // NUEVO: Normalizar la fila primero
  const normalizedRow = normalizeContactoRow(row);
  
  const name = `${normalizedRow.nombre || 'Sin nombre'} ${normalizedRow.apellidos || ''}`.trim();

  try {
    // Usar validacion tolerante
    const validation = validateContactoRowTolerant(normalizedRow);
    if (!validation.isValid) {
      return {
        name,
        status: 'error',
        message: validation.errors.map(e => e.message).join('; '),
        rowIndex
      };
    }

    // Resto del codigo usando normalizedRow en lugar de row
    // ...
  }
};
```

---

### Resumen de Mejoras

| Aspecto | Antes | Despues |
|---------|-------|---------|
| Formatos soportados | Solo CSV | CSV, XLSX, XLS |
| Normalizacion headers | Solo lowercase + trim | + eliminar acentos + mapeo flexible |
| Mapeo columnas | No se aplicaba | Aplicado antes de validar |
| Validacion email | Requiere nombre Y email | Email O (nombre + empresa) |
| Emails con espacios | Error | Auto-trim |
| Emails mayusculas | Posible error | Auto-lowercase |
| Filas vacias | Podian causar error | Ignoradas automaticamente |
| Feedback errores | Generico | Especifico por campo |

---

### Pruebas Post-Implementacion

1. Subir Excel con headers en espanol ("Nombre", "Correo", "Empresa")
2. Subir Excel con headers en ingles ("Name", "Email", "Company")
3. Subir Excel con columnas extra no esperadas
4. Subir Excel con emails en MAYUSCULAS
5. Subir Excel con espacios en emails
6. Subir Excel con filas vacias intermedias
7. Confirmar que contactos validos se crean en la base de datos

