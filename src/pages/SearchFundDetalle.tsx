import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  Globe,
  ExternalLink,
  Building2,
  Calendar,
  Users,
  Target,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  GraduationCap,
  Star,
  MoreHorizontal,
  Plus,
  Link2,
  Clock,
  Send,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useSearchFundPeople } from '@/hooks/useSearchFundPeople';
import { useSearchFundsRealtime } from '@/hooks/useSearchFundsRealtime';
import { useUpdateMatchStatus, useUpdateMatchNotes } from '@/hooks/useSearchFundMatches';
import { MatchNotesCell } from '@/components/searchfunds/MatchNotesCell';
import { OutreachTimelineItem } from '@/components/searchfunds/OutreachTimelineItem';
import type { SearchFund } from '@/types/searchFunds';
import { MATCH_STATUS_LABELS, MATCH_STATUS_COLORS, type MatchStatus } from '@/types/searchFunds';

// Status badges
const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  searching: { label: 'Buscando', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  acquired: { label: 'Adquirido', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  inactive: { label: 'Inactivo', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
  paused: { label: 'Pausado', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
};

function formatCurrency(value: number | null): string {
  if (value === null) return 'No especificado';
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
  return `€${value.toLocaleString()}`;
}

function formatRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return 'No especificado';
  if (min === null) return `Hasta ${formatCurrency(max)}`;
  if (max === null) return `Desde ${formatCurrency(min)}`;
  return `${formatCurrency(min)} - ${formatCurrency(max)}`;
}

export default function SearchFundDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Activar sincronización en tiempo real
  useSearchFundsRealtime();
  
  const [industriasOpen, setIndustriasOpen] = useState(true);
  const [criteriosOpen, setCriteriosOpen] = useState(true);
  const [detallesOpen, setDetallesOpen] = useState(true);

  // Fetch fund data
  const { data: fund, isLoading: loadingFund } = useQuery({
    queryKey: ['search-fund', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sf_funds')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as SearchFund;
    },
    enabled: !!id,
  });

  // Fetch people
  const { data: people = [], isLoading: loadingPeople } = useSearchFundPeople(id);

  // Fetch matches (oportunidades asignadas)
  const { data: matches = [], isLoading: loadingMatches } = useQuery({
    queryKey: ['sf-fund-matches', id],
    queryFn: async () => {
      const { data: matchData, error } = await supabase
        .from('sf_matches')
        .select(`
          *,
          mandato:mandatos(
            id,
            codigo,
            estado,
            tipo,
            empresa:empresas(nombre)
          )
        `)
        .eq('fund_id', id)
        .eq('crm_entity_type', 'mandato')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return matchData || [];
    },
    enabled: !!id,
  });

  // Match mutations
  const updateStatusMutation = useUpdateMatchStatus();
  const updateNotesMutation = useUpdateMatchNotes();

  // Stats
  const stats = {
    personas: people.length,
    adquisiciones: 0, // TODO: If there's an acquisitions table
    matches: matches.length,
    enCartera: matches.filter(m => m.status === 'en_negociacion').length,
  };

  if (loadingFund) {
    return (
      <AppLayout>
        <div className="p-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="grid grid-cols-3 gap-6">
            <Skeleton className="h-[400px]" />
            <div className="col-span-2">
              <Skeleton className="h-[400px]" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!fund) {
    return (
      <AppLayout>
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Search Fund no encontrado</p>
          <Button variant="link" onClick={() => navigate('/search-funds')}>
            Volver al listado
          </Button>
        </div>
      </AppLayout>
    );
  }

  const statusBadge = STATUS_BADGES[fund.status || 'inactive'] || STATUS_BADGES.inactive;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/search-funds')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{fund.name}</h1>
              <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {fund.website && (
              <Button variant="outline" size="sm" onClick={() => window.open(fund.website!, '_blank')}>
                <Globe className="w-4 h-4 mr-2" />
                Website
              </Button>
            )}
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Main Layout - Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="space-y-4">
            {/* Fund Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{fund.name}</h3>
                    <Badge className={statusBadge.className + " mt-1"}>{statusBadge.label}</Badge>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  {fund.website && (
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(fund.website!, '_blank')}>
                      <Globe className="w-4 h-4" />
                      Website
                    </Button>
                  )}
                  {fund.source_url && (
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(fund.source_url!, '_blank')}>
                      <ExternalLink className="w-4 h-4" />
                      Fuente
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Industrias */}
            <Card>
              <Collapsible open={industriasOpen} onOpenChange={setIndustriasOpen}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      INDUSTRIAS
                      <span className="text-xs text-muted-foreground">{industriasOpen ? '▲' : '▼'}</span>
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {fund.sector_focus && fund.sector_focus.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {fund.sector_focus.map((sector, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {sector}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sin sectores definidos</p>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* Criterios de Inversión */}
            <Card>
              <Collapsible open={criteriosOpen} onOpenChange={setCriteriosOpen}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      CRITERIOS DE INVERSIÓN
                      <span className="text-xs text-muted-foreground">{criteriosOpen ? '▲' : '▼'}</span>
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">EBITDA</p>
                        <p className="text-sm font-medium">{formatRange(fund.ebitda_min, fund.ebitda_max)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">Revenue</p>
                        <p className="text-sm font-medium">{formatRange(fund.revenue_min, fund.revenue_max)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Deal Size</p>
                      <p className="text-sm font-medium">{formatRange(fund.deal_size_min, fund.deal_size_max)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Estilo</p>
                      <p className="text-sm font-medium">{fund.investment_style || 'No especificado'}</p>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* Detalles del Registro */}
            <Card>
              <Collapsible open={detallesOpen} onOpenChange={setDetallesOpen}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      DETALLES DEL REGISTRO
                      <span className="text-xs text-muted-foreground">{detallesOpen ? '▲' : '▼'}</span>
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-2 text-sm">
                    {fund.founded_year && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Fundado: {fund.founded_year}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Creado: {format(new Date(fund.created_at), 'd MMM yyyy', { locale: es })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Modificado: {format(new Date(fund.updated_at), 'd MMM yyyy', { locale: es })}</span>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </div>

          {/* Right Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="resumen" className="w-full">
              <TabsList>
                <TabsTrigger value="resumen">Resumen</TabsTrigger>
                <TabsTrigger value="personas" className="gap-1">
                  Personas <Badge variant="secondary" className="ml-1 text-xs">{stats.personas}</Badge>
                </TabsTrigger>
                <TabsTrigger value="adquisiciones" className="gap-1">
                  Adquisiciones <Badge variant="secondary" className="ml-1 text-xs">{stats.adquisiciones}</Badge>
                </TabsTrigger>
                <TabsTrigger value="matches" className="gap-1">
                  Matches <Badge variant="secondary" className="ml-1 text-xs">{stats.matches}</Badge>
                </TabsTrigger>
                <TabsTrigger value="outreach" className="gap-1">
                  <Send className="w-3.5 h-3.5 mr-1" />
                  Outreach
                </TabsTrigger>
                <TabsTrigger value="historial">Historial</TabsTrigger>
              </TabsList>

              {/* Resumen Tab */}
              <TabsContent value="resumen" className="mt-6 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-semibold">{stats.personas}</p>
                      <p className="text-sm text-muted-foreground">Personas</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-semibold">{stats.adquisiciones}</p>
                      <p className="text-sm text-muted-foreground">Adquisiciones</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-semibold">{stats.matches}</p>
                      <p className="text-sm text-muted-foreground">Matches</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-semibold">{stats.enCartera}</p>
                      <p className="text-sm text-muted-foreground">En cartera</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Personas Section */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      Personas
                      <Badge variant="secondary">{stats.personas}</Badge>
                    </CardTitle>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Plus className="w-4 h-4" />
                      Añadir
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Nombre</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Ubicación</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingPeople ? (
                          Array.from({ length: 2 }).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                              <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                              <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                            </TableRow>
                          ))
                        ) : people.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No hay personas registradas
                            </TableCell>
                          </TableRow>
                        ) : (
                          people.map((person) => (
                            <TableRow key={person.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {person.linkedin_url && (
                                    <a
                                      href={person.linkedin_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      <Linkedin className="w-4 h-4" />
                                    </a>
                                  )}
                                  <div>
                                    <p className="font-medium">{person.full_name}</p>
                                    {person.role && (
                                      <Badge variant="outline" className="text-xs mt-0.5">
                                        {person.role}
                                      </Badge>
                                    )}
                                  </div>
                                  {person.is_primary_contact && (
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {person.email ? (
                                  <a
                                    href={`mailto:${person.email}`}
                                    className="flex items-center gap-1.5 text-sm hover:text-primary"
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                    {person.email}
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {person.location || '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Adquisiciones Section */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      Adquisiciones
                      <Badge variant="secondary">{stats.adquisiciones}</Badge>
                    </CardTitle>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Plus className="w-4 h-4" />
                      Añadir
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Portfolio URL Input - like in the screenshot */}
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="url"
                          placeholder="URL de portfolio del search fund..."
                          className="w-full pl-10 pr-4 py-2 text-sm border rounded-md bg-background"
                        />
                      </div>
                      <Button variant="secondary" size="sm" className="gap-2">
                        <Target className="w-4 h-4" />
                        Extraer con IA
                      </Button>
                    </div>

                    <div className="text-center py-8 text-muted-foreground">
                      <p className="font-medium">No hay adquisiciones registradas</p>
                      <p className="text-sm">Añade una URL de portfolio arriba para extraer automáticamente con IA</p>
                      <Button variant="outline" size="sm" className="mt-4 gap-1">
                        <Plus className="w-4 h-4" />
                        Añadir primera adquisición
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Personas Tab */}
              <TabsContent value="personas" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-base font-medium">
                      Personas del Search Fund
                    </CardTitle>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Plus className="w-4 h-4" />
                      Añadir persona
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Nombre</TableHead>
                          <TableHead>Cargo</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Ubicación</TableHead>
                          <TableHead>Formación</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingPeople ? (
                          Array.from({ length: 3 }).map((_, i) => (
                            <TableRow key={i}>
                              {Array.from({ length: 7 }).map((_, j) => (
                                <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : people.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                              <p>No hay personas registradas</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          people.map((person) => (
                            <TableRow key={person.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {person.linkedin_url && (
                                    <a
                                      href={person.linkedin_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      <Linkedin className="w-4 h-4" />
                                    </a>
                                  )}
                                  <span className="font-medium">{person.full_name}</span>
                                  {person.is_primary_contact && (
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {person.role ? (
                                  <Badge variant="outline">{person.role}</Badge>
                                ) : '-'}
                              </TableCell>
                              <TableCell>
                                {person.email ? (
                                  <a href={`mailto:${person.email}`} className="hover:text-primary">
                                    {person.email}
                                  </a>
                                ) : '-'}
                              </TableCell>
                              <TableCell>
                                {person.phone ? (
                                  <a href={`tel:${person.phone}`} className="hover:text-primary">
                                    {person.phone}
                                  </a>
                                ) : '-'}
                              </TableCell>
                              <TableCell>{person.location || '-'}</TableCell>
                              <TableCell>
                                {person.school ? (
                                  <div className="flex items-center gap-1.5">
                                    <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-sm">{person.school}</span>
                                  </div>
                                ) : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Adquisiciones Tab */}
              <TabsContent value="adquisiciones" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-base font-medium">
                      Adquisiciones realizadas
                    </CardTitle>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Plus className="w-4 h-4" />
                      Añadir adquisición
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="font-medium">No hay adquisiciones registradas</p>
                      <p className="text-sm mt-1">Las adquisiciones aparecerán aquí cuando el Search Fund complete una operación</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Matches Tab */}
              <TabsContent value="matches" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-base font-medium">
                      Oportunidades asignadas
                    </CardTitle>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Plus className="w-4 h-4" />
                      Añadir match
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Mandato</TableHead>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Notas</TableHead>
                          <TableHead>Contactado</TableHead>
                          <TableHead>Teaser</TableHead>
                          <TableHead>NDA</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingMatches ? (
                          Array.from({ length: 3 }).map((_, i) => (
                            <TableRow key={i}>
                              {Array.from({ length: 8 }).map((_, j) => (
                                <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : matches.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                              <Target className="w-10 h-10 mx-auto mb-2 opacity-50" />
                              <p>No hay oportunidades asignadas</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          matches.map((match: any) => (
                            <TableRow
                              key={match.id}
                              className="hover:bg-muted/50"
                            >
                              <TableCell 
                                className="cursor-pointer"
                                onClick={() => navigate(`/mandatos/${match.crm_entity_id}`)}
                              >
                                <span className="font-medium text-primary hover:underline">
                                  {match.mandato?.codigo || 'Sin código'}
                                </span>
                              </TableCell>
                              <TableCell>
                                {match.mandato?.empresa?.nombre || '-'}
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Select
                                  value={match.status || 'nuevo'}
                                  onValueChange={(value) => {
                                    updateStatusMutation.mutate({
                                      matchId: match.id,
                                      status: value as MatchStatus,
                                      mandatoId: match.crm_entity_id,
                                    });
                                  }}
                                >
                                  <SelectTrigger className="w-[130px] h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(MATCH_STATUS_LABELS).map(([value, label]) => (
                                      <SelectItem key={value} value={value}>
                                        <Badge className={`${MATCH_STATUS_COLORS[value as MatchStatus]} text-xs`}>
                                          {label}
                                        </Badge>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <MatchNotesCell
                                  notes={match.notes}
                                  onSave={(notes) => {
                                    updateNotesMutation.mutate({
                                      matchId: match.id,
                                      notes,
                                      mandatoId: match.crm_entity_id,
                                    });
                                  }}
                                  isLoading={updateNotesMutation.isPending}
                                />
                              </TableCell>
                              <TableCell>
                                {match.contacted_at ? (
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <Clock className="w-3.5 h-3.5" />
                                    {format(new Date(match.contacted_at), 'd MMM yyyy', { locale: es })}
                                  </div>
                                ) : '-'}
                              </TableCell>
                              <TableCell>
                                {match.teaser_sent_at ? (
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <Clock className="w-3.5 h-3.5" />
                                    {format(new Date(match.teaser_sent_at), 'd MMM yyyy', { locale: es })}
                                  </div>
                                ) : '-'}
                              </TableCell>
                              <TableCell>
                                {match.nda_sent_at ? (
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <Clock className="w-3.5 h-3.5" />
                                    {format(new Date(match.nda_sent_at), 'd MMM yyyy', { locale: es })}
                                  </div>
                                ) : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => navigate(`/mandatos/${match.crm_entity_id}`)}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Outreach Tab */}
              <TabsContent value="outreach" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-base font-medium">
                      Historial de contactos
                    </CardTitle>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Plus className="w-4 h-4" />
                      Registrar interacción
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {matches.filter((m: any) => m.contacted_at || m.teaser_sent_at || m.nda_sent_at).length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Send className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="font-medium">Sin interacciones registradas</p>
                        <p className="text-sm mt-1">Registra contactos con este Search Fund para ver el timeline aquí</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {matches
                          .filter((m: any) => m.contacted_at || m.teaser_sent_at || m.nda_sent_at)
                          .map((match: any) => (
                            <OutreachTimelineItem
                              key={match.id}
                              match={match}
                              mandatoCode={match.mandato?.codigo}
                              empresaName={match.mandato?.empresa?.nombre}
                              onClick={() => navigate(`/mandatos/${match.crm_entity_id}`)}
                            />
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Historial Tab */}
              <TabsContent value="historial" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium">
                      Historial de actividad
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="font-medium">Sin actividad registrada</p>
                      <p className="text-sm mt-1">El historial de comunicaciones aparecerá aquí</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
