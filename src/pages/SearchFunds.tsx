import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Target,
  Search,
  Globe,
  Building2,
  TrendingUp,
  Users,
  Filter,
  X,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from '@/components/shared/AnimatedCounter';
import {
  useSearchFundsWithStats,
  useSearchFundCountries,
  useSearchFundSectors,
  type SearchFundWithStats,
} from '@/hooks/useSearchFundsWithStats';
import { useSearchFundsRealtime } from '@/hooks/useSearchFundsRealtime';
import { useNavigate } from 'react-router-dom';

function formatCurrency(value: number | null): string {
  if (value === null) return '-';
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
  return `€${value.toLocaleString()}`;
}

function formatRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return '-';
  if (min === null) return `≤${formatCurrency(max)}`;
  if (max === null) return `≥${formatCurrency(min)}`;
  return `${formatCurrency(min)} - ${formatCurrency(max)}`;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'searching', label: 'Buscando' },
  { value: 'acquired', label: 'Adquirido' },
  { value: 'paused', label: 'Pausado' },
  { value: 'inactive', label: 'Inactivo' },
];

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  searching: { label: 'Buscando', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  acquired: { label: 'Adquirido', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  inactive: { label: 'Inactivo', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
  paused: { label: 'Pausado', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
};

export default function SearchFunds() {
  const navigate = useNavigate();
  
  // Activar sincronización en tiempo real
  useSearchFundsRealtime();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');

  // Build filters object
  const filters = useMemo(() => {
    const f: {
      search?: string;
      status?: string;
      country?: string;
      sector?: string;
    } = {};

    if (searchQuery) f.search = searchQuery;
    if (statusFilter !== 'all') f.status = statusFilter;
    if (countryFilter !== 'all') f.country = countryFilter;
    if (sectorFilter !== 'all') f.sector = sectorFilter;

    return Object.keys(f).length > 0 ? f : undefined;
  }, [searchQuery, statusFilter, countryFilter, sectorFilter]);

  const { data, isLoading } = useSearchFundsWithStats(filters);
  const { data: countries = [] } = useSearchFundCountries();
  const { data: sectors = [] } = useSearchFundSectors();

  const funds = data?.funds || [];
  const stats = data?.stats || { total: 0, active: 0, withDeals: 0, inNegotiation: 0 };

  const hasActiveFilters = statusFilter !== 'all' || countryFilter !== 'all' || sectorFilter !== 'all' || searchQuery;

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCountryFilter('all');
    setSectorFilter('all');
  };

  const handleRowClick = (fund: SearchFundWithStats) => {
    navigate(`/search-funds/${fund.id}`);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <PageHeader
          title="Search Funds"
          description="Gestiona la base de datos de Search Funds y sus criterios de inversión"
          icon={Target}
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Fondos</p>
                  <p className="text-2xl font-semibold">
                    <AnimatedCounter value={stats.total} />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Activos</p>
                  <p className="text-2xl font-semibold">
                    <AnimatedCounter value={stats.active} />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Building2 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Con Mandatos</p>
                  <p className="text-2xl font-semibold">
                    <AnimatedCounter value={stats.withDeals} />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Users className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">En Negociación</p>
                  <p className="text-2xl font-semibold">
                    <AnimatedCounter value={stats.inNegotiation} />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="País" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los países</SelectItem>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los sectores</SelectItem>
                  {sectors.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                  <X className="w-4 h-4" />
                  Limpiar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-medium">Nombre</TableHead>
                  <TableHead className="font-medium">Estado</TableHead>
                  <TableHead className="font-medium">Sectores</TableHead>
                  <TableHead className="font-medium">EBITDA</TableHead>
                  <TableHead className="font-medium">Deal Size</TableHead>
                  <TableHead className="font-medium">País</TableHead>
                  <TableHead className="font-medium text-center">Mandatos</TableHead>
                  <TableHead className="font-medium">Última Actividad</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-10 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                    </TableRow>
                  ))
                ) : funds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Target className="w-10 h-10 opacity-50" />
                        <p>No se encontraron Search Funds</p>
                        {hasActiveFilters && (
                          <Button variant="link" size="sm" onClick={clearFilters}>
                            Limpiar filtros
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  funds.map((fund) => {
                    const statusBadge = STATUS_BADGES[fund.status || 'inactive'] || STATUS_BADGES.inactive;

                    return (
                      <TableRow
                        key={fund.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleRowClick(fund)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{fund.name}</span>
                            {fund.website && (
                              <a
                                href={fund.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-muted-foreground hover:text-primary"
                              >
                                <Globe className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {fund.sector_focus?.slice(0, 2).map((sector, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {sector}
                              </Badge>
                            ))}
                            {fund.sector_focus && fund.sector_focus.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{fund.sector_focus.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatRange(fund.ebitda_min, fund.ebitda_max)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatRange(fund.deal_size_min, fund.deal_size_max)}
                        </TableCell>
                        <TableCell>
                          {fund.country_base || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {fund.mandato_count > 0 ? (
                            <Badge variant="outline" className="font-medium">
                              {fund.mandato_count}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {fund.last_activity
                            ? format(new Date(fund.last_activity), 'dd MMM yyyy', { locale: es })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
