// Types for Help Center / Manual

export interface HelpSection {
  id: string;
  title: string;
  slug: string;
  content_md: string;
  description: string | null;
  icon: string | null;
  order_index: number;
  parent_id: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  children?: HelpSection[];
}

export interface HelpSearchResult {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  highlight: string;
}

export interface HelpSectionVersion {
  id: string;
  section_id: string;
  version_number: number;
  title: string;
  content_md: string;
  description: string | null;
  changed_by: string | null;
  change_summary: string | null;
  created_at: string;
}

export interface HelpSectionInput {
  title: string;
  slug: string;
  content_md: string;
  description?: string | null;
  icon?: string | null;
  order_index?: number;
  parent_id?: string | null;
  is_published?: boolean;
}
