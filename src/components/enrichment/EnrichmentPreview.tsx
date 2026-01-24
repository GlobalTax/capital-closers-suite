/**
 * Preview component for enriched company data
 */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  ExternalLink,
  FileText,
  Target,
  Info,
  CheckCircle2,
  MapPin,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnrichedData, SectorConfidence } from "@/types/enrichment";

interface EnrichmentPreviewProps {
  data: EnrichedData;
}

const confidenceColors: Record<SectorConfidence, string> = {
  alto: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
  medio: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800",
  bajo: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
};

export function EnrichmentPreview({ data }: EnrichmentPreviewProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-primary" />
        <h3 className="font-medium">Datos de Empresa</h3>
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      </div>

      <Card className="p-4 space-y-4">
        {/* Name and sector */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h4 className="text-lg font-semibold">{data.nombre}</h4>
            <div className="flex flex-wrap gap-2">
              {data.sector && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {data.sector}
                </Badge>
              )}
              {data.sector_confianza && (
                <Badge
                  variant="outline"
                  className={cn("text-xs", confidenceColors[data.sector_confianza])}
                >
                  Confianza: {data.sector_confianza}
                </Badge>
              )}
            </div>
          </div>
          {data.sitio_web && (
            <a
              href={data.sitio_web}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1 text-sm shrink-0"
            >
              <ExternalLink className="h-3 w-3" />
              Web
            </a>
          )}
        </div>

        {/* Description */}
        {data.descripcion && (
          <p className="text-sm text-muted-foreground">{data.descripcion}</p>
        )}

        {/* Activities */}
        {data.actividades_destacadas && data.actividades_destacadas.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Actividades destacadas
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 pl-5">
              {data.actividades_destacadas.map((act, idx) => (
                <li key={idx} className="list-disc">{act}</li>
              ))}
            </ul>
          </div>
        )}

        {/* CNAE */}
        {data.cnae_codigo && (
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="font-mono">
              CNAE: {data.cnae_codigo}
            </Badge>
            {data.cnae_descripcion && (
              <span className="text-muted-foreground">{data.cnae_descripcion}</span>
            )}
          </div>
        )}

        {/* Metadata row */}
        <div className="flex flex-wrap gap-4 text-sm">
          {data.empleados && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              ~{data.empleados.toLocaleString('es-ES')} empleados
            </span>
          )}
          {data.ubicacion && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {data.ubicacion}
            </span>
          )}
        </div>

        {/* Social links */}
        {(data.linkedin || data.twitter) && (
          <div className="flex gap-3 pt-2">
            {data.linkedin && (
              <a
                href={data.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                LinkedIn
              </a>
            )}
            {data.twitter && (
              <a
                href={data.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-sky-500 hover:underline"
              >
                Twitter
              </a>
            )}
          </div>
        )}

        <Separator />

        {/* Source attribution */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-3 w-3" />
          <span>Fuente:</span>
          <a
            href={data.fuente}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline truncate max-w-[300px]"
          >
            {data.fuente}
          </a>
        </div>
      </Card>
    </div>
  );
}
