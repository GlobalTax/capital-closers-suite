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
