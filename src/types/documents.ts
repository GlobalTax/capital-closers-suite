// ============================================
// GESTIÓN DOCUMENTAL AVANZADA - TIPOS
// ============================================

export type FolderType = 
  | 'informacion_general' 
  | 'due_diligence' 
  | 'negociacion' 
  | 'cierre' 
  | 'data_room' 
  | 'teaser'
  | 'custom';

export type TemplateCategory = 
  | 'NDA' 
  | 'LOI' 
  | 'Teaser' 
  | 'SPA' 
  | 'DD_Checklist' 
  | 'Contrato' 
  | 'Otro';

export interface DocumentFolder {
  id: string;
  mandato_id: string;
  parent_id?: string;
  name: string;
  folder_type?: FolderType;
  fase_asociada?: string;
  orden: number;
  is_data_room: boolean;
  icon?: string;
  created_at: string;
  updated_at: string;
  // Computed
  children?: DocumentFolder[];
  document_count?: number;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  tipo_operacion?: 'compra' | 'venta' | 'ambos';
  fase_aplicable?: string;
  template_url?: string;
  file_name?: string;
  file_size_bytes?: number;
  mime_type?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type IdiomaTeaser = 'ES' | 'EN';

export type TeaserStatus = 'draft' | 'approved' | 'published';

export const TEASER_STATUS_LABELS: Record<TeaserStatus, string> = {
  draft: 'Borrador',
  approved: 'Aprobado',
  published: 'Publicado',
};

export const TEASER_STATUS_COLORS: Record<TeaserStatus, { bg: string; text: string; border: string }> = {
  draft: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted' },
  approved: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  published: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
};

export interface DocumentWithVersion {
  id: string;
  mandato_id?: string;
  folder_id?: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  storage_path: string;
  tipo: string;
  descripcion?: string;
  version: number;
  parent_document_id?: string;
  is_latest_version: boolean;
  uploaded_by?: string;
  idioma?: IdiomaTeaser | null;
  created_at: string;
  updated_at: string;
  // Workflow fields
  status?: TeaserStatus;
  approved_by?: string;
  approved_at?: string;
  published_at?: string;
  // Joined
  folder_name?: string;
  folder_type?: FolderType;
  is_data_room?: boolean;
  total_versions?: number;
  latest_version?: number;
}

export interface FolderTreeNode extends DocumentFolder {
  children: FolderTreeNode[];
  documents: DocumentWithVersion[];
  isExpanded?: boolean;
}

// Helper para construir árbol de carpetas
export function buildFolderTree(
  folders: DocumentFolder[], 
  documents: DocumentWithVersion[]
): FolderTreeNode[] {
  const folderMap = new Map<string, FolderTreeNode>();
  const rootFolders: FolderTreeNode[] = [];

  // Crear nodos
  folders.forEach(folder => {
    folderMap.set(folder.id, {
      ...folder,
      children: [],
      documents: documents.filter(d => d.folder_id === folder.id),
      isExpanded: true,
    });
  });

  // Construir jerarquía
  folders.forEach(folder => {
    const node = folderMap.get(folder.id)!;
    if (folder.parent_id) {
      const parent = folderMap.get(folder.parent_id);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      rootFolders.push(node);
    }
  });

  // Ordenar
  const sortByOrden = (a: FolderTreeNode, b: FolderTreeNode) => a.orden - b.orden;
  rootFolders.sort(sortByOrden);
  rootFolders.forEach(folder => folder.children.sort(sortByOrden));

  return rootFolders;
}
