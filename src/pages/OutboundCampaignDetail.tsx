import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Mail, 
  Import, 
  Loader2, 
  Download,
  Trash2,
  ExternalLink,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  useOutboundCampaign, 
  useProspectsPaginated,
  useSearchApolloProspects,
  useEnrichProspects,
  useImportProspectsToLeads,
  useImportAllProspects,
  useDeleteProspects,
} from '@/hooks/useOutboundCampaigns';
import { estimateApolloCredits } from '@/lib/apollo-sector-mapping';
import { DataTableEnhanced, Column } from '@/components/shared/DataTableEnhanced';
import type { OutboundProspect } from '@/types/outbound';

const PAGE_SIZE = 50;

const ENRICHMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-muted text-muted-foreground' },
  enriching: { label: 'Enriqueciendo...', color: 'bg-blue-100 text-blue-700' },
  enriched: { label: 'Enriquecido', color: 'bg-green-100 text-green-700' },
  failed: { label: 'Fallido', color: 'bg-red-100 text-red-700' },
  skipped: { label: 'Omitido', color: 'bg-gray-100 text-gray-500' },
};

const IMPORT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  not_imported: { label: '-', color: '' },
  imported: { label: 'Importado', color: 'bg-green-100 text-green-700' },
  duplicate: { label: 'Duplicado', color: 'bg-yellow-100 text-yellow-700' },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700' },
};

