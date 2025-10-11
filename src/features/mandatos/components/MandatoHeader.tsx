import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  MoreVertical, 
  ShoppingCart, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  MapPin, 
  Calendar as CalendarIcon 
} from "lucide-react";
import type { Mandato } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MandatoHeaderProps {
  mandato: Mandato;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MandatoHeader({ mandato, onEdit, onDelete }: MandatoHeaderProps) {
  const navigate = useNavigate();

  const getEstadoConfig = (estado: string) => {
    const configs: Record<string, { variant: any; icon: any; className: string }> = {
      prospecto: { 
        variant: "outline", 
        icon: AlertCircle, 
        className: "bg-yellow-50 text-yellow-700 border-yellow-300" 
      },
      activo: { 
        variant: "default", 
        icon: CheckCircle, 
        className: "bg-green-50 text-green-700 border-green-300" 
      },
      en_negociacion: { 
        variant: "secondary", 
        icon: AlertCircle, 
        className: "bg-orange-50 text-orange-700 border-orange-300" 
      },
      cerrado: { 
        variant: "outline", 
        icon: CheckCircle, 
        className: "bg-blue-50 text-blue-700 border-blue-300" 
      },
      cancelado: { 
        variant: "destructive", 
        icon: XCircle, 
        className: "bg-red-50 text-red-700 border-red-300" 
      },
    };
    return configs[estado] || configs.activo;
  };

  const getTipoConfig = (tipo: string) => {
    return tipo === 'compra' 
      ? { icon: ShoppingCart, color: 'bg-purple-100 text-purple-600', label: 'Compra' }
      : { icon: TrendingUp, color: 'bg-green-100 text-green-600', label: 'Venta' };
  };

  const estadoConfig = getEstadoConfig(mandato.estado);
  const tipoConfig = getTipoConfig(mandato.tipo);
  const EstadoIcon = estadoConfig.icon;
  const TipoIcon = tipoConfig.icon;

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/mandatos">Mandatos</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{mandato.empresa_principal?.nombre || "Mandato"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header Principal */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Icono Grande Colorido */}
          <div className={cn("p-4 rounded-full", tipoConfig.color)}>
            <TipoIcon className="h-8 w-8" />
          </div>

          <div>
            {/* Título con Badges */}
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">
                {mandato.empresa_principal?.nombre || "Mandato"}
              </h1>
              <Badge variant={estadoConfig.variant} className={estadoConfig.className}>
                <EstadoIcon className="h-3 w-3 mr-1" />
                {mandato.estado.replace('_', ' ')}
              </Badge>
            </div>

            {/* Subtítulo con Información Clave */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <TipoIcon className="h-4 w-4" />
                Mandato de {tipoConfig.label}
              </span>
              <span>•</span>
              {mandato.fecha_inicio && (
                <>
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    Inicio: {format(new Date(mandato.fecha_inicio), "d MMM yyyy", { locale: es })}
                  </span>
                  <span>•</span>
                </>
              )}
              {mandato.empresa_principal?.ubicacion && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {mandato.empresa_principal.ubicacion}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Menú de Acciones */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
