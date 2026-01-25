// ============================================
// CANDIDATE FUNNEL PANEL
// Complete panel with chart, table, and kanban views
// ============================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LayoutList, LayoutGrid, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCandidateFunnel } from '@/hooks/useCandidateFunnel';
import { type CandidateFunnelStage, type CandidateWithFunnelStage } from '@/types/candidateFunnel';
import { CandidateFunnelChart } from './CandidateFunnelChart';
import { CandidateFunnelTable } from './CandidateFunnelTable';
import { CandidateFunnelKanban } from './CandidateFunnelKanban';
import { RegisterIOIDialog } from './RegisterIOIDialog';

interface CandidateFunnelPanelProps {
  campaignId: string;
}

export function CandidateFunnelPanel({ campaignId }: CandidateFunnelPanelProps) {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [stageFilter, setStageFilter] = useState<CandidateFunnelStage | null>(null);
  const [segmentFilter, setSegmentFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ioiDialogOpen, setIoiDialogOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<CandidateWithFunnelStage | null>(null);

  const {
    stats,
    recipients,
    recipientsByStage,
    segments,
    isLoading,
    isStatsLoading,
    isRecipientsLoading,
    registerIOI,
    isRegisteringIOI,
    refetch,
  } = useCandidateFunnel({
    campaignId,
    stageFilter,
    segmentFilter,
    searchQuery,
  });

  const handleStageClick = (stage: CandidateFunnelStage) => {
    // Toggle filter if clicking same stage
    setStageFilter(current => current === stage ? null : stage);
  };

  const handleRegisterIOI = (recipient: CandidateWithFunnelStage) => {
    setSelectedRecipient(recipient);
    setIoiDialogOpen(true);
  };

  const handleIOISubmit = async (recipientId: string, amount: number, notes?: string) => {
    await registerIOI({ recipientId, amount, notes });
    toast.success('IOI registrado correctamente');
  };

  const handleCardClick = (recipient: CandidateWithFunnelStage) => {
    handleRegisterIOI(recipient);
  };

  if (!campaignId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Selecciona una campaña para ver el funnel
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Funnel Chart */}
      <CandidateFunnelChart 
        stats={stats}
        onStageClick={handleStageClick}
        activeStage={stageFilter}
        isLoading={isStatsLoading}
      />

      {/* View toggle and actions */}
      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'kanban')}>
          <TabsList>
            <TabsTrigger value="table" className="gap-1">
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">Tabla</span>
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-1">
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span className="hidden sm:inline ml-1">Actualizar</span>
        </Button>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'table' ? (
        <CandidateFunnelTable
          recipients={recipients}
          segments={segments}
          stageFilter={stageFilter}
          segmentFilter={segmentFilter}
          searchQuery={searchQuery}
          onStageFilterChange={setStageFilter}
          onSegmentFilterChange={setSegmentFilter}
          onSearchChange={setSearchQuery}
          onRegisterIOI={handleRegisterIOI}
          isLoading={isRecipientsLoading}
        />
      ) : (
        <CandidateFunnelKanban
          recipientsByStage={recipientsByStage}
          onCardClick={handleCardClick}
          isLoading={isRecipientsLoading}
        />
      )}

      {/* Register IOI Dialog */}
      <RegisterIOIDialog
        recipient={selectedRecipient}
        open={ioiDialogOpen}
        onOpenChange={setIoiDialogOpen}
        onSubmit={handleIOISubmit}
        isSubmitting={isRegisteringIOI}
      />
    </div>
  );
}
