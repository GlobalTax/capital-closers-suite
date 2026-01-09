import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusCell } from "./StatusCell";
import { useUpdateDocStatus } from "@/hooks/usePipelineTracker";
import {
  DOC_STATUS_CONFIG,
  PLATFORM_STATUS_CONFIG,
  type PipelineTrackerItem,
  type MandatoDocTracking,
} from "@/types/pipeline-tracker";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface TrackerTableProps {
  data: PipelineTrackerItem[];
  isLoading?: boolean;
}

const DOC_OPTIONS = [
  { value: 'si', label: 'SÍ' },
  { value: 'no', label: 'NO' },
  { value: 'actualizar', label: 'Actualizar' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'n_a', label: 'N/A' },
];

const PLATFORM_OPTIONS = [
  { value: 'subido', label: 'Subido' },
  { value: 'por_subir', label: 'Por Subir' },
  { value: 'actualizar', label: 'Actualizar' },
  { value: 'n_a', label: 'N/A' },
];

const PIPELINE_STAGE_LABELS: Record<string, { label: string; color: string }> = {
  prospeccion: { label: 'Incoming', color: 'bg-slate-500' },
  contacto_inicial: { label: 'Contacto', color: 'bg-blue-500' },
  propuesta_enviada: { label: 'Propuesta', color: 'bg-indigo-500' },
  loi: { label: 'Go to Market', color: 'bg-violet-500' },
  due_diligence: { label: 'DD', color: 'bg-amber-500' },
  negociacion: { label: 'SPA', color: 'bg-orange-500' },
  cierre: { label: 'Cierre', color: 'bg-emerald-500' },
};

export function TrackerTable({ data, isLoading }: TrackerTableProps) {
  const updateDocStatus = useUpdateDocStatus();

  const handleUpdate = (mandatoId: string, field: keyof MandatoDocTracking, value: string | null) => {
    updateDocStatus.mutate({ mandatoId, field, value });
  };

  const formatCCAADate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    try {
      return format(parseISO(dateStr), 'MMM yy', { locale: es });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <div className="p-8 text-center text-muted-foreground">
          Cargando datos...
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="border rounded-lg">
        <div className="p-8 text-center text-muted-foreground">
          No hay mandatos para mostrar
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[60px] font-semibold text-xs">ID</TableHead>
            <TableHead className="min-w-[140px] font-semibold text-xs">Empresa</TableHead>
            <TableHead className="min-w-[120px] font-semibold text-xs">Proyecto</TableHead>
            <TableHead className="w-[100px] font-semibold text-xs">Estado</TableHead>
            <TableHead className="w-[70px] font-semibold text-xs text-center">Valor.</TableHead>
            <TableHead className="w-[70px] font-semibold text-xs text-center">Teaser</TableHead>
            <TableHead className="w-[80px] font-semibold text-xs text-center">Datapack</TableHead>
            <TableHead className="w-[60px] font-semibold text-xs text-center">IM</TableHead>
            <TableHead className="w-[70px] font-semibold text-xs text-center">Deale</TableHead>
            <TableHead className="w-[80px] font-semibold text-xs text-center">Dealsuite</TableHead>
            <TableHead className="w-[60px] font-semibold text-xs text-center">ARX</TableHead>
            <TableHead className="w-[60px] font-semibold text-xs text-center">ROD</TableHead>
            <TableHead className="w-[70px] font-semibold text-xs text-center">CCAA</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const stageConfig = item.pipeline_stage 
              ? PIPELINE_STAGE_LABELS[item.pipeline_stage] 
              : { label: '-', color: 'bg-muted' };

            return (
              <TableRow key={item.id} className="hover:bg-muted/30">
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {item.codigo || '-'}
                </TableCell>
                <TableCell className="text-sm">
                  <Link 
                    to={`/mandato/${item.id}`}
                    className="font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {item.empresa_nombre || 'Sin empresa'}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.nombre_proyecto || '-'}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${stageConfig.color} text-white`}
                  >
                    {stageConfig.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <StatusCell
                    value={item.doc_valoracion}
                    options={DOC_OPTIONS.filter(o => ['si', 'no', 'pendiente', 'n_a'].includes(o.value))}
                    config={DOC_STATUS_CONFIG}
                    onUpdate={(v) => handleUpdate(item.id, 'doc_valoracion', v)}
                  />
                </TableCell>
                <TableCell>
                  <StatusCell
                    value={item.doc_teaser}
                    options={DOC_OPTIONS.filter(o => ['si', 'no', 'actualizar', 'pendiente'].includes(o.value))}
                    config={DOC_STATUS_CONFIG}
                    onUpdate={(v) => handleUpdate(item.id, 'doc_teaser', v)}
                  />
                </TableCell>
                <TableCell>
                  <StatusCell
                    value={item.doc_datapack}
                    options={DOC_OPTIONS.filter(o => ['si', 'no', 'actualizar', 'pendiente'].includes(o.value))}
                    config={DOC_STATUS_CONFIG}
                    onUpdate={(v) => handleUpdate(item.id, 'doc_datapack', v)}
                  />
                </TableCell>
                <TableCell>
                  <StatusCell
                    value={item.doc_im}
                    options={DOC_OPTIONS}
                    config={DOC_STATUS_CONFIG}
                    onUpdate={(v) => handleUpdate(item.id, 'doc_im', v)}
                  />
                </TableCell>
                <TableCell>
                  <StatusCell
                    value={item.platform_deale}
                    options={PLATFORM_OPTIONS}
                    config={PLATFORM_STATUS_CONFIG}
                    onUpdate={(v) => handleUpdate(item.id, 'platform_deale', v)}
                  />
                </TableCell>
                <TableCell>
                  <StatusCell
                    value={item.platform_dealsuite}
                    options={PLATFORM_OPTIONS}
                    config={PLATFORM_STATUS_CONFIG}
                    onUpdate={(v) => handleUpdate(item.id, 'platform_dealsuite', v)}
                  />
                </TableCell>
                <TableCell>
                  <StatusCell
                    value={item.platform_arx}
                    options={PLATFORM_OPTIONS}
                    config={PLATFORM_STATUS_CONFIG}
                    onUpdate={(v) => handleUpdate(item.id, 'platform_arx', v)}
                  />
                </TableCell>
                <TableCell>
                  <StatusCell
                    value={item.doc_rod}
                    options={DOC_OPTIONS.filter(o => ['si', 'no', 'actualizar', 'pendiente'].includes(o.value))}
                    config={DOC_STATUS_CONFIG}
                    onUpdate={(v) => handleUpdate(item.id, 'doc_rod', v)}
                  />
                </TableCell>
                <TableCell className="text-center text-xs text-muted-foreground">
                  {formatCCAADate(item.ccaa_fecha)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
