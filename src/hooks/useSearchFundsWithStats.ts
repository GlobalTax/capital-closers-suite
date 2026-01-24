import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SearchFund } from '@/types/searchFunds';

export interface PrimaryContact {
  full_name: string;
  role: string | null;
  email: string | null;
}

export interface SearchFundWithStats extends SearchFund {
  mandato_count: number;
  last_activity: string | null;
  primary_contact: PrimaryContact | null;
}

export interface SearchFundsStats {
  total: number;
  active: number;
  withDeals: number;
  inNegotiation: number;
}

async function fetchSearchFundsWithStats(filters?: {
  search?: string;
  status?: string;
  country?: string;
  sector?: string;
}): Promise<{ funds: SearchFundWithStats[]; stats: SearchFundsStats }> {
  // Fetch all funds
  let fundsQuery = supabase
    .from('sf_funds')
    .select('*')
    .order('name');

  if (filters?.status) {
    fundsQuery = fundsQuery.eq('status', filters.status);
  }

  if (filters?.search) {
    fundsQuery = fundsQuery.ilike('name', `%${filters.search}%`);
  }

  if (filters?.country) {
    fundsQuery = fundsQuery.eq('country_base', filters.country);
  }

  const { data: fundsData, error: fundsError } = await fundsQuery;

  if (fundsError) {
    console.error('[SearchFundsWithStats] Error fetching funds:', fundsError);
    throw fundsError;
  }

  let funds = (fundsData || []) as unknown as SearchFund[];

  // Filter by sector in client (sector_focus is an array)
  if (filters?.sector) {
    const sectorLower = filters.sector.toLowerCase();
    funds = funds.filter(sf => 
      sf.sector_focus?.some(s => s.toLowerCase().includes(sectorLower))
    );
  }

  // Fetch all matches to calculate stats
  const { data: matchesData, error: matchesError } = await supabase
    .from('sf_matches')
    .select('fund_id, status, last_interaction_at, created_at')
    .eq('crm_entity_type', 'mandato');

  if (matchesError) {
    console.error('[SearchFundsWithStats] Error fetching matches:', matchesError);
    throw matchesError;
  }

  // Fetch primary contacts for all funds
  const { data: contactsData, error: contactsError } = await supabase
    .from('sf_people')
    .select('fund_id, full_name, role, email')
    .eq('is_primary_contact', true);

  if (contactsError) {
    console.error('[SearchFundsWithStats] Error fetching contacts:', contactsError);
    // Non-fatal, continue without contacts
  }

  // Create map of primary contacts by fund_id
  const contactsByFund = new Map<string, PrimaryContact>();
  if (contactsData) {
    for (const contact of contactsData) {
      if (contact.fund_id) {
        contactsByFund.set(contact.fund_id, {
          full_name: contact.full_name,
          role: contact.role,
          email: contact.email,
        });
      }
    }
  }

  const matches = matchesData || [];

  // Group matches by fund_id
  const matchesByFund = new Map<string, { count: number; lastActivity: string | null; inNegotiation: boolean }>();
  
  for (const match of matches) {
    const existing = matchesByFund.get(match.fund_id);
    const activityDate = match.last_interaction_at || match.created_at;
    
    if (existing) {
      existing.count += 1;
      if (activityDate && (!existing.lastActivity || activityDate > existing.lastActivity)) {
        existing.lastActivity = activityDate;
      }
      if (match.status === 'en_negociacion') {
        existing.inNegotiation = true;
      }
    } else {
      matchesByFund.set(match.fund_id, {
        count: 1,
        lastActivity: activityDate,
        inNegotiation: match.status === 'en_negociacion',
      });
    }
  }

  // Combine funds with stats and contacts
  const fundsWithStats: SearchFundWithStats[] = funds.map(fund => {
    const matchData = matchesByFund.get(fund.id);
    return {
      ...fund,
      mandato_count: matchData?.count || 0,
      last_activity: matchData?.lastActivity || null,
      primary_contact: contactsByFund.get(fund.id) || null,
    };
  });

  // Calculate aggregate stats
  const stats: SearchFundsStats = {
    total: funds.length,
    active: funds.filter(f => f.status === 'searching').length,
    withDeals: fundsWithStats.filter(f => f.mandato_count > 0).length,
    inNegotiation: [...matchesByFund.values()].filter(m => m.inNegotiation).length,
  };

  return { funds: fundsWithStats, stats };
}

export function useSearchFundsWithStats(filters?: {
  search?: string;
  status?: string;
  country?: string;
  sector?: string;
}) {
  return useQuery({
    queryKey: ['search-funds-with-stats', filters],
    queryFn: () => fetchSearchFundsWithStats(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Get unique countries from funds
export function useSearchFundCountries() {
  return useQuery({
    queryKey: ['search-fund-countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sf_funds')
        .select('country_base')
        .not('country_base', 'is', null);

      if (error) throw error;

      const countries = [...new Set((data || []).map(d => d.country_base).filter(Boolean))];
      return countries.sort() as string[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

// Get unique sectors from funds
export function useSearchFundSectors() {
  return useQuery({
    queryKey: ['search-fund-sectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sf_funds')
        .select('sector_focus');

      if (error) throw error;

      const allSectors = (data || [])
        .flatMap(d => d.sector_focus || [])
        .filter(Boolean);
      
      const uniqueSectors = [...new Set(allSectors)];
      return uniqueSectors.sort() as string[];
    },
    staleTime: 10 * 60 * 1000,
  });
}
