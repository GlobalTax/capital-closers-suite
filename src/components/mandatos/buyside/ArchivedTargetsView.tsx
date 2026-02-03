import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Archive, RotateCcw, Building2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MandatoEmpresaBuySide } from "@/types";

interface ArchivedTargetsViewProps {
  targets: MandatoEmpresaBuySide[];
  onUnarchive: (targetId: string) => void;
  onTargetClick: (target: MandatoEmpresaBuySide) => void;
  isUnarchiving?: boolean;
}

export function ArchivedTargetsView({
  targets,
  onUnarchive,
  onTargetClick,
  isUnarchiving,
}: ArchivedTargetsViewProps) {
  const archivedTargets = useMemo(
    () => targets.filter((t) => t.is_archived),
    [targets]
  );

  if (archivedTargets.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Inbox className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No hay targets archivados
          </h3>
          <p className="text-sm text-muted-foreground/70 max-w-sm mx-auto">
            Los targets archivados aparecerán aquí. Puedes archivar targets desde su panel de detalle.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Targets Archivados</CardTitle>
            <Badge variant="secondary" className="ml-2">
              {archivedTargets.length}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Empresa</TableHead>
              <TableHead className="w-[140px]">Sector</TableHead>
              <TableHead className="w-[160px]">Archivado</TableHead>
              <TableHead className="w-[100px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {archivedTargets.map((target) => (
              <TableRow 
                key={target.id}
                className="cursor-pointer"
                onClick={() => onTargetClick(target)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-md bg-muted/50 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate text-foreground/80">
                        {target.empresa?.nombre || "Sin nombre"}
                      </p>
                      {target.empresa?.ubicacion && (
                        <p className="text-xs text-muted-foreground truncate">
                          {target.empresa.ubicacion}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {target.empresa?.sector || "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-sm text-muted-foreground">
                          {target.archived_at
                            ? formatDistanceToNow(new Date(target.archived_at), {
                                addSuffix: true,
                                locale: es,
                              })
                            : "—"}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {target.archived_at
                          ? new Date(target.archived_at).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Fecha no disponible"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-right">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isUnarchiving}
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnarchive(target.id);
                          }}
                          className="h-8 px-2 hover:bg-primary/10 hover:text-primary"
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span className="ml-1.5 hidden sm:inline">Restaurar</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Restaurar al pipeline activo
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
