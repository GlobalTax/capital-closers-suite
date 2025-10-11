/**
 * Normalizador de columnas para importación flexible
 */

// Mapeo de aliases de columnas
const columnAliases: Record<string, string[]> = {
  titulo: ['titulo', 'título', 'name', 'nombre', 'oportunidad', 'deal_name', 'deal'],
  tipo: ['tipo', 'type', 'deal_type', 'transaction_type'],
  empresa_nombre: ['empresa_nombre', 'empresa', 'company', 'company_name', 'cliente', 'client'],
  empresa_cif: ['empresa_cif', 'cif', 'tax_id', 'vat'],
  sector: ['sector', 'industry', 'industria'],
  valor: ['valor', 'value', 'amount', 'importe', 'price'],
  estado: ['estado', 'status', 'phase', 'fase', 'stage'],
  fecha_inicio: ['fecha_inicio', 'fecha', 'start_date', 'date', 'created', 'creado'],
  descripcion: ['descripcion', 'descripción', 'description', 'notes', 'notas', 'comments']
};

/**
 * Normaliza una fila del CSV mapeando columnas flexibles a nombres estándar
 */
export const normalizeMandatoRow = (row: Record<string, string>): Record<string, string> => {
  const normalized: Record<string, string> = {};

  // Mapear cada campo estándar
  for (const [standardField, aliases] of Object.entries(columnAliases)) {
    for (const alias of aliases) {
      const key = Object.keys(row).find(k => k.toLowerCase() === alias.toLowerCase());
      if (key && row[key]) {
        let value = row[key].trim();

        // Auto-correcciones específicas
        if (standardField === 'tipo') {
          value = value.toLowerCase();
        }
        
        if (standardField === 'estado') {
          value = value.toLowerCase().replace(/\s+/g, '_');
          // Si no es un estado válido, usar prospecto
          const estadosValidos = ['prospecto', 'en_negociacion', 'ganado', 'perdido', 'cancelado'];
          if (!estadosValidos.includes(value)) {
            value = 'prospecto';
          }
        }

        if (standardField === 'valor') {
          // Limpiar formato de moneda
          value = value.replace(/[^0-9.-]/g, '');
        }

        normalized[standardField] = value;
        break;
      }
    }
  }

  // Si no hay estado, usar prospecto por defecto
  if (!normalized.estado) {
    normalized.estado = 'prospecto';
  }

  return normalized;
};

/**
 * Normaliza contactos
 */
export const normalizeContactoRow = (row: Record<string, string>): Record<string, string> => {
  const contactAliases: Record<string, string[]> = {
    nombre: ['nombre', 'name', 'first_name', 'firstname'],
    apellidos: ['apellidos', 'lastname', 'last_name', 'surname'],
    email: ['email', 'e-mail', 'correo', 'mail'],
    telefono: ['telefono', 'teléfono', 'phone', 'mobile', 'movil'],
    cargo: ['cargo', 'position', 'job_title', 'title', 'puesto'],
    empresa_nombre: ['empresa_nombre', 'empresa', 'company', 'company_name'],
    linkedin: ['linkedin', 'linkedin_url', 'linkedin_profile']
  };

  const normalized: Record<string, string> = {};

  for (const [standardField, aliases] of Object.entries(contactAliases)) {
    for (const alias of aliases) {
      const key = Object.keys(row).find(k => k.toLowerCase() === alias.toLowerCase());
      if (key && row[key]) {
        normalized[standardField] = row[key].trim();
        break;
      }
    }
  }

  return normalized;
};
