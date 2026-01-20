// Layout variant types and shared interfaces

export type LayoutVariant = 'A' | 'B' | 'C';

export interface LayoutProps {
  content: SlideContentData;
  scheme: ColorScheme;
  variant?: LayoutVariant;
}

export interface SlideContentData {
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
  
  // Visual content types
  table?: {
    headers: string[];
    rows: string[][];
    highlightColumn?: number;
    showRowNumbers?: boolean;
    caption?: string;
  };
  chart?: {
    type: 'bar' | 'line' | 'pie' | 'donut';
    data: Array<{ label: string; value: number; color?: string }>;
    title?: string;
    showLegend?: boolean;
  };
  icons?: Array<{
    name: string;
    label: string;
    description?: string;
  }>;
  quote?: {
    text: string;
    author?: string;
    role?: string;
    company?: string;
  };
  process?: Array<{
    number: number;
    title: string;
    description?: string;
  }>;
}

export interface ColorScheme {
  background: string;
  accent: string;
  text: string;
  muted: string;
  card: string;
  border: string;
}

// Icon mapping for stats
export const STAT_ICON_KEYWORDS: Record<string, string> = {
  'revenue': 'TrendingUp',
  'ingresos': 'TrendingUp',
  'ventas': 'TrendingUp',
  'sales': 'TrendingUp',
  'growth': 'ArrowUpRight',
  'crecimiento': 'ArrowUpRight',
  'ebitda': 'DollarSign',
  'margin': 'Percent',
  'margen': 'Percent',
  'employees': 'Users',
  'empleados': 'Users',
  'team': 'Users',
  'equipo': 'Users',
  'clients': 'Building2',
  'clientes': 'Building2',
  'customers': 'Building2',
  'retention': 'RefreshCw',
  'retención': 'RefreshCw',
  'market': 'Globe',
  'mercado': 'Globe',
  'share': 'PieChart',
  'cuota': 'PieChart',
  'roi': 'TrendingUp',
  'multiple': 'Calculator',
  'múltiplo': 'Calculator',
  'years': 'Calendar',
  'años': 'Calendar',
  'countries': 'MapPin',
  'países': 'MapPin',
  'locations': 'MapPin',
  'ubicaciones': 'MapPin',
};

// Default content examples by layout type
export const DEFAULT_CONTENT: Record<string, Partial<SlideContentData>> = {
  stats: {
    stats: [
      { value: '€45M', label: 'Revenue FY24', prefix: '', suffix: '' },
      { value: '+32%', label: 'YoY Growth' },
      { value: '8.5x', label: 'EBITDA Multiple' },
      { value: '€5.2M', label: 'EBITDA FY24' },
    ],
  },
  bullets: {
    bullets: [
      'Market leader in specialized segment with 35% share',
      'Recurring revenue model with 92% retention rate',
      'Experienced management team with 15+ years track record',
      'Clear path to €50M revenue by 2026',
    ],
  },
  team: {
    teamMembers: [
      { name: 'Carlos García', role: 'CEO & Founder' },
      { name: 'María López', role: 'CFO' },
      { name: 'Juan Martín', role: 'COO' },
      { name: 'Ana Ruiz', role: 'CTO' },
    ],
  },
  comparison: {
    columns: [
      { title: 'Company', items: ['€45M Revenue', '24% EBITDA', '180 Employees'] },
      { title: 'Competitor A', items: ['€38M Revenue', '18% EBITDA', '220 Employees'] },
    ],
  },
  financials: {
    stats: [
      { value: '€45M', label: 'Revenue' },
      { value: '€10.8M', label: 'Gross Profit' },
      { value: '€5.2M', label: 'EBITDA' },
      { value: '24%', label: 'EBITDA Margin' },
    ],
  },
  overview: {
    bodyText: 'Company overview text describing the business model, market position, and key value drivers. This section provides context for potential investors or acquirers.',
    bullets: [
      'Founded in 2010 with proven track record',
      'B2B SaaS platform with strong unit economics',
      'Expanding into adjacent markets',
    ],
  },
  timeline: {
    bullets: [
      '2010: Company founded',
      '2015: First institutional investment',
      '2020: €20M revenue milestone',
      '2024: Strategic review initiated',
    ],
  },
};
