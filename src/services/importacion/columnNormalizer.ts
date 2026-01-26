/**
 * Normalizador de columnas para importación flexible
 * Mapea nombres de columnas con variaciones (español, inglés, con/sin acentos)
 */

// Mapeo de aliases de columnas para MANDATOS
const mandatoAliases: Record<string, string[]> = {
  titulo: ['titulo', 'título', 'name', 'nombre', 'oportunidad', 'deal_name', 'deal', 'opportunity'],
  tipo: ['tipo', 'type', 'deal_type', 'transaction_type', 'operacion', 'operación'],
  empresa_nombre: ['empresa_nombre', 'empresa', 'company', 'company_name', 'cliente', 'client', 'compañía', 'compania'],
  empresa_cif: ['empresa_cif', 'cif', 'tax_id', 'vat', 'nif', 'identificacion_fiscal'],
  sector: ['sector', 'industry', 'industria', 'sector_actividad'],
  valor: ['valor', 'value', 'amount', 'importe', 'price', 'precio', 'deal_value'],
  estado: ['estado', 'status', 'phase', 'fase', 'stage', 'etapa'],
  fecha_inicio: ['fecha_inicio', 'fecha', 'start_date', 'date', 'created', 'creado', 'fecha_creacion'],
  descripcion: ['descripcion', 'descripción', 'description', 'notes', 'notas', 'comments', 'comentarios']
};

// Mapeo de aliases de columnas para CONTACTOS (ampliado)
const contactAliases: Record<string, string[]> = {
  nombre: [
    'nombre', 'name', 'first_name', 'firstname', 'first name', 'primer_nombre',
    'nombre_completo', 'full_name', 'fullname', 'contacto', 'contact_name',
    'contact', 'nombre_contacto', 'persona'
  ],
  apellidos: [
    'apellidos', 'apellido', 'lastname', 'last_name', 'surname', 
    'last name', 'segundo_nombre', 'family_name'
  ],
  email: [
    'email', 'e-mail', 'correo', 'mail', 'correo_electronico', 'correo electronico',
    'email_address', 'emailaddress', 'e_mail', 'direccion_email', 'electronic_mail'
  ],
  telefono: [
    'telefono', 'teléfono', 'phone', 'mobile', 'movil', 'móvil',
    'celular', 'tel', 'telephone', 'phone_number', 'numero_telefono',
    'número_teléfono', 'cell', 'whatsapp'
  ],
  cargo: [
    'cargo', 'position', 'job_title', 'title', 'puesto', 'rol',
    'role', 'job', 'ocupacion', 'ocupación', 'posicion', 'titulo'
  ],
  empresa_nombre: [
    'empresa_nombre', 'empresa', 'company', 'company_name', 
    'compania', 'compañia', 'compañía', 'organizacion', 'organización', 
    'organization', 'org', 'cliente', 'client', 'empresa_cliente'
  ],
  linkedin: [
    'linkedin', 'linkedin_url', 'linkedin_profile', 'perfil_linkedin',
    'url_linkedin', 'linkedinurl'
  ],
  notas: [
    'notas', 'notes', 'comentarios', 'comments', 'observaciones',
    'descripcion', 'description'
  ]
};

/**
 * Normaliza una clave para comparación flexible
 * Elimina acentos, guiones, espacios y pasa a minúsculas
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
    
    // Buscar la clave en el row que coincida
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
 * Normaliza una fila del CSV/Excel mapeando columnas flexibles a nombres estándar (MANDATOS)
 */
export const normalizeMandatoRow = (row: Record<string, string>): Record<string, string> => {
  const normalized: Record<string, string> = {};

  for (const [standardField, aliases] of Object.entries(mandatoAliases)) {
    const value = findValueByAliases(row, aliases);
    
    if (value) {
      let processedValue = value;

      // Auto-correcciones específicas por campo
      if (standardField === 'tipo') {
        processedValue = value.toLowerCase();
        // Normalizar variantes
        if (['sale', 'sell', 'selling'].includes(processedValue)) {
          processedValue = 'venta';
        } else if (['buy', 'buying', 'purchase'].includes(processedValue)) {
          processedValue = 'compra';
        }
      }
      
      if (standardField === 'estado') {
        processedValue = value.toLowerCase().replace(/\s+/g, '_');
        // Si no es un estado válido, usar prospecto
        const estadosValidos = ['prospecto', 'en_negociacion', 'ganado', 'perdido', 'cancelado'];
        if (!estadosValidos.includes(processedValue)) {
          processedValue = 'prospecto';
        }
      }

      if (standardField === 'valor') {
        // Limpiar formato de moneda: €, $, separadores de miles
        processedValue = value.replace(/[^0-9.,\-]/g, '').replace(',', '.');
      }

      normalized[standardField] = processedValue;
    }
  }

  // Defaults
  if (!normalized.estado) {
    normalized.estado = 'prospecto';
  }

  return normalized;
};

/**
 * Normaliza una fila para CONTACTOS con mapeo flexible
 */
export const normalizeContactoRow = (
  row: Record<string, string>
): Record<string, string> => {
  const normalized: Record<string, string> = {};

  for (const [standardField, aliases] of Object.entries(contactAliases)) {
    const value = findValueByAliases(row, aliases);
    
    if (value) {
      let processedValue = value;
      
      // Limpiezas específicas por campo
      if (standardField === 'email') {
        // Normalizar email: trim, lowercase, eliminar espacios internos
        processedValue = value.toLowerCase().trim().replace(/\s/g, '');
      }
      
      if (standardField === 'telefono') {
        // Limpiar teléfono: mantener solo números, + y espacios
        processedValue = value.replace(/[^\d+\s\-()]/g, '').trim();
      }
      
      normalized[standardField] = processedValue;
    }
  }

  // Si no hay nombre pero hay email, extraer posible nombre del email
  if (!normalized.nombre && normalized.email) {
    const emailName = normalized.email.split('@')[0];
    // Solo usar si parece un nombre (tiene letras, no es solo números)
    if (emailName && /[a-zA-Z]/.test(emailName)) {
      // Capitalizar y limpiar
      normalized.nombre = emailName
        .replace(/[._\-]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .trim();
    }
  }

  return normalized;
};

/**
 * Valida que una fila tenga los campos mínimos requeridos (tolerante)
 */
export const hasMinimumContactData = (row: Record<string, string>): boolean => {
  const nombre = (row.nombre || '').trim();
  const email = (row.email || '').trim();
  const empresa = (row.empresa_nombre || '').trim();
  
  // Válido si tiene email O (nombre + empresa)
  const hasEmail = email.length > 0 && email.includes('@');
  const hasNameAndCompany = nombre.length >= 2 && empresa.length >= 2;
  
  return hasEmail || hasNameAndCompany;
};
