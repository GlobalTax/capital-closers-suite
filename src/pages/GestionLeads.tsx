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
import { Search, Filter, SlidersHorizontal, X, TrendingUp, Users, Calculator, Building2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type LeadRow = {
  id: string;
  tipo: 'contact' | 'valuation' | 'collaborator';
  nombre: string;
  email: string;
  empresa?: string;
  status: string;
  fecha: string;
  dias: number;
  // Campos financieros (solo para valuations)
  valoracion?: number;
  facturacion?: number;
  ebitda?: number;
};

// Helper para formatear moneda
const formatCurrency = (value: number | undefined): string => {
  if (value === undefined || value === null) return '-';
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M€`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K€`;
  }
  return `${value.toFixed(0)}€`;
};

export default function GestionLeads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Estados para filtros numéricos
  const [valoracionMin, setValoracionMin] = useState<string>("");
  const [valoracionMax, setValoracionMax] = useState<string>("");
  const [facturacionMin, setFacturacionMin] = useState<string>("");
  const [facturacionMax, setFacturacionMax] = useState<string>("");
  const [ebitdaMin, setEbitdaMin] = useState<string>("");
  const [ebitdaMax, setEbitdaMax] = useState<string>("");
  
  const queryClient = useQueryClient();

  // Fetch todos los leads
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['gestion-leads', filterType, filterStatus],
    queryFn: async (): Promise<LeadRow[]> => {
      const allLeads: LeadRow[] = [];

      // Contact leads
      if (filterType === 'all' || filterType === 'contact') {
        const { data: contacts } = await supabase
          .from('contact_leads')
          .select('*')
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
            dias: Math.floor((Date.now() - new Date(c.status_updated_at || c.created_at).getTime()) / (1000 * 60 * 60 * 24))
          })));
        }
      }

      // Valuations - ahora con campos financieros
      if (filterType === 'all' || filterType === 'valuation') {
        const { data: valuations } = await supabase
          .from('company_valuations')
          .select('*')
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
            // Campos financieros
            valoracion: v.final_valuation ? Number(v.final_valuation) : undefined,
            facturacion: v.revenue ? Number(v.revenue) : undefined,
            ebitda: v.ebitda ? Number(v.ebitda) : undefined,
          })));
        }
      }

      // Collaborators
      if (filterType === 'all' || filterType === 'collaborator') {
        const { data: collaborators } = await supabase
          .from('collaborator_applications')
          .select('*')
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
            dias: Math.floor((Date.now() - new Date(c.status_updated_at || c.created_at).getTime()) / (1000 * 60 * 60 * 24))
          })));
        }
      }

      // Filtrar por status si aplica
      if (filterStatus !== 'all') {
        return allLeads.filter(l => l.status === filterStatus);
      }

      return allLeads;
    }
  });

  // Mutation para actualizar estado
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

  // Contar filtros numéricos activos
  const activeNumericFilters = useMemo(() => {
    let count = 0;
    if (valoracionMin || valoracionMax) count++;
    if (facturacionMin || facturacionMax) count++;
    if (ebitdaMin || ebitdaMax) count++;
    return count;
  }, [valoracionMin, valoracionMax, facturacionMin, facturacionMax, ebitdaMin, ebitdaMax]);

  const hasActiveFilters = searchTerm || activeNumericFilters > 0;

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setSearchTerm("");
    setValoracionMin("");
    setValoracionMax("");
    setFacturacionMin("");
    setFacturacionMax("");
    setEbitdaMin("");
    setEbitdaMax("");
  };

  // Filtrar leads con todos los criterios
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Búsqueda de texto (nombre, email, empresa)
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        lead.nombre.toLowerCase().includes(searchLower) ||
        lead.email.toLowerCase().includes(searchLower) ||
        (lead.empresa?.toLowerCase().includes(searchLower));

      // Filtros numéricos - solo aplican si hay valor
      const valMinNum = valoracionMin ? Number(valoracionMin) : null;
      const valMaxNum = valoracionMax ? Number(valoracionMax) : null;
      const facMinNum = facturacionMin ? Number(facturacionMin) : null;
      const facMaxNum = facturacionMax ? Number(facturacionMax) : null;
      const ebitMinNum = ebitdaMin ? Number(ebitdaMin) : null;
      const ebitMaxNum = ebitdaMax ? Number(ebitdaMax) : null;

      // Si hay filtros numéricos activos y el lead no tiene datos financieros, excluirlo
      const hasNumericFilters = valMinNum || valMaxNum || facMinNum || facMaxNum || ebitMinNum || ebitMaxNum;
      
      if (hasNumericFilters && lead.tipo !== 'valuation') {
        return false; // Solo valuations tienen datos financieros
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

  // Estadísticas KPI
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
        {/* Búsqueda */}
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

        {/* Filtro por tipo */}
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

        {/* Filtro por estado */}
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

        {/* Botón filtros avanzados */}
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

        {/* Limpiar filtros */}
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
            {/* Valoración */}
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
            
            {/* Facturación */}
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
            
            {/* EBITDA */}
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
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead className="text-right">Valoración</TableHead>
              <TableHead className="text-right">Facturación</TableHead>
              <TableHead className="text-right">EBITDA</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Días</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8">
                  Cargando leads...
                </TableCell>
              </TableRow>
            ) : filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8">
                  No se encontraron leads
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map(lead => (
                <TableRow key={`${lead.tipo}-${lead.id}`}>
                  <TableCell>
                    <Badge className={`${tipoBadgeColors[lead.tipo]} text-white`}>
                      {tipoLabels[lead.tipo]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{lead.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.email}</TableCell>
                  <TableCell>{lead.empresa || '-'}</TableCell>
                  <TableCell className="text-right font-medium">
                    {lead.valoracion ? (
                      <span className="text-amber-600">{formatCurrency(lead.valoracion)}</span>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {lead.facturacion ? formatCurrency(lead.facturacion) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {lead.ebitda ? formatCurrency(lead.ebitda) : '-'}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={lead.status}
                      onValueChange={(newStatus) => {
                        updateStatusMutation.mutate({
                          leadId: lead.id,
                          leadType: lead.tipo,
                          newStatus
                        });
                      }}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Nuevo</SelectItem>
                        <SelectItem value="contacted">En Contacto</SelectItem>
                        <SelectItem value="qualified">Calificado</SelectItem>
                        <SelectItem value="converted">Convertido</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {lead.dias > 7 ? (
                      <Badge variant="destructive">{lead.dias}d</Badge>
                    ) : (
                      <span className="text-muted-foreground">{lead.dias}d</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(lead.fecha), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
