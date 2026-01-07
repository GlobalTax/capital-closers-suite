import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { MoreHorizontal, Plus, Eye, Pencil, Trash2, Copy, Send, Check, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PropuestaEstadoBadge } from "./PropuestaEstadoBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import type { PropuestaHonorarios } from "@/types/propuestas";

interface PropuestasTableProps {
  propuestas: PropuestaHonorarios[];
  onNew: () => void;
  onView: (propuesta: PropuestaHonorarios) => void;
  onEdit: (propuesta: PropuestaHonorarios) => void;
  onDelete: (propuesta: PropuestaHonorarios) => void;
  onEnviar: (propuesta: PropuestaHonorarios) => void;
  onAceptar: (propuesta: PropuestaHonorarios) => void;
  onRechazar: (propuesta: PropuestaHonorarios) => void;
  onNuevaVersion: (propuesta: PropuestaHonorarios) => void;
}

export function PropuestasTable({
  propuestas,
  onNew,
  onView,
  onEdit,
  onDelete,
  onEnviar,
  onAceptar,
  onRechazar,
  onNuevaVersion,
}: PropuestasTableProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);

  if (propuestas.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Sin propuestas"
        description="Crea tu primera propuesta de honorarios para este servicio"
        action={
          <Button onClick={onNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva propuesta
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onNew} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nueva propuesta
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Versión</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Importe</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {propuestas.map((propuesta) => (
              <TableRow key={propuesta.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onView(propuesta)}>
                <TableCell className="font-medium">v{propuesta.version}</TableCell>
                <TableCell>{propuesta.titulo}</TableCell>
                <TableCell>
                  <PropuestaEstadoBadge
                    estado={propuesta.estado}
                    fechaVencimiento={propuesta.fecha_vencimiento}
                  />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(propuesta.importe_total)}
                </TableCell>
                <TableCell>
                  {propuesta.fecha_vencimiento
                    ? format(parseISO(propuesta.fecha_vencimiento), "d MMM yyyy", { locale: es })
                    : "-"}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(propuesta)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver detalle
                      </DropdownMenuItem>

                      {propuesta.estado === "borrador" && (
                        <>
                          <DropdownMenuItem onClick={() => onEdit(propuesta)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEnviar(propuesta)}>
                            <Send className="h-4 w-4 mr-2" />
                            Enviar propuesta
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onDelete(propuesta)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </>
                      )}

                      {propuesta.estado === "enviada" && (
                        <>
                          <DropdownMenuItem onClick={() => onAceptar(propuesta)}>
                            <Check className="h-4 w-4 mr-2" />
                            Marcar aceptada
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onRechazar(propuesta)}>
                            <X className="h-4 w-4 mr-2" />
                            Marcar rechazada
                          </DropdownMenuItem>
                        </>
                      )}

                      {propuesta.estado === "rechazada" && (
                        <DropdownMenuItem onClick={() => onNuevaVersion(propuesta)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Crear nueva versión
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
