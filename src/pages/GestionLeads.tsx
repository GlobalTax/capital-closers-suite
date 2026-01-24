import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { updateLeadStatus } from "@/services/dashboardTV";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, SlidersHorizontal, X, TrendingUp, Users, Calculator, Building2, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { LeadDetailSheet, LeadDetailData } from "@/components/leads/LeadDetailSheet";
import { InlineEditSelect } from "@/components/shared/InlineEdit";
import { LeadContactCell } from "@/components/leads/LeadContactCell";
import { LeadCanalCell } from "@/components/leads/LeadCanalCell";
import { LeadFinanceCell } from "@/components/leads/LeadFinanceCell";
import { ApolloStatusBadge } from "@/components/leads/ApolloStatusBadge";
import { LeadQuickFilters, QuickFilterKey, applyQuickFilters } from "@/components/leads/LeadQuickFilters";
import { LeadActionsMenu } from "@/components/leads/LeadActionsMenu";
import { BulkActionsBar, commonBulkActions } from "@/components/shared/BulkActionsBar";
import { Phone } from "lucide-react";
import { LeadActivityCell } from "@/components/leads/LeadActivityCell";
import { QuickTimeEntryModal } from "@/components/leads/QuickTimeEntryModal";
import { LeadConversionModal } from "@/components/leads/LeadConversionModal";
import { LeadQuickTimeButtons } from "@/components/leads/LeadQuickTimeButtons";

type LeadRow = {
  id: string;
  tipo: 'contact' | 'valuation' | 'collaborator';
  nombre: string;
  email: string;
  phone?: string;
  empresa?: string;
  sector?: string;
  status: string;
  fecha: string;
  dias: number;
  valoracion?: number;
  facturacion?: number;
  ebitda?: number;
  canal?: string;
  leadForm?: string;
  apolloStatus?: string;
  isPro?: boolean;
  acquisition_channel_id?: string;
  totalHours?: number;
  lastActivityDate?: string | null;
};

const formatCurrency = (value: number | undefined): string => {
  if (value === undefined || value === null) return '-';
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M€`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K€`;
  }
  return `${value.toFixed(0)}€`;
};

const STATUS_OPTIONS = [
  { value: "new", label: "Nuevo" },
  { value: "contacted", label: "En Contacto" },
  { value: "qualified", label: "Calificado" },
  { value: "converted", label: "Convertido" },
];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-gray-100 text-gray-800",
  contacted: "bg-blue-100 text-blue-800",
  qualified: "bg-amber-100 text-amber-800",
  converted: "bg-green-100 text-green-800",
};

