// =============================================
// PRESENTATION ENGINE - TYPES
// =============================================

// Database enums
export type PresentationType = 
  | 'teaser_sell' 
  | 'teaser_ma_sell'
  | 'firm_deck' 
  | 'client_deck' 
  | 'mandate_deck' 
  | 'one_pager' 
  | 'custom';

export type SlideLayout = 
  | 'title'
  | 'hero'
  | 'overview'
  | 'bullets'
  | 'stats'
  | 'financials'
  | 'timeline'
  | 'team'
  | 'comparison'
  | 'market'
  | 'closing'
  | 'disclaimer'
  | 'custom';

export type PresentationStatus = 'draft' | 'review' | 'approved' | 'archived';

export type SharePermission = 'view' | 'download_pdf';

// Slide content structure
export interface SlideContent {
  headline?: string;
  subline?: string;
  bullets?: string[];
  stats?: Array<{
    value: string;
    label: string;
    prefix?: string;
    suffix?: string;
  }>;
  bodyText?: string;
  imageUrl?: string;
  logoUrl?: string;
  teamMembers?: Array<{
    name: string;
    role: string;
    imageUrl?: string;
  }>;
  columns?: Array<{
    title: string;
    items: string[];
  }>;
  footnote?: string;
  confidentialityText?: string;
  
  // NEW: Table content
  table?: {
    headers: string[];
    rows: string[][];
    highlightColumn?: number;
    showRowNumbers?: boolean;
    caption?: string;
  };
  
  // NEW: Chart content
  chart?: {
    type: 'bar' | 'line' | 'pie' | 'donut';
    data: Array<{ label: string; value: number; color?: string }>;
    title?: string;
    showLegend?: boolean;
  };
  
  // NEW: Icons grid content
  icons?: Array<{
    name: string; // Lucide icon name
    label: string;
    description?: string;
  }>;
  
  // NEW: Quote content
  quote?: {
    text: string;
    author?: string;
    role?: string;
    company?: string;
  };
  
  // NEW: Process/steps content
  process?: Array<{
    number: number;
    title: string;
    description?: string;
  }>;
  
  // NEW: Image with text
  image?: {
    url: string;
    alt?: string;
    position?: 'left' | 'right' | 'center' | 'background';
    size?: 'small' | 'medium' | 'large' | 'full';
  };
}

export type LayoutVariant = 'A' | 'B' | 'C';

// Brand Kit for consistent styling
export interface BrandKit {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  mutedTextColor: string;
  logoUrl?: string;
  logoDarkUrl?: string;
  fontHeading?: string;
  fontBody?: string;
  footerText?: string;
  disclaimerText?: string;
}

// Database row types
export interface PresentationProject {
  id: string;
  title: string;
  description: string | null;
  type: PresentationType;
  brand_kit_id: string | null;
  theme: string | null;
  status: string;
  is_confidential: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  empresa_id: string | null;
  client_name: string | null;
  project_code: string | null;
}

export interface PresentationSlide {
  id: string;
  project_id: string;
  order_index: number;
  layout: SlideLayout;
  headline: string | null;
  subline: string | null;
  content: SlideContent;
  background_color: string | null;
  background_image_url: string | null;
  text_color: string | null;
  is_hidden: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  approval_status: string | null;
  approved_at: string | null;
  approved_by: string | null;
  is_locked: boolean;
}

