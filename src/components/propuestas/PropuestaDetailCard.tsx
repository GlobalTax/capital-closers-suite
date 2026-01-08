import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Check, X, Copy, FileText, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { PropuestaEstadoBadge } from "./PropuestaEstadoBadge";
import { ESTRUCTURA_HONORARIOS_LABELS } from "@/lib/constants";
import type { PropuestaHonorarios } from "@/types/propuestas";

interface PropuestaDetailCardProps {
  propuesta: PropuestaHonorarios;
  onAceptar?: () => void;
  onRechazar?: () => void;
  onNuevaVersion?: () => void;
  isLoading?: boolean;
}

export function PropuestaDetailCard({
  propuesta,
  onAceptar,
  onRechazar,
  onNuevaVersion,
  isLoading,
}: PropuestaDetailCardProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);

  const formatDate = (date: string) =>
    format(parseISO(date), "d 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {propuesta.titulo}
              <span className="text-muted-foreground font-normal text-sm">
                v{propuesta.version}
              </span>
            </CardTitle>
            <PropuestaEstadoBadge
              estado={propuesta.estado}
              fechaVencimiento={propuesta.fecha_vencimiento}
            />
          </div>
          <div className="text-right">
            <p className="text-2xl font-medium">{formatCurrency(propuesta.importe_total)}</p>
            {propuesta.estructura && (
              <p className="text-sm text-muted-foreground">
                {ESTRUCTURA_HONORARIOS_LABELS[propuesta.estructura]}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {propuesta.descripcion && (
          <div>
            <h4 className="text-sm font-medium mb-1">Alcance</h4>
            <p className="text-sm text-muted-foreground">{propuesta.descripcion}</p>
          </div>
        )}

        {propuesta.desglose && propuesta.desglose.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Desglose</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {propuesta.desglose.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.concepto}</TableCell>
                    <TableCell className="text-muted-foreground">{item.descripcion || "-"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.importe)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(propuesta.importe_total)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}

        {propuesta.condiciones_pago && (
          <div>
            <h4 className="text-sm font-medium mb-1">Condiciones de pago</h4>
            <p className="text-sm text-muted-foreground">{propuesta.condiciones_pago}</p>
          </div>
        )}

        <Separator />

        <div className="grid grid-cols-2 gap-4 text-sm">
          {propuesta.fecha_emision && (
            <div>
              <span className="text-muted-foreground">Fecha emisión: </span>
              <span>{formatDate(propuesta.fecha_emision)}</span>
            </div>
          )}
          {propuesta.fecha_vencimiento && (
            <div>
              <span className="text-muted-foreground">Válida hasta: </span>
              <span>{formatDate(propuesta.fecha_vencimiento)}</span>
            </div>
          )}
          {propuesta.fecha_respuesta && (
            <div>
              <span className="text-muted-foreground">
                {propuesta.estado === "aceptada" ? "Aceptada: " : "Rechazada: "}
              </span>
              <span>{formatDate(propuesta.fecha_respuesta)}</span>
            </div>
          )}
        </div>

        {propuesta.motivo_rechazo && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Motivo del rechazo</p>
              <p className="text-sm text-muted-foreground">{propuesta.motivo_rechazo}</p>
            </div>
          </div>
        )}

        {propuesta.notas_internas && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-1">Notas internas</p>
            <p className="text-sm">{propuesta.notas_internas}</p>
          </div>
        )}

        {/* Action buttons based on state */}
        {propuesta.estado === "enviada" && (onAceptar || onRechazar) && (
          <div className="flex gap-2 pt-2">
            {onAceptar && (
              <Button onClick={onAceptar} disabled={isLoading} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Marcar aceptada
              </Button>
            )}
            {onRechazar && (
              <Button variant="outline" onClick={onRechazar} disabled={isLoading} className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Marcar rechazada
              </Button>
            )}
          </div>
        )}

        {propuesta.estado === "rechazada" && onNuevaVersion && (
          <Button variant="outline" onClick={onNuevaVersion} disabled={isLoading} className="w-full">
            <Copy className="h-4 w-4 mr-2" />
            Crear nueva versión
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