export default function GestionLeads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quickFilters, setQuickFilters] = useState<QuickFilterKey[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [valoracionMin, setValoracionMin] = useState<string>("");
  const [valoracionMax, setValoracionMax] = useState<string>("");
  const [facturacionMin, setFacturacionMin] = useState<string>("");
  const [facturacionMax, setFacturacionMax] = useState<string>("");
  const [ebitdaMin, setEbitdaMin] = useState<string>("");
  const [ebitdaMax, setEbitdaMax] = useState<string>("");
  
  const [selectedLead, setSelectedLead] = useState<LeadDetailData | null>(null);
  
  // Estados para modales de actividad y conversión
  const [timeEntryLead, setTimeEntryLead] = useState<LeadRow | null>(null);
  const [timeEntryType, setTimeEntryType] = useState<'llamada' | 'videollamada' | 'reunion'>('llamada');
  const [conversionLead, setConversionLead] = useState<LeadRow | null>(null);
  
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ['gestion-leads', filterType, filterStatus],
    queryFn: async (): Promise<LeadRow[]> => {
      const allLeads: LeadRow[] = [];

      if (filterType === 'all' || filterType === 'contact') {
        const { data: contacts } = await supabase
          .from('contact_leads')
          .select(`
            *,
            acquisition_channels (id, name),
            lead_forms (name)
          `)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (contacts) {
          allLeads.push(...contacts.map(c => ({
            id: c.id,
            tipo: 'contact' as const,
            nombre: c.full_name,
            email: c.email,
            phone: c.phone || undefined,
            empresa: c.company || undefined,
            sector: (c as any).industry || undefined,
            status: c.status,
            fecha: c.created_at,
            dias: Math.floor((Date.now() - new Date(c.status_updated_at || c.created_at).getTime()) / (1000 * 60 * 60 * 24)),
            canal: c.acquisition_channels?.name || undefined,
            leadForm: c.lead_forms?.name || undefined,
            apolloStatus: c.apollo_status || undefined,
            isPro: (c as any).is_pro || false,
            acquisition_channel_id: c.acquisition_channel_id || undefined,
          })));
        }
      }

      if (filterType === 'all' || filterType === 'valuation') {
        const { data: valuations } = await supabase
          .from('company_valuations')
          .select(`
            *,
            acquisition_channels (id, name),
            lead_forms (name)
          `)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (valuations) {
          allLeads.push(...valuations.map(v => ({
            id: v.id,
            tipo: 'valuation' as const,
            nombre: v.contact_name,
            email: v.email,
            phone: v.phone || undefined,
            empresa: v.company_name,
            sector: v.industry || undefined,
            status: v.valuation_status || 'new',
            fecha: v.created_at,
            dias: Math.floor((Date.now() - new Date(v.last_activity_at || v.created_at).getTime()) / (1000 * 60 * 60 * 24)),
            valoracion: v.final_valuation ? Number(v.final_valuation) : undefined,
            facturacion: v.revenue ? Number(v.revenue) : undefined,
            ebitda: v.ebitda ? Number(v.ebitda) : undefined,
            canal: v.acquisition_channels?.name || undefined,
            leadForm: v.lead_forms?.name || undefined,
            apolloStatus: v.apollo_status || undefined,
            isPro: false,
            acquisition_channel_id: v.acquisition_channel_id || undefined,
          })));
        }
      }

      if (filterType === 'all' || filterType === 'collaborator') {
        const { data: collaborators } = await supabase
          .from('collaborator_applications')
          .select(`
            *,
            acquisition_channels (id, name)
          `)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (collaborators) {
          allLeads.push(...collaborators.map(c => ({
            id: c.id,
            tipo: 'collaborator' as const,
            nombre: c.full_name,
            email: c.email,
            phone: c.phone || undefined,
            empresa: c.company || undefined,
            status: c.status,
            fecha: c.created_at,
            dias: Math.floor((Date.now() - new Date(c.status_updated_at || c.created_at).getTime()) / (1000 * 60 * 60 * 24)),
            canal: c.acquisition_channels?.name || undefined,
            acquisition_channel_id: c.acquisition_channel_id || undefined,
          })));
        }
      }

      if (filterStatus !== 'all') {
        return allLeads.filter(l => l.status === filterStatus);
      }

      return allLeads;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, leadType, newStatus }: { 
      leadId: string; 
      leadType: 'contact' | 'valuation' | 'collaborator'; 
      newStatus: string 
    }) => {
      await updateLeadStatus(leadId, leadType, newStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestion-leads'] });
      queryClient.invalidateQueries({ queryKey: ['tv-dashboard'] });
      toast.success('Estado actualizado correctamente');
    },
    onError: (error) => {
      toast.error('Error al actualizar el estado');
      console.error(error);
    }
  });

  const toggleQuickFilter = (key: QuickFilterKey) => {
    setQuickFilters(prev => 
      prev.includes(key) 
        ? prev.filter(f => f !== key)
        : [...prev, key]
    );
  };

  const activeNumericFilters = useMemo(() => {
    let count = 0;
    if (valoracionMin || valoracionMax) count++;
    if (facturacionMin || facturacionMax) count++;
    if (ebitdaMin || ebitdaMax) count++;
    return count;
  }, [valoracionMin, valoracionMax, facturacionMin, facturacionMax, ebitdaMin, ebitdaMax]);

  const hasActiveFilters = searchTerm || activeNumericFilters > 0 || quickFilters.length > 0;

  const clearAllFilters = () => {
    setSearchTerm("");
    setValoracionMin("");
    setValoracionMax("");
    setFacturacionMin("");
    setFacturacionMax("");
    setEbitdaMin("");
    setEbitdaMax("");
    setQuickFilters([]);
  };

  const filteredLeads = useMemo(() => {
    let result = leads.filter(lead => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        lead.nombre.toLowerCase().includes(searchLower) ||
        lead.email.toLowerCase().includes(searchLower) ||
        (lead.empresa?.toLowerCase().includes(searchLower)) ||
        (lead.sector?.toLowerCase().includes(searchLower));

      const valMinNum = valoracionMin ? Number(valoracionMin) : null;
      const valMaxNum = valoracionMax ? Number(valoracionMax) : null;
      const facMinNum = facturacionMin ? Number(facturacionMin) : null;
      const facMaxNum = facturacionMax ? Number(facturacionMax) : null;
      const ebitMinNum = ebitdaMin ? Number(ebitdaMin) : null;
      const ebitMaxNum = ebitdaMax ? Number(ebitdaMax) : null;

      const hasNumericFilters = valMinNum || valMaxNum || facMinNum || facMaxNum || ebitMinNum || ebitMaxNum;
      
      if (hasNumericFilters && lead.tipo !== 'valuation') {
        return false;
      }

      const matchesValoracion = 
        (!valMinNum || (lead.valoracion !== undefined && lead.valoracion >= valMinNum)) &&
        (!valMaxNum || (lead.valoracion !== undefined && lead.valoracion <= valMaxNum));

      const matchesFacturacion = 
        (!facMinNum || (lead.facturacion !== undefined && lead.facturacion >= facMinNum)) &&
        (!facMaxNum || (lead.facturacion !== undefined && lead.facturacion <= facMaxNum));

      const matchesEbitda = 
        (!ebitMinNum || (lead.ebitda !== undefined && lead.ebitda >= ebitMinNum)) &&
        (!ebitMaxNum || (lead.ebitda !== undefined && lead.ebitda <= ebitMaxNum));

      return matchesSearch && matchesValoracion && matchesFacturacion && matchesEbitda;
    });

    // Apply quick filters
    result = applyQuickFilters(result, quickFilters);

    return result;
  }, [leads, searchTerm, valoracionMin, valoracionMax, facturacionMin, facturacionMax, ebitdaMin, ebitdaMax, quickFilters]);

  const stats = useMemo(() => {
    const total = leads.length;
    const contacts = leads.filter(l => l.tipo === 'contact').length;
    const valuations = leads.filter(l => l.tipo === 'valuation').length;
    const collaborators = leads.filter(l => l.tipo === 'collaborator').length;
    const totalValoracion = leads
      .filter(l => l.valoracion)
      .reduce((sum, l) => sum + (l.valoracion || 0), 0);
    return { total, contacts, valuations, collaborators, totalValoracion };
  }, [leads]);

  const tipoBadgeColors = {
    contact: 'bg-blue-500',
    valuation: 'bg-purple-500',
    collaborator: 'bg-green-500'
  };

  const tipoLabels = {
    contact: 'Comercial',
    valuation: 'Valoración',
    collaborator: 'Colaborador'
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredLeads.map(l => `${l.tipo}-${l.id}`)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (leadKey: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(leadKey);
      } else {
        next.delete(leadKey);
      }
      return next;
    });
  };

  const handleBulkMarkContacted = async () => {
    const leadsToUpdate = filteredLeads.filter(l => selectedIds.has(`${l.tipo}-${l.id}`));
    for (const lead of leadsToUpdate) {
      await updateStatusMutation.mutateAsync({
        leadId: lead.id,
        leadType: lead.tipo,
        newStatus: 'contacted'
      });
    }
    setSelectedIds(new Set());
  };

  const handleExport = () => {
    const leadsToExport = filteredLeads.filter(l => selectedIds.has(`${l.tipo}-${l.id}`));
    const csv = [
      ['Tipo', 'Nombre', 'Email', 'Empresa', 'Sector', 'Estado', 'Canal', 'Valoración', 'Facturación', 'EBITDA', 'Fecha'].join(','),
      ...leadsToExport.map(l => [
        tipoLabels[l.tipo],
        l.nombre,
        l.email,
        l.empresa || '',
        l.sector || '',
        l.status,
        l.canal || '',
        l.valoracion || '',
        l.facturacion || '',
        l.ebitda || '',
        format(new Date(l.fecha), 'dd/MM/yyyy')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success(`${leadsToExport.length} leads exportados`);
  };

  const allSelected = filteredLeads.length > 0 && filteredLeads.every(l => selectedIds.has(`${l.tipo}-${l.id}`));
  const someSelected = selectedIds.size > 0 && !allSelected;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Gestión de Leads"
        description="Gestiona el funnel comercial de leads"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-3 pb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase">Total</span>
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground uppercase">Contactos</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.contacts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-muted-foreground uppercase">Valoraciones</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{stats.valuations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground uppercase">Colaboradores</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.collaborators}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground uppercase">Valoración Total</span>
            </div>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(stats.totalValoracion)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda y filtros */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[280px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nombre, email, empresa o sector..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="contact">Contactos</SelectItem>
              <SelectItem value="valuation">Valoraciones</SelectItem>
              <SelectItem value="collaborator">Colaboradores</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo estado</SelectItem>
              <SelectItem value="new">Nuevo</SelectItem>
              <SelectItem value="contacted">Contactado</SelectItem>
              <SelectItem value="qualified">Calificado</SelectItem>
              <SelectItem value="converted">Convertido</SelectItem>
            </SelectContent>
          </Select>

          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="default" className="gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Avanzados
                {activeNumericFilters > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-primary text-primary-foreground text-xs">
                    {activeNumericFilters}
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>

          <Button variant="outline" size="icon" onClick={() => refetch()} title="Actualizar">
            <RefreshCw className="w-4 h-4" />
          </Button>

          <Button variant="outline" size="icon" onClick={handleExport} title="Exportar todos">
            <Download className="w-4 h-4" />
          </Button>

          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              className="text-muted-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Limpiar
            </Button>
          )}
        </div>

        {/* Quick filters */}
        <LeadQuickFilters
          activeFilters={quickFilters}
          onToggleFilter={toggleQuickFilter}
        />
      </div>

      {/* Panel de filtros avanzados expandible */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border rounded-lg bg-muted/30">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                Valoración (€)
              </Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  placeholder="Mín" 
                  value={valoracionMin}
                  onChange={(e) => setValoracionMin(e.target.value)}
                  className="flex-1"
                />
                <span className="text-muted-foreground">-</span>
                <Input 
                  type="number" 
                  placeholder="Máx" 
                  value={valoracionMax}
                  onChange={(e) => setValoracionMax(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500" />
                Facturación (€)
              </Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  placeholder="Mín" 
                  value={facturacionMin}
                  onChange={(e) => setFacturacionMin(e.target.value)}
                  className="flex-1"
                />
                <span className="text-muted-foreground">-</span>
                <Input 
                  type="number" 
                  placeholder="Máx" 
                  value={facturacionMax}
                  onChange={(e) => setFacturacionMax(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calculator className="w-4 h-4 text-purple-500" />
                EBITDA (€)
              </Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  placeholder="Mín" 
                  value={ebitdaMin}
                  onChange={(e) => setEbitdaMin(e.target.value)}
                  className="flex-1"
                />
                <span className="text-muted-foreground">-</span>
                <Input 
                  type="number" 
                  placeholder="Máx" 
                  value={ebitdaMax}
                  onChange={(e) => setEbitdaMax(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Contador de resultados */}
      <div className="text-sm text-muted-foreground">
        {filteredLeads.length} contactos
        {hasActiveFilters && ` (de ${leads.length})`}
      </div>

      {/* Tabla condensada */}
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Seleccionar todos"
                  className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
                />
              </TableHead>
              <TableHead className="min-w-[180px]">Contacto</TableHead>
              <TableHead className="w-[90px]">Origen</TableHead>
              <TableHead className="min-w-[120px]">Canal</TableHead>
              <TableHead className="min-w-[120px]">Empresa</TableHead>
              <TableHead className="w-[80px]">Sector</TableHead>
              <TableHead className="w-[100px]">Fin.</TableHead>
              <TableHead className="w-[70px]">Apollo</TableHead>
              <TableHead className="w-[90px]">Actividad</TableHead>
              <TableHead className="w-[100px]">Registrar</TableHead>
              <TableHead className="w-[110px]">Estado</TableHead>
              <TableHead className="w-[70px]">Fecha</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8">
                  Cargando leads...
                </TableCell>
              </TableRow>
            ) : filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8">
                  No se encontraron leads
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map(lead => {
                const leadKey = `${lead.tipo}-${lead.id}`;
                const isSelected = selectedIds.has(leadKey);
                
                return (
                  <TableRow 
                    key={leadKey} 
                    className="text-sm"
                    data-state={isSelected ? "selected" : undefined}
                  >
                    <TableCell className="py-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectRow(leadKey, !!checked)}
                        aria-label={`Seleccionar ${lead.nombre}`}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <LeadContactCell
                        nombre={lead.nombre}
                        email={lead.email}
                        phone={lead.phone}
                        isPro={lead.isPro}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge className={`${tipoBadgeColors[lead.tipo]} text-white text-[10px] px-1.5`}>
                        {tipoLabels[lead.tipo]}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <LeadCanalCell canal={lead.canal} leadForm={lead.leadForm} />
                    </TableCell>
                    <TableCell className="py-2 text-xs">
                      {lead.empresa || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">
                      {lead.sector || '-'}
                    </TableCell>
                    <TableCell className="py-2">
                      <LeadFinanceCell
                        valoracion={lead.valoracion}
                        facturacion={lead.facturacion}
                        ebitda={lead.ebitda}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <ApolloStatusBadge status={lead.apolloStatus} />
                    </TableCell>
                    <TableCell className="py-2">
                      <LeadActivityCell
                        totalHours={lead.totalHours}
                        lastActivityDate={lead.lastActivityDate}
                        daysSinceActivity={lead.dias}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <LeadQuickTimeButtons
                        onLogCall={() => {
                          setTimeEntryLead(lead);
                          setTimeEntryType('llamada');
                        }}
                        onLogVideoCall={() => {
                          setTimeEntryLead(lead);
                          setTimeEntryType('videollamada');
                        }}
                        onLogMeeting={() => {
                          setTimeEntryLead(lead);
                          setTimeEntryType('reunion');
                        }}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <InlineEditSelect
                        value={lead.status}
                        options={STATUS_OPTIONS}
                        onSave={async (newStatus) => {
                          await updateStatusMutation.mutateAsync({
                            leadId: lead.id,
                            leadType: lead.tipo,
                            newStatus
                          });
                        }}
                        renderDisplay={(val) => (
                          <Badge className={`${STATUS_COLORS[val] || 'bg-gray-100 text-gray-800'} text-[10px]`}>
                            {STATUS_OPTIONS.find(o => o.value === val)?.label || val}
                          </Badge>
                        )}
                      />
                    </TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">
                      {format(new Date(lead.fecha), 'dd/MM/yy')}
                    </TableCell>
                    <TableCell className="py-2">
                      <LeadActionsMenu
                        onView={() => setSelectedLead(lead)}
                        onLogCall={() => {
                          setTimeEntryLead(lead);
                          setTimeEntryType('llamada');
                        }}
                        onLogVideoCall={() => {
                          setTimeEntryLead(lead);
                          setTimeEntryType('videollamada');
                        }}
                        onLogMeeting={() => {
                          setTimeEntryLead(lead);
                          setTimeEntryType('reunion');
                        }}
                        onConvertToClient={lead.status === 'qualified' ? () => setConversionLead(lead) : undefined}
                        onMarkContacted={() => updateStatusMutation.mutate({
                          leadId: lead.id,
                          leadType: lead.tipo,
                          newStatus: 'contacted'
                        })}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bulk actions bar */}
      <BulkActionsBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        actions={[
          { icon: Phone, label: "Contactado", onClick: handleBulkMarkContacted },
          commonBulkActions.export(handleExport),
        ]}
      />

      {/* Panel lateral de detalle */}
      <LeadDetailSheet 
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => {
          if (!open) setSelectedLead(null);
        }}
      />

      {/* Modal de imputación de tiempo */}
      {timeEntryLead && (
        <QuickTimeEntryModal
          open={!!timeEntryLead}
          onOpenChange={(open) => !open && setTimeEntryLead(null)}
          lead={{
            id: timeEntryLead.id,
            tipo: timeEntryLead.tipo,
            nombre: timeEntryLead.nombre,
            email: timeEntryLead.email,
            empresa: timeEntryLead.empresa,
            sector: timeEntryLead.sector,
          }}
          preselectedType={timeEntryType}
        />
      )}

      {/* Modal de conversión a cliente */}
      {conversionLead && (
        <LeadConversionModal
          open={!!conversionLead}
          onOpenChange={(open) => !open && setConversionLead(null)}
          lead={{
            id: conversionLead.id,
            tipo: conversionLead.tipo,
            nombre: conversionLead.nombre,
            email: conversionLead.email,
            empresa: conversionLead.empresa,
            sector: conversionLead.sector,
            valoracion: conversionLead.valoracion,
            facturacion: conversionLead.facturacion,
            ebitda: conversionLead.ebitda,
            phone: conversionLead.phone,
          }}
        />
      )}
    </div>
  );
}