export interface PresentationVersion {
  id: string;
  project_id: string;
  version_number: number;
  snapshot: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export interface PresentationTemplate {
  id: string;
  name: string;
  type: PresentationType;
  description: string | null;
  thumbnail_url: string | null;
  slides_config: SlideTemplateConfig[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SlideTemplateConfig {
  layout: SlideLayout;
  defaultHeadline?: string;
  defaultSubline?: string;
  defaultContent?: Partial<SlideContent>;
}

export interface PresentationSharingLink {
  id: string;
  project_id: string;
  token: string;
  permission: SharePermission;
  password_hash: string | null;
  expires_at: string | null;
  max_views: number | null;
  view_count: number;
  is_active: boolean;
  recipient_email: string | null;
  recipient_name: string | null;
  created_at: string;
  created_by: string | null;
  last_accessed_at: string | null;
}

export interface PresentationAsset {
  id: string;
  project_id: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
  storage_path: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface PresentationComment {
  id: string;
  slide_id: string;
  content: string;
  x_position: number | null;
  y_position: number | null;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Insert types
export type PresentationProjectInsert = Omit<PresentationProject, 'id' | 'created_at' | 'updated_at'>;
export type PresentationSlideInsert = Omit<PresentationSlide, 'id' | 'created_at' | 'updated_at'>;

// Update types
export type PresentationProjectUpdate = Partial<Omit<PresentationProject, 'id' | 'created_at'>>;
export type PresentationSlideUpdate = Partial<Omit<PresentationSlide, 'id' | 'created_at'>>;

// With relations
export interface PresentationProjectWithSlides extends PresentationProject {
  slides: PresentationSlide[];
}

// Template definitions
export const TEMPLATE_DEFINITIONS: Record<PresentationType, { name: string; description: string; slideCount: number }> = {
  teaser_sell: {
    name: 'Teaser de Venta',
    description: 'Presentación confidencial para potenciales compradores',
    slideCount: 8,
  },
  teaser_ma_sell: {
    name: 'Teaser M&A Sell-Side',
    description: 'Teaser confidencial para inversores (8 slides, tono sobrio)',
    slideCount: 8,
  },
  firm_deck: {
    name: 'Presentación de Firma',
    description: 'Credenciales y servicios de la firma',
    slideCount: 6,
  },
  client_deck: {
    name: 'Propuesta Cliente',
    description: 'Propuesta de servicios para cliente',
    slideCount: 6,
  },
  mandate_deck: {
    name: 'Mandato Buy-Side',
    description: 'Presentación para mandatos de compra',
    slideCount: 7,
  },
  one_pager: {
    name: 'One Pager',
    description: 'Resumen ejecutivo de una página',
    slideCount: 3,
  },
  custom: {
    name: 'Personalizada',
    description: 'Presentación desde cero',
    slideCount: 1,
  },
};

// Allowed slide types per template (for AI outline generation)
export const TEMPLATE_ALLOWED_TYPES: Record<PresentationType, SlideLayout[]> = {
  teaser_sell: ["title", "overview", "bullets", "financials", "stats", "market", "closing"],
  teaser_ma_sell: ["disclaimer", "bullets", "overview", "market", "financials", "closing"],
  firm_deck: ["title", "overview", "bullets", "stats", "closing"],
  client_deck: ["overview", "bullets", "timeline", "team", "closing"],
  mandate_deck: ["title", "overview", "bullets", "comparison", "stats", "market", "closing"],
  one_pager: ["title", "overview", "closing"],
  custom: ["title", "hero", "overview", "bullets", "stats", "financials", "timeline", "team", "comparison", "market", "closing", "disclaimer", "custom"],
};

// AI Outline types
export interface SlideOutlineItem {
  slide_index: number;
  slide_type: string;
  layout: "A" | "B" | "C";
  purpose: string;
}

// Layout definitions with display info
export const LAYOUT_DEFINITIONS: Record<SlideLayout, { name: string; icon: string }> = {
  title: { name: 'Portada', icon: 'FileText' },
  hero: { name: 'Hero', icon: 'Image' },
  overview: { name: 'Visión General', icon: 'Layout' },
  bullets: { name: 'Puntos', icon: 'List' },
  stats: { name: 'Estadísticas', icon: 'BarChart3' },
  financials: { name: 'Financieros', icon: 'TrendingUp' },
  timeline: { name: 'Timeline', icon: 'Clock' },
  team: { name: 'Equipo', icon: 'Users' },
  comparison: { name: 'Comparativa', icon: 'Columns' },
  market: { name: 'Mercado', icon: 'Globe' },
  closing: { name: 'Cierre', icon: 'CheckCircle' },
  disclaimer: { name: 'Disclaimer', icon: 'AlertCircle' },
  custom: { name: 'Personalizado', icon: 'Palette' },
};