export default function OutboundCampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Pagination and filter state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const { data: campaign, isLoading: loadingCampaign } = useOutboundCampaign(id);
  const { data: prospectsData, isLoading: loadingProspects } = useProspectsPaginated(
    id,
    currentPage,
    PAGE_SIZE,
    debouncedSearch,
    statusFilter
  );
  
  const searchApollo = useSearchApolloProspects();
  const enrichProspects = useEnrichProspects();
  const importToLeads = useImportProspectsToLeads();
  const importAll = useImportAllProspects();
  const deleteProspects = useDeleteProspects();

  const prospects = prospectsData?.prospects || [];
  const someSelected = selectedIds.size > 0;

  // Selection helpers
  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  // Actions
  const handleSearch = async () => {
    if (!campaign?.apollo_keywords?.length) {
      toast.error('No hay keywords configurados para esta campaña');
      return;
    }

    try {
      await searchApollo.mutateAsync({
        campaignId: campaign.id,
        keywords: campaign.apollo_keywords,
        filters: campaign.filters,
      });
      toast.success('Búsqueda completada');
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleEnrich = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.error('Selecciona prospectos para enriquecer');
      return;
    }

    const pendingIds = ids.filter(id => {
      const p = prospects.find(pr => pr.id === id);
      return p?.enrichment_status === 'pending' || p?.enrichment_status === 'failed';
    });

    if (pendingIds.length === 0) {
      toast.error('Los prospectos seleccionados ya están enriquecidos');
      return;
    }

    const credits = estimateApolloCredits(pendingIds.length);
    if (!confirm(`Se consumirán aproximadamente ${credits} créditos de Apollo. ¿Continuar?`)) {
      return;
    }

    try {
      await enrichProspects.mutateAsync({ prospectIds: pendingIds });
      setSelectedIds(new Set());
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleImport = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.error('Selecciona prospectos para importar');
      return;
    }

    const enrichedIds = ids.filter(id => {
      const p = prospects.find(pr => pr.id === id);
      return p?.enrichment_status === 'enriched' && p?.import_status === 'not_imported';
    });

    if (enrichedIds.length === 0) {
      toast.error('Solo se pueden importar prospectos enriquecidos no importados');
      return;
    }

    try {
      await importToLeads.mutateAsync(enrichedIds);
      setSelectedIds(new Set());
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleImportAll = async () => {
    if (!campaign) return;
    
    const enrichedNotImported = campaign.total_enriched - campaign.total_imported;
    if (enrichedNotImported <= 0) {
      toast.info('No hay prospectos enriquecidos pendientes de importar');
      return;
    }

    if (!confirm(`¿Importar todos los prospectos enriquecidos (~${enrichedNotImported}) al CRM?`)) {
      return;
    }

    try {
      await importAll.mutateAsync(campaign.id);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    if (!confirm(`¿Eliminar ${ids.length} prospectos?`)) return;

    try {
      await deleteProspects.mutateAsync(ids);
      setSelectedIds(new Set());
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleExportCSV = () => {
    if (!prospects.length) return;

    const headers = ['Nombre', 'Apellidos', 'Cargo', 'Empresa', 'Industria', 'País', 'Score', 'Email', 'Teléfono', 'LinkedIn', 'Estado'];
    const rows = prospects.map(p => [
      p.nombre,
      p.apellidos || '',
      p.cargo || '',
      p.empresa || '',
      p.company_industry || '',
      p.company_location || '',
      p.score?.toString() || '',
      p.email || '',
      p.telefono || '',
      p.linkedin_url || '',
      p.enrichment_status,
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${campaign?.name || 'prospectos'}.csv`;
    a.click();
  };

  // Column definitions for DataTableEnhanced
  const columns: Column<OutboundProspect>[] = [
    {
      key: 'nombre',
      label: 'Nombre',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {row.nombre} {row.apellidos}
          </span>
          {row.linkedin_url && (
            <a 
              href={row.linkedin_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      ),
    },
    {
      key: 'cargo',
      label: 'Cargo',
      render: (val) => <span className="text-muted-foreground">{val || '-'}</span>,
    },
    {
      key: 'empresa',
      label: 'Empresa',
      render: (val, row) => (
        <div>
          {val || '-'}
          {row.company_size && (
            <span className="text-xs text-muted-foreground ml-1">
              ({row.company_size})
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'company_industry',
      label: 'Industria',
      render: (val) => <span className="text-muted-foreground text-sm">{val || '-'}</span>,
    },
    {
      key: 'company_location',
      label: 'País',
      render: (val) => <span className="text-muted-foreground text-sm">{val || '-'}</span>,
    },
    {
      key: 'score',
      label: 'Score',
      render: (val) => val ? (
        <Badge variant="outline" className="font-mono">{val}</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (val) => <span className="font-mono text-sm">{val || '-'}</span>,
    },
    {
      key: 'enrichment_status',
      label: 'Estado',
      render: (val) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          ENRICHMENT_STATUS_CONFIG[val]?.color || ''
        }`}>
          {ENRICHMENT_STATUS_CONFIG[val]?.label || val}
        </span>
      ),
    },
    {
      key: 'import_status',
      label: 'Import',
      render: (val) => val !== 'not_imported' ? (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          IMPORT_STATUS_CONFIG[val]?.color || ''
        }`}>
          {IMPORT_STATUS_CONFIG[val]?.label}
        </span>
      ) : null,
    },
  ];

  if (loadingCampaign) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Campaña no encontrada</p>
        <Button variant="link" onClick={() => navigate('/outbound')}>
          Volver a campañas
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/outbound')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          {campaign.description && (
            <p className="text-muted-foreground">{campaign.description}</p>
          )}
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={searchApollo.isPending}
        >
          {searchApollo.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          {campaign.total_found > 0 ? 'Actualizar búsqueda' : 'Buscar en Apollo'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sector</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{campaign.sector_name || 'Sin sector'}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Encontrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.total_found.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Enriquecidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.total_enriched.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Importados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.total_imported.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Créditos usados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.credits_used.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Prospects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Prospectos ({prospectsData?.total.toLocaleString() || 0})
            </CardTitle>
            <div className="flex items-center gap-2">
              {someSelected && (
                <>
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.size} seleccionados
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleEnrich}
                    disabled={enrichProspects.isPending}
                  >
                    {enrichProspects.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="mr-2 h-4 w-4" />
                    )}
                    Enriquecer
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleImport}
                    disabled={importToLeads.isPending}
                  >
                    {importToLeads.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Import className="mr-2 h-4 w-4" />
                    )}
                    Importar al CRM
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteProspects.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              {/* Import All Button */}
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleImportAll}
                disabled={importAll.isPending || campaign.total_enriched === 0}
                title="Importar todos los prospectos enriquecidos"
              >
                {importAll.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Users className="mr-2 h-4 w-4" />
                )}
                Importar todo
              </Button>

              <Button size="sm" variant="ghost" onClick={handleExportCSV}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Buscar por nombre, empresa, cargo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="enriched">Enriquecidos</SelectItem>
                <SelectItem value="failed">Fallidos</SelectItem>
                <SelectItem value="selected">Seleccionados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Empty state */}
          {!loadingProspects && prospects.length === 0 && prospectsData?.total === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No hay prospectos todavía</p>
              <p className="text-sm">Haz clic en "Buscar en Apollo" para descubrir contactos</p>
            </div>
          )}

          {/* Data Table with Server Pagination */}
          {(loadingProspects || prospects.length > 0) && (
            <DataTableEnhanced
              columns={columns}
              data={prospects}
              loading={loadingProspects}
              selectable
              selectedRows={Array.from(selectedIds)}
              onSelectionChange={handleSelectionChange}
              density="compact"
              pageSize={PAGE_SIZE}
              serverPagination={{
                currentPage,
                totalPages: prospectsData?.totalPages || 1,
                totalCount: prospectsData?.total || 0,
                onPageChange: setCurrentPage,
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
