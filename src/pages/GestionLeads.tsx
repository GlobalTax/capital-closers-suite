import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { updateLeadStatus } from "@/services/dashboardTV";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Search, Filter } from "lucide-react";
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
};

export default function GestionLeads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
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

      // Valuations
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
            dias: Math.floor((Date.now() - new Date(v.last_activity_at || v.created_at).getTime()) / (1000 * 60 * 60 * 24))
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

  // Filtrar por búsqueda
  const filteredLeads = leads.filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    return (
      lead.nombre.toLowerCase().includes(searchLower) ||
      lead.email.toLowerCase().includes(searchLower) ||
      (lead.empresa?.toLowerCase().includes(searchLower))
    );
  });

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

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
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
              <TableHead>Estado</TableHead>
              <TableHead>Días en Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Cargando leads...
                </TableCell>
              </TableRow>
            ) : filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
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
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.empresa || '-'}</TableCell>
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
                      <SelectTrigger className="w-[150px]">
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
                      <Badge variant="destructive">{lead.dias} días</Badge>
                    ) : (
                      <span className="text-muted-foreground">{lead.dias} días</span>
                    )}
                  </TableCell>
                  <TableCell>{format(new Date(lead.fecha), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Ver detalle
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
