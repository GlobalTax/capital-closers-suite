/**
 * Mapping between application routes and help section slugs
 * Used for contextual help buttons that open the relevant manual section
 */

export const HELP_MAPPING: Record<string, string> = {
  // Main routes
  '/dashboard': 'introduccion',
  '/empresas': 'empresas-contactos',
  '/contactos': 'empresas-contactos',
  '/mandatos': 'mandatos',
  '/documentos': 'documentos-teasers',
  '/tareas': 'tareas-calendario',
  '/calendario': 'tareas-calendario',
  '/reportes': 'reportes',
  '/search-funds': 'mandatos',
  '/presentaciones': 'documentos-teasers',
  '/gestor-documentos': 'documentos-teasers',
  '/perfil': 'introduccion',
  '/mis-horas': 'tareas-calendario',
  '/servicios': 'mandatos',
  // Detail routes (patterns)
  '/empresas/:id': 'empresas-contactos',
  '/contactos/:id': 'empresas-contactos',
  '/mandatos/:id': 'mandatos',
  '/search-funds/:id': 'mandatos',
};

/**
 * Get the help slug for a given route path
 * Supports exact matches and pattern matching for dynamic routes
 */
export function getHelpSlugForRoute(pathname: string): string {
  // Exact match first
  if (HELP_MAPPING[pathname]) {
    return HELP_MAPPING[pathname];
  }
  
  // Pattern matching for routes with :id
  for (const [pattern, slug] of Object.entries(HELP_MAPPING)) {
    if (pattern.includes(':')) {
      const regex = new RegExp('^' + pattern.replace(/:\w+/g, '[^/]+') + '$');
      if (regex.test(pathname)) {
        return slug;
      }
    }
  }
  
  return 'introduccion'; // Fallback
}
