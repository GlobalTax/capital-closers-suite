import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { updateLeadStatus } from "@/services/dashboardTV";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import { Search, Filter, SlidersHorizontal, X, TrendingUp, Users, Calculator, Building2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { LeadDetailSheet, LeadDetailData } from "@/components/leads/LeadDetailSheet";
import { InlineEditText, InlineEditSelect } from "@/components/shared/InlineEdit";

type LeadRow = {
  id: string;
  tipo: 'contact' | 'valuation' | 'collaborator';
  nombre: string;
  email: string;
  empresa?: string;
  status: string;
  fecha: string;
  dias: number;
  valoracion?: number;
  facturacion?: number;
  ebitda?: number;
  canal?: string;
  acquisition_channel_id?: string;
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
  
  const [valoracionMin, setValoracionMin] = useState<string>("");
  const [valoracionMax, setValoracionMax] = useState<string>("");
  const [facturacionMin, setFacturacionMin] = useState<string>("");
  const [facturacionMax, setFacturacionMax] = useState<string>("");
  const [ebitdaMin, setEbitdaMin] = useState<string>("");
  const [ebitdaMax, setEbitdaMax] = useState<string>("");
  
  const [selectedLead, setSelectedLead] = useState<LeadDetailData | null>(null);
  
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['gestion-leads', filterType, filterStatus],
    queryFn: async (): Promise<LeadRow[]> => {
      const allLeads: LeadRow[] = [];

      if (filterType === 'all' || filterType === 'contact') {
        const { data: contacts } = await supabase
          .from('contact_leads')
          .select(`
            *,
            acquisition_channels (id, name)
          `)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (contacts) {
          allLeads.push(...contacts.map(c => ({
            id: c.id,
            tipo: 'contact' as const,
            nombre: c.full_name,
            email: c.email,
            empresa: c.company || undefined,
            status: c.status,
            fecha: c.created_at,
            dias: Math.floor((Date.now() - new Date(c.status_updated_at || c.created_at).getTime()) / (1000 * 60 * 60 * 24)),
            canal: c.acquisition_channels?.name || undefined,
            acquisition_channel_id: c.acquisition_channel_id || undefined,
          })));
        }
      }

      if (filterType === 'all' || filterType === 'valuation') {
        const { data: valuations } = await supabase
          .from('company_valuations')
          .select(`
            *,
            acquisition_channels (id, name)
          `)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (valuations) {
          allLeads.push(...valuations.map(v => ({
            id: v.id,
            tipo: 'valuation' as const,
            nombre: v.contact_name,
            email: v.email,
            empresa: v.company_name,
            status: v.valuation_status || 'new',
            fecha: v.created_at,
            dias: Math.floor((Date.now() - new Date(v.last_activity_at || v.created_at).getTime()) / (1000 * 60 * 60 * 24)),
            valoracion: v.final_valuation ? Number(v.final_valuation) : undefined,
            facturacion: v.revenue ? Number(v.revenue) : undefined,
            ebitda: v.ebitda ? Number(v.ebitda) : undefined,
            canal: v.acquisition_channels?.name || undefined,
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

  // Mutation para actualizar campos de leads
  const updateLeadFieldMutation = useMutation({
    mutationFn: async ({ leadId, leadType, field, value }: {
      leadId: string;
      leadType: 'contact' | 'valuation' | 'collaborator';
      field: string;
      value: any;
    }) => {
      const tableMap: Record<string, 'contact_leads' | 'company_valuations' | 'collaborator_applications'> = {
        contact: 'contact_leads',
        valuation: 'company_valuations',
        collaborator: 'collaborator_applications'
      };
      
      const fieldMap: Record<string, Record<string, string>> = {
        contact: { nombre: 'full_name', empresa: 'company' },
        valuation: { nombre: 'contact_name', empresa: 'company_name' },
        collaborator: { nombre: 'full_name', empresa: 'company' }
      };

      const actualField = fieldMap[leadType]?.[field] || field;
      
      const { error } = await supabase
        .from(tableMap[leadType])
        .update({ [actualField]: value })
        .eq('id', leadId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestion-leads'] });
      toast.success('Actualizado correctamente');
    },
    onError: () => {
      toast.error('Error al actualizar');
    }
  });

  const activeNumericFilters = useMemo(() => {
    let count = 0;
    if (valoracionMin || valoracionMax) count++;
    if (facturacionMin || facturacionMax) count++;
    if (ebitdaMin || ebitdaMax) count++;
    return count;
  }, [valoracionMin, valoracionMax, facturacionMin, facturacionMax, ebitdaMin, ebitdaMax]);

  const hasActiveFilters = searchTerm || activeNumericFilters > 0;

  const clearAllFilters = () => {
    setSearchTerm("");
    setValoracionMin("");
    setValoracionMax("");
    setFacturacionMin("");
    setFacturacionMax("");
    setEbitdaMin("");
    setEbitdaMax("");
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        lead.nombre.toLowerCase().includes(searchLower) ||
        lead.email.toLowerCase().includes(searchLower) ||
        (lead.empresa?.toLowerCase().includes(searchLower));

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
  }, [leads, searchTerm, valoracionMin, valoracionMax, facturacionMin, facturacionMax, ebitdaMin, ebitdaMax]);

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
    contact: 'Contacto',
    valuation: 'Valoración',
    collaborator: 'Colaborador'
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Leads"
        description="Actualiza manualmente el estado de los leads en el funnel comercial"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase">Total</span>
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground uppercase">Contactos</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.contacts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-muted-foreground uppercase">Valoraciones</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{stats.valuations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground uppercase">Colaboradores</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.collaborators}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground uppercase">Valoración Total</span>
            </div>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(stats.totalValoracion)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros principales */}
      <div className="flex flex-wrap gap-4 items-start">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por nombre, email o empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="contact">Contactos</SelectItem>
            <SelectItem value="valuation">Valoraciones</SelectItem>
            <SelectItem value="collaborator">Colaboradores</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="new">Nuevo</SelectItem>
            <SelectItem value="contacted">En Contacto</SelectItem>
            <SelectItem value="qualified">Calificado</SelectItem>
            <SelectItem value="converted">Convertido</SelectItem>
          </SelectContent>
        </Select>

        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="default" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Filtros avanzados
              {activeNumericFilters > 0 && (
                <Badge variant="secondary" className="ml-1 bg-primary text-primary-foreground">
                  {activeNumericFilters}
                </Badge>
              )}
            </Button>
          </CollapsibleTrigger>
        </Collapsible>

        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="default" 
            onClick={clearAllFilters}
            className="text-muted-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Limpiar filtros
          </Button>
        )}
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
              <p className="text-xs text-muted-foreground">Ej: 500000 para 500K€</p>
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
              <p className="text-xs text-muted-foreground">Ej: 1000000 para 1M€</p>
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
              <p className="text-xs text-muted-foreground">Ej: 100000 para 100K€</p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Contador de resultados */}
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredLeads.length} de {leads.length} leads
        {hasActiveFilters && " (filtrados)"}
      </div>

      {/* Tabla */}
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Tipo</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead className="text-right w-[90px]">Valoración</TableHead>
              <TableHead className="text-right w-[90px]">Facturación</TableHead>
              <TableHead className="text-right w-[80px]">EBITDA</TableHead>
              <TableHead className="w-[130px]">Estado</TableHead>
              <TableHead className="w-[60px]">Días</TableHead>
              <TableHead className="hidden lg:table-cell w-[90px]">Fecha</TableHead>
              <TableHead className="w-[70px]">Acciones</TableHead>
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
              filteredLeads.map(lead => (
                <TableRow key={`${lead.tipo}-${lead.id}`} className="text-sm">
                  <TableCell className="py-2">
                    <Badge className={`${tipoBadgeColors[lead.tipo]} text-white text-xs`}>
                      {tipoLabels[lead.tipo]}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2">
                    <InlineEditText
                      value={lead.nombre}
                      onSave={async (newValue) => {
                        await updateLeadFieldMutation.mutateAsync({
                          leadId: lead.id,
                          leadType: lead.tipo,
                          field: 'nombre',
                          value: newValue
                        });
                      }}
                      className="font-medium"
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs py-2 hidden md:table-cell">{lead.email}</TableCell>
                  <TableCell className="py-2">
                    <InlineEditText
                      value={lead.empresa || ""}
                      onSave={async (newValue) => {
                        await updateLeadFieldMutation.mutateAsync({
                          leadId: lead.id,
                          leadType: lead.tipo,
                          field: 'empresa',
                          value: newValue || null
                        });
                      }}
                      className="text-xs"
                      placeholder="-"
                    />
                  </TableCell>
                  <TableCell className="py-2">
                    {lead.canal ? (
                      <Badge variant="outline" className="text-xs flex items-center gap-1 w-fit">
                        <Megaphone className="w-3 h-3" />
                        {lead.canal}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium py-2">
                    {lead.valoracion ? (
                      <span className="text-amber-600 text-xs">{formatCurrency(lead.valoracion)}</span>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right py-2 text-xs">
                    {lead.facturacion ? formatCurrency(lead.facturacion) : '-'}
                  </TableCell>
                  <TableCell className="text-right py-2 text-xs">
                    {lead.ebitda ? formatCurrency(lead.ebitda) : '-'}
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
                        <Badge className={`${STATUS_COLORS[val] || 'bg-gray-100 text-gray-800'} text-xs`}>
                          {STATUS_OPTIONS.find(o => o.value === val)?.label || val}
                        </Badge>
                      )}
                    />
                  </TableCell>
                  <TableCell className="py-2">
                    {lead.dias > 7 ? (
                      <Badge variant="destructive" className="text-xs">{lead.dias}d</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">{lead.dias}d</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs py-2 hidden lg:table-cell">
                    {format(new Date(lead.fecha), 'dd/MM/yy')}
                  </TableCell>
                  <TableCell className="py-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={() => setSelectedLead(lead)}
                    >
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Panel lateral de detalle */}
      <LeadDetailSheet 
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => {
          if (!open) setSelectedLead(null);
        }}
      />
    </div>
  );
}