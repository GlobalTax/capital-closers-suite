import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { HelpSection, HelpSearchResult } from '@/types/help';

export function useHelpCenter() {
  const sectionsQuery = useQuery({
    queryKey: ['help-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('help_sections')
        .select('*')
        .eq('is_published', true)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data as HelpSection[];
    },
    staleTime: 1000 * 60 * 10, // Cache 10 minutes
  });

  // Build hierarchical structure
  const hierarchicalSections = useMemo(() => {
    if (!sectionsQuery.data) return [];
    const sections = sectionsQuery.data;
    const rootSections = sections.filter(s => !s.parent_id);
    return rootSections.map(section => ({
      ...section,
      children: sections.filter(s => s.parent_id === section.id)
    }));
  }, [sectionsQuery.data]);

  return {
    sections: hierarchicalSections,
    flatSections: sectionsQuery.data || [],
    isLoading: sectionsQuery.isLoading,
    error: sectionsQuery.error,
  };
}

export function useHelpSection(slug: string) {
  return useQuery({
    queryKey: ['help-section', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('help_sections')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();
      
      if (error) throw error;
      return data as HelpSection;
    },
    enabled: !!slug,
  });
}

function extractHighlight(content: string, query: string): string {
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerContent.indexOf(lowerQuery);
  
  if (index === -1) return content.slice(0, 100) + '...';
  
  const start = Math.max(0, index - 40);
  const end = Math.min(content.length, index + query.length + 40);
  let highlight = content.slice(start, end);
  
  if (start > 0) highlight = '...' + highlight;
  if (end < content.length) highlight = highlight + '...';
  
  return highlight;
}

export function useHelpSearch(query: string) {
  const { flatSections } = useHelpCenter();
  
  // Client-side search for simplicity
  const results = useMemo(() => {
    if (!query || query.length < 2 || !flatSections.length) return [];
    
    const lowerQuery = query.toLowerCase();
    
    return flatSections
      .filter(section => 
        section.title.toLowerCase().includes(lowerQuery) ||
        section.content_md.toLowerCase().includes(lowerQuery) ||
        section.description?.toLowerCase().includes(lowerQuery)
      )
      .map(section => ({
        id: section.id,
        title: section.title,
        slug: section.slug,
        description: section.description,
        highlight: extractHighlight(section.content_md, query),
      })) as HelpSearchResult[];
  }, [query, flatSections]);
  
  return {
    results,
    isSearching: query.length >= 2,
  };
}
