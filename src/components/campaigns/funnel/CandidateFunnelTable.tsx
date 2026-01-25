// ============================================
// CANDIDATE FUNNEL TABLE
// Table view with phase columns and actions
// ============================================

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Check, 
  Clock, 
  Minus, 
  MoreHorizontal, 
  Search,
  DollarSign,
  Mail,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  type CandidateWithFunnelStage, 
  type CandidateFunnelStage,
  FUNNEL_STAGES,
  getStageConfig 
} from '@/types/candidateFunnel';

interface CandidateFunnelTableProps {
  recipients: CandidateWithFunnelStage[];
  segments: string[];
  stageFilter: CandidateFunnelStage | null;
  segmentFilter: string | null;
  searchQuery: string;
  onStageFilterChange: (stage: CandidateFunnelStage | null) => void;
  onSegmentFilterChange: (segment: string | null) => void;
  onSearchChange: (query: string) => void;
  onRegisterIOI: (recipient: CandidateWithFunnelStage) => void;
  onSendNDA?: (recipientIds: string[]) => void;
  isLoading?: boolean;
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  return formatDistanceToNow(new Date(dateStr), { addSuffix: false, locale: es });
}

function PhaseCell({ 
  completed, 
  timestamp, 
  isPending 
}: { 
  completed: boolean; 
  timestamp: string | null;
  isPending?: boolean;
}) {
  if (completed && timestamp) {
    return (
      <div className="flex flex-col items-center">
        <Check className="w-4 h-4 text-green-600" />
        <span className="text-[10px] text-muted-foreground">
          {formatRelativeTime(timestamp)}
        </span>
      </div>
    );
  }
  
  if (isPending) {
    return (
      <div className="flex flex-col items-center">
        <Clock className="w-4 h-4 text-amber-500" />
        <span className="text-[10px] text-muted-foreground">pend.</span>
      </div>
    );
  }
  
  return <Minus className="w-4 h-4 text-muted-foreground/30" />;
}

function IOICell({ amount, timestamp }: { amount: number | null; timestamp: string | null }) {
  if (amount && timestamp) {
    return (
      <div className="flex flex-col items-center">
        <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-700">
          €{(amount / 1000000).toFixed(1)}M
        </Badge>
      </div>
    );
  }
  return <Minus className="w-4 h-4 text-muted-foreground/30" />;
}

export function CandidateFunnelTable({
  recipients,
  segments,
  stageFilter,
  segmentFilter,
  searchQuery,
  onStageFilterChange,
  onSegmentFilterChange,
  onSearchChange,
  onRegisterIOI,
  onSendNDA,
  isLoading,
}: CandidateFunnelTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === recipients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(recipients.map(r => r.id)));
    }
  };

  const selectedRecipients = recipients.filter(r => selectedIds.has(r.id));

  // Determine next pending action for each recipient
  const getNextPending = (r: CandidateWithFunnelStage): CandidateFunnelStage | null => {
    if (!r.teaser_opened_at && r.teaser_sent_at) return 'teaser_opened';
    if (!r.nda_sent_at && r.teaser_opened_at) return 'nda_sent';
    if (!r.nda_signed_at && r.nda_sent_at) return 'nda_signed';
    if (!r.cim_opened_at && r.nda_signed_at) return 'cim_opened';
    if (!r.ioi_received_at && r.cim_opened_at) return 'ioi_received';
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o empresa..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select 
          value={stageFilter || 'all'} 
          onValueChange={(v) => onStageFilterChange(v === 'all' ? null : v as CandidateFunnelStage)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas las etapas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las etapas</SelectItem>
            {FUNNEL_STAGES.map(stage => (
              <SelectItem key={stage.key} value={stage.key}>
                {stage.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {segments.length > 0 && (
          <Select 
            value={segmentFilter || 'all'} 
            onValueChange={(v) => onSegmentFilterChange(v === 'all' ? null : v)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Segmento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {segments.map(seg => (
                <SelectItem key={seg} value={seg}>{seg}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} seleccionados
          </span>
          {onSendNDA && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onSendNDA(Array.from(selectedIds))}
            >
              <Mail className="w-4 h-4 mr-1" />
              Enviar NDA
            </Button>
          )}
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              const recipient = selectedRecipients[0];
              if (recipient) onRegisterIOI(recipient);
            }}
            disabled={selectedIds.size !== 1}
          >
            <DollarSign className="w-4 h-4 mr-1" />
            Registrar IOI
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox 
                  checked={selectedIds.size === recipients.length && recipients.length > 0}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className="min-w-[180px]">Candidato</TableHead>
              <TableHead className="text-center w-20">Teaser</TableHead>
              <TableHead className="text-center w-20">Abierto</TableHead>
              <TableHead className="text-center w-20">NDA Env.</TableHead>
              <TableHead className="text-center w-20">NDA Firm.</TableHead>
              <TableHead className="text-center w-20">CIM</TableHead>
              <TableHead className="text-center w-24">IOI</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={9}>
                    <div className="h-12 bg-muted animate-pulse rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : recipients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No hay candidatos que coincidan con los filtros
                </TableCell>
              </TableRow>
            ) : (
              recipients.map((recipient) => {
                const nextPending = getNextPending(recipient);
                const stageConfig = getStageConfig(recipient.current_stage);
                
                return (
                  <TableRow key={recipient.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.has(recipient.id)}
                        onCheckedChange={() => toggleSelection(recipient.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{recipient.nombre || recipient.email}</span>
                        {recipient.empresa_nombre && (
                          <span className="text-xs text-muted-foreground">
                            {recipient.empresa_nombre}
                          </span>
                        )}
                        {recipient.segment && (
                          <Badge variant="outline" className="w-fit mt-1 text-[10px]">
                            {recipient.segment}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <PhaseCell 
                        completed={!!recipient.teaser_sent_at} 
                        timestamp={recipient.teaser_sent_at}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <PhaseCell 
                        completed={!!recipient.teaser_opened_at} 
                        timestamp={recipient.teaser_opened_at}
                        isPending={nextPending === 'teaser_opened'}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <PhaseCell 
                        completed={!!recipient.nda_sent_at} 
                        timestamp={recipient.nda_sent_at}
                        isPending={nextPending === 'nda_sent'}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <PhaseCell 
                        completed={!!recipient.nda_signed_at} 
                        timestamp={recipient.nda_signed_at}
                        isPending={nextPending === 'nda_signed'}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <PhaseCell 
                        completed={!!recipient.cim_opened_at} 
                        timestamp={recipient.cim_opened_at}
                        isPending={nextPending === 'cim_opened'}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <IOICell 
                        amount={recipient.ioi_amount} 
                        timestamp={recipient.ioi_received_at} 
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onRegisterIOI(recipient)}>
                            <DollarSign className="w-4 h-4 mr-2" />
                            Registrar IOI
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="w-4 h-4 mr-2" />
                            Ver historial
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Mostrando {recipients.length} candidatos
        </span>
      </div>
    </div>
  );
}
