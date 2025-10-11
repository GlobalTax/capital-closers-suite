import { Database } from "@/integrations/supabase/types";

/**
 * Tipos base de las tablas de Supabase
 */
export type MandatoRow = Database['public']['Tables']['mandatos']['Row'];
export type EmpresaRow = Database['public']['Tables']['empresas']['Row'];
export type ContactoRow = Database['public']['Tables']['contactos']['Row'];
export type DocumentoRow = Database['public']['Tables']['documentos']['Row'];
export type TareaRow = Database['public']['Tables']['tareas']['Row'];
export type InteraccionRow = Database['public']['Tables']['interacciones']['Row'];
export type ChecklistTaskRow = Database['public']['Tables']['mandato_checklist_tasks']['Row'];

/**
 * Tipos con relaciones específicas para las vistas de detalle
 */
export type MandatoWithRelations = MandatoRow & {
  empresa_principal: EmpresaRow | null;
  contactos: Array<{
    contacto_id: string;
    rol: string;
    notas?: string;
    contacto: ContactoRow;
  }>;
};

export type ContactoWithEmpresa = ContactoRow & {
  empresa_principal: EmpresaRow | null;
};

export type DocumentoWithRelations = DocumentoRow & {
  mandato?: MandatoRow;
  contacto?: ContactoRow;
  empresa?: EmpresaRow;
};

/**
 * Tipos para inserts (omitiendo campos autogenerados)
 */
export type MandatoInsert = Database['public']['Tables']['mandatos']['Insert'];
export type EmpresaInsert = Database['public']['Tables']['empresas']['Insert'];
export type ContactoInsert = Database['public']['Tables']['contactos']['Insert'];
export type DocumentoInsert = Database['public']['Tables']['documentos']['Insert'];
export type TareaInsert = Database['public']['Tables']['tareas']['Insert'];
export type InteraccionInsert = Database['public']['Tables']['interacciones']['Insert'];

/**
 * Tipos para updates (todos los campos opcionales excepto id)
 */
export type MandatoUpdate = Database['public']['Tables']['mandatos']['Update'];
export type EmpresaUpdate = Database['public']['Tables']['empresas']['Update'];
export type ContactoUpdate = Database['public']['Tables']['contactos']['Update'];
export type DocumentoUpdate = Database['public']['Tables']['documentos']['Update'];

// Tipos extendidos para mayor type safety
export type SupabaseQuery<T> = {
  data: T | null;
  error: any | null;
};
export type TareaUpdate = Database['public']['Tables']['tareas']['Update'];
export type InteraccionUpdate = Database['public']['Tables']['interacciones']['Update'];
