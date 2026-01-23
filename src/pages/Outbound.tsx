import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, Mail, Import, Zap, MoreHorizontal, Trash2, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useOutboundCampaigns, useOutboundStats, useDeleteCampaign } from '@/hooks/useOutboundCampaigns';
import NuevaCampanaDrawer from '@/components/outbound/NuevaCampanaDrawer';
import type { OutboundCampaign } from '@/types/outbound';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Borrador', variant: 'secondary' },
  searching: { label: 'Buscando', variant: 'default' },
  enriching: { label: 'Enriqueciendo', variant: 'default' },
  completed: { label: 'Completada', variant: 'outline' },
  archived: { label: 'Archivada', variant: 'secondary' },
};

export default function Outbound() {
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const { data: campaigns, isLoading: loadingCampaigns } = useOutboundCampaigns();
  const { data: stats, isLoading: loadingStats } = useOutboundStats();
  const deleteCampaign = useDeleteCampaign();

  const handleCampaignClick = (campaign: OutboundCampaign) => {
    navigate(`/outbound/${campaign.id}`);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Eliminar esta campaña y todos sus prospectos?')) {
      deleteCampaign.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Outbound Sectorial</h1>
          <p className="text-muted-foreground">
            Descubre y prospecta contactos por sector con Apollo
          </p>
        </div>
        <Button onClick={() => setIsDrawerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Campaña
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Campañas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalCampaigns || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Search className="h-3.5 w-3.5" />
              Descubiertos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalProspects?.toLocaleString() || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              Enriquecidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalEnriched?.toLocaleString() || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Import className="h-3.5 w-3.5" />
              Importados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalImported?.toLocaleString() || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.activeCampaigns || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Zap className="h-3.5 w-3.5" />
              Créditos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.creditsUsed?.toLocaleString() || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campañas</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCampaigns ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !campaigns || campaigns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay campañas todavía</p>
              <p className="text-sm">Crea tu primera campaña de outbound sectorial</p>
              <Button className="mt-4" onClick={() => setIsDrawerOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Campaña
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Encontrados</TableHead>
                  <TableHead className="text-right">Enriquecidos</TableHead>
                  <TableHead className="text-right">Importados</TableHead>
                  <TableHead>Creada</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow 
                    key={campaign.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleCampaignClick(campaign)}
                  >
                    <TableCell className="font-medium">
                      {campaign.name}
                      {campaign.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {campaign.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {campaign.sector_name ? (
                        <Badge variant="outline">{campaign.sector_name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_CONFIG[campaign.status]?.variant || 'secondary'}>
                        {STATUS_CONFIG[campaign.status]?.label || campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {campaign.total_found.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {campaign.total_enriched.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {campaign.total_imported.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(campaign.created_at), { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleCampaignClick(campaign);
                          }}>
                            <Search className="mr-2 h-4 w-4" />
                            Ver prospectos
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Archive
                          }}>
                            <Archive className="mr-2 h-4 w-4" />
                            Archivar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={(e) => handleDelete(campaign.id, e)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Drawer */}
      <NuevaCampanaDrawer 
        open={isDrawerOpen} 
        onOpenChange={setIsDrawerOpen}
        onSuccess={(campaignId) => {
          setIsDrawerOpen(false);
          navigate(`/outbound/${campaignId}`);
        }}
      />
    </div>
  );
}
