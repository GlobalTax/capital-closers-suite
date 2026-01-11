import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { InteraccionTimeline } from "./InteraccionTimeline";
import {
  Building2,
  Users,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Mail,
  Phone,
  Linkedin,
  Calendar,
  DollarSign,
  Plus,
  Link2,
  User,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Interaccion } from "@/services/interacciones";
import type { Empresa, Contacto } from "@/types";

interface TargetCardProps {
  empresa: Empresa;
  interacciones: Interaccion[];
  contactos: Contacto[];
  isLoadingInteracciones: boolean;
  isLoadingContactos: boolean;
  mandatoId: string;
  onAddContacto: (empresaId: string) => void;
  onImportFromLink: (empresaId: string) => void;
  onInteraccionUpdate: () => void;
}

export function TargetCard({
  empresa,
  interacciones,
  contactos,
  isLoadingInteracciones,
  isLoadingContactos,
  mandatoId,
  onAddContacto,
  onImportFromLink,
  onInteraccionUpdate,
}: TargetCardProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<"contactos" | "timeline" | null>(null);

  const lastInteraccion = interacciones[0];
  const lastInteraccionDate = lastInteraccion
    ? formatDistanceToNow(new Date(lastInteraccion.fecha), { addSuffix: true, locale: es })
    : null;

  const formatCurrency = (value: number | undefined) => {
    if (!value) return null;
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `€${(value / 1000).toFixed(0)}K`;
    }
    return `€${value}`;
  };

  const handleToggleSection = (section: "contactos" | "timeline") => {
    if (activeSection === section) {
      setActiveSection(null);
      setIsExpanded(false);
    } else {
      setActiveSection(section);
      setIsExpanded(true);
    }
  };

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => navigate(`/empresas/${empresa.id}`)}
                  className="text-base font-medium hover:text-primary hover:underline transition-colors text-left truncate"
                >
                  {empresa.nombre}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => navigate(`/empresas/${empresa.id}`)}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                {empresa.sector && <span>{empresa.sector}</span>}
                {empresa.sector && (empresa.facturacion || empresa.revenue) && (
                  <span>•</span>
                )}
                {(empresa.facturacion || empresa.revenue) && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {formatCurrency(empresa.facturacion || empresa.revenue)}
                  </span>
                )}
                {empresa.empleados && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {empresa.empleados} empleados
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className="text-xs whitespace-nowrap">
              <MessageSquare className="h-3 w-3 mr-1" />
              {interacciones.length}
            </Badge>
            <Badge variant="outline" className="text-xs whitespace-nowrap">
              <User className="h-3 w-3 mr-1" />
              {contactos.length}
            </Badge>
            {lastInteraccionDate && (
              <Badge variant="secondary" className="text-xs whitespace-nowrap hidden sm:inline-flex">
                <Calendar className="h-3 w-3 mr-1" />
                {lastInteraccionDate}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Actions Bar */}
      <div className="px-6 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={activeSection === "contactos" ? "default" : "outline"}
            size="sm"
            onClick={() => handleToggleSection("contactos")}
          >
            <Users className="h-4 w-4 mr-1" />
            Contactos
            {activeSection === "contactos" ? (
              <ChevronUp className="h-3 w-3 ml-1" />
            ) : (
              <ChevronDown className="h-3 w-3 ml-1" />
            )}
          </Button>
          <Button
            variant={activeSection === "timeline" ? "default" : "outline"}
            size="sm"
            onClick={() => handleToggleSection("timeline")}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Timeline
            {activeSection === "timeline" ? (
              <ChevronUp className="h-3 w-3 ml-1" />
            ) : (
              <ChevronDown className="h-3 w-3 ml-1" />
            )}
          </Button>
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddContacto(empresa.id)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Contacto
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onImportFromLink(empresa.id)}
            title="Importar desde Apollo.io o LinkedIn"
          >
            <Link2 className="h-4 w-4 mr-1" />
            Link
          </Button>
        </div>
      </div>

      {/* Collapsible Content */}
      <Collapsible open={isExpanded}>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <Separator className="mb-4" />

            {/* Contactos Section */}
            {activeSection === "contactos" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Contactos asociados</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddContacto(empresa.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Añadir
                  </Button>
                </div>

                {isLoadingContactos ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : contactos.length === 0 ? (
                  <div className="text-center py-6 bg-muted/30 rounded-lg">
                    <User className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No hay contactos asociados
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAddContacto(empresa.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Añadir contacto
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onImportFromLink(empresa.id)}
                      >
                        <Link2 className="h-3 w-3 mr-1" />
                        Importar desde Link
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {contactos.map((contacto) => (
                      <div
                        key={contacto.id}
                        className="p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => navigate(`/contactos/${contacto.id}`)}
                                className="font-medium hover:text-primary hover:underline transition-colors"
                              >
                                {contacto.nombre} {contacto.apellidos}
                              </button>
                              {contacto.cargo && (
                                <Badge variant="secondary" className="text-xs">
                                  {contacto.cargo}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground flex-wrap">
                              {contacto.email && (
                                <a
                                  href={`mailto:${contacto.email}`}
                                  className="flex items-center gap-1 hover:text-primary transition-colors"
                                >
                                  <Mail className="h-3 w-3" />
                                  <span className="truncate max-w-[180px]">
                                    {contacto.email}
                                  </span>
                                </a>
                              )}
                              {contacto.telefono && (
                                <a
                                  href={`tel:${contacto.telefono}`}
                                  className="flex items-center gap-1 hover:text-primary transition-colors"
                                >
                                  <Phone className="h-3 w-3" />
                                  {contacto.telefono}
                                </a>
                              )}
                              {contacto.linkedin && (
                                <a
                                  href={contacto.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 hover:text-primary transition-colors"
                                >
                                  <Linkedin className="h-3 w-3" />
                                  LinkedIn
                                </a>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={() => navigate(`/contactos/${contacto.id}`)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Timeline Section */}
            {activeSection === "timeline" && (
              <InteraccionTimeline
                interacciones={interacciones}
                empresaId={empresa.id}
                mandatoId={mandatoId}
                onUpdate={onInteraccionUpdate}
              />
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
