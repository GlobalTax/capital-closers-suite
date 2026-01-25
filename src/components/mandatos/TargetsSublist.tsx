import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Eye, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TargetEmpresa {
  id: string;
  empresa_id: string;
  pipeline_stage_target?: string | null;
  ultimo_contacto?: string | null;
  empresa?: {
    id: string;
    nombre: string;
    sector?: string | null;
  } | null;
}

interface TargetsSublistProps {
  targets: TargetEmpresa[];
}

const getPipelineColor = (stage: string | null | undefined) => {
  switch (stage) {
    case 'oferta':
    case 'cierre':
      return 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400';
    case 'due_diligence':
    case 'info_recibida':
      return 'border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400';
    case 'nda_firmado':
    case 'contactada':
      return 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400';
    default:
      return 'border-muted-foreground/30 bg-muted/30 text-muted-foreground';
  }
};

const formatPipelineStage = (stage: string | null | undefined) => {
  if (!stage) return 'Identificada';
  return stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

export function TargetsSublist({ targets }: TargetsSublistProps) {
  const navigate = useNavigate();

  if (targets.length === 0) {
    return (
      <div className="py-4 px-6 text-sm text-muted-foreground italic">
        No hay targets en cartera
      </div>
    );
  }

  const handleViewTarget = (empresaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/empresas/${empresaId}`);
  };

  return (
    <div className="py-3 px-4 bg-muted/20">
      <div className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <Target className="w-3.5 h-3.5 text-orange-500" />
        Empresas en Cartera ({targets.length})
      </div>
      <div className="rounded-md border border-border/50 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs h-8">Empresa</TableHead>
              <TableHead className="text-xs h-8">Sector</TableHead>
              <TableHead className="text-xs h-8">Etapa Pipeline</TableHead>
              <TableHead className="text-xs h-8">Último Contacto</TableHead>
              <TableHead className="text-xs h-8 w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {targets.map((t) => (
              <TableRow key={t.id} className="hover:bg-muted/30">
                <TableCell className="py-2 text-sm font-medium">
                  {t.empresa?.nombre || '—'}
                </TableCell>
                <TableCell className="py-2 text-sm text-muted-foreground">
                  {t.empresa?.sector || '—'}
                </TableCell>
                <TableCell className="py-2">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[10px] px-2 py-0 h-5 font-normal",
                      getPipelineColor(t.pipeline_stage_target)
                    )}
                  >
                    {formatPipelineStage(t.pipeline_stage_target)}
                  </Badge>
                </TableCell>
                <TableCell className="py-2 text-sm text-muted-foreground">
                  {t.ultimo_contacto 
                    ? format(new Date(t.ultimo_contacto), "d MMM yyyy", { locale: es })
                    : '—'
                  }
                </TableCell>
                <TableCell className="py-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0"
                    onClick={(e) => handleViewTarget(t.empresa_id, e)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
