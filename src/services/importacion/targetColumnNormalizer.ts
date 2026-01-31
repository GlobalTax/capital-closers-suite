/**
 * Normalizador de columnas específico para importación de Targets
 */

// Mapeo de aliases de columnas para TARGETS
const targetAliases: Record<string, string[]> = {
  nombre: [
    'nombre', 'empresa', 'company', 'company_name', 'razon_social', 'razón social',
    'nombre_empresa', 'company name', 'organization', 'org', 'target', 'target_name',
    'business_name', 'business', 'nombre comercial'
  ],
  sector: [
    'sector', 'industry', 'industria', 'actividad', 'sector_actividad',
    'vertical', 'segment', 'segmento', 'categoria', 'category'
  ],
  ubicacion: [
    'ubicacion', 'ubicación', 'ciudad', 'city', 'pais', 'país', 'country',
    'location', 'geografia', 'geografía', 'geography', 'region', 'zona',
    'direccion', 'address', 'headquarters', 'sede'
  ],
  facturacion: [
    'facturacion', 'facturación', 'revenue', 'ventas', 'sales', 'ingresos',
    'turnover', 'cifra_negocio', 'annual_revenue', 'yearly_revenue', 'volumen'
  ],
  empleados: [
    'empleados', 'employees', 'plantilla', 'headcount', 'staff', 'workers',
    'num_empleados', 'employee_count', 'team_size', 'size', 'tamaño'
  ],
  sitio_web: [
    'web', 'website', 'url', 'sitio', 'pagina', 'página', 'sitio_web',
    'web_url', 'homepage', 'domain', 'dominio', 'portal'
  ],
  contacto_nombre: [
    'contacto', 'contact', 'persona', 'nombre_contacto', 'contact_name',
    'persona_contacto', 'key_contact', 'primary_contact', 'responsable'
  ],
  contacto_email: [
    'email', 'correo', 'e-mail', 'mail', 'contact_email', 'email_contacto',
    'correo_electronico', 'email_address', 'emailaddress'
  ],
  contacto_telefono: [
    'telefono', 'teléfono', 'phone', 'tel', 'mobile', 'movil', 'móvil',
    'contact_phone', 'telefono_contacto', 'celular', 'whatsapp'
  ],
  buyer_type: [
    'tipo', 'type', 'buyer_type', 'clasificacion', 'clasificación',
    'tipo_comprador', 'investor_type', 'categoria', 'category'
  ],
  tags: [
    'tags', 'etiquetas', 'labels', 'categorias', 'keywords',
    'palabras_clave', 'marcas'
  ],
  notas: [
    'notas', 'notes', 'comentarios', 'comments', 'observaciones',
    'descripcion', 'description', 'remarks', 'info'
  ]
};

/**
 * Normaliza una clave para comparación flexible
 */
const normalizeKey = (key: string): string => {
  if (!key) return '';
  
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[_\-\s.]+/g, '') // Eliminar separadores
    .trim();
};

/**
 * Busca el valor de una columna usando aliases flexibles
 */
const findValueByAliases = (
  row: Record<string, string>,
  aliases: string[]
): string | undefined => {
  for (const alias of aliases) {
    const normalizedAlias = normalizeKey(alias);
    
    const matchingKey = Object.keys(row).find(
      k => normalizeKey(k) === normalizedAlias
    );
    
    if (matchingKey && row[matchingKey]) {
      return row[matchingKey].trim();
    }
  }
  
  return undefined;
};

/**
 * Normaliza buyer_type a valor válido
 */
const normalizeBuyerType = (value: string): string | undefined => {
  const normalized = value.toLowerCase().trim();
  
  const mappings: Record<string, string> = {
    'estrategico': 'estrategico',
    'estratégico': 'estrategico',
    'strategic': 'estrategico',
    'financiero': 'financiero',
    'financial': 'financiero',
    'private equity': 'financiero',
    'pe': 'financiero',
    'adyacente': 'adyacente',
    'adjacent': 'adyacente',
    'mixto': 'mixto',
    'mixed': 'mixto',
    'hybrid': 'mixto',
  };
  
  return mappings[normalized] || undefined;
};

/**
 * Parsea tags desde un string (separados por coma, punto y coma, o |)
 */
const parseTags = (value: string): string[] => {
  if (!value) return [];
  
  return value
    .split(/[,;|]/)
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
};

/**
 * Normaliza una fila del spreadsheet a formato TargetImportRow
 */
export const normalizeTargetRow = (
  row: Record<string, string>
): Record<string, any> => {
  const normalized: Record<string, any> = {};

  for (const [standardField, aliases] of Object.entries(targetAliases)) {
    const value = findValueByAliases(row, aliases);
    
    if (value) {
      let processedValue: any = value;
      
      // Procesamiento específico por campo
      if (standardField === 'email' || standardField === 'contacto_email') {
        processedValue = value.toLowerCase().trim().replace(/\s/g, '');
      }
      
      if (standardField === 'buyer_type') {
        processedValue = normalizeBuyerType(value);
      }
      
      if (standardField === 'tags') {
        processedValue = parseTags(value);
      }
      
      if (standardField === 'empleados') {
        // Limpiar y convertir a número
        const cleaned = value.split('-')[0].replace(/[^\d]/g, '');
        processedValue = cleaned ? parseInt(cleaned, 10) : undefined;
      }
      
      if (standardField === 'facturacion') {
        // Mantener como string para parseo posterior
        processedValue = value;
      }
      
      if (processedValue !== undefined && processedValue !== '') {
        normalized[standardField] = processedValue;
      }
    }
  }

  return normalized;
};

/**
 * Valida que una fila tenga los campos mínimos requeridos
 */
export const hasMinimumTargetData = (row: Record<string, any>): boolean => {
  const nombre = (row.nombre || '').toString().trim();
  return nombre.length >= 2;
};

/**
 * Detecta qué columnas del archivo coinciden con campos conocidos
 */
export const detectMappedColumns = (headers: string[]): { 
  mapped: Array<{ header: string; field: string }>;
  unmapped: string[];
} => {
  const mapped: Array<{ header: string; field: string }> = [];
  const unmapped: string[] = [];
  
  for (const header of headers) {
    const normalizedHeader = normalizeKey(header);
    let foundField: string | null = null;
    
    for (const [field, aliases] of Object.entries(targetAliases)) {
      if (aliases.some(alias => normalizeKey(alias) === normalizedHeader)) {
        foundField = field;
        break;
      }
    }
    
    if (foundField) {
      mapped.push({ header, field: foundField });
    } else {
      unmapped.push(header);
    }
  }
  
  return { mapped, unmapped };
};
