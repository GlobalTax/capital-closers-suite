import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, FileText, Factory, MapPin, Globe, Hash, ExternalLink } from "lucide-react";
import type { Empresa } from "@/types";

interface EmpresaIdentificacionCardProps {
  empresa: Empresa;
}

interface InfoItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
  isLink?: boolean;
}

function InfoItem({ icon: Icon, label, value, isLink }: InfoItemProps) {
  if (!value) return null;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      {isLink ? (
        <a 
          href={value.startsWith('http') ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className="text-sm font-medium">{value}</p>
      )}
    </div>
  );
}

export function EmpresaIdentificacionCard({ empresa }: EmpresaIdentificacionCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Información de la Empresa
          </CardTitle>
          <Link to={`/empresas/${empresa.id}`}>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5">
              <span className="text-xs">Ver ficha</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <InfoItem 
            icon={Building2} 
            label="Razón Social" 
            value={empresa.nombre} 
          />
          
          <InfoItem 
            icon={FileText} 
            label="CIF" 
            value={empresa.cif} 
          />
          
          <InfoItem 
            icon={Factory} 
            label="Sector" 
            value={empresa.sector} 
          />
          
          <InfoItem 
            icon={MapPin} 
            label="Ubicación" 
            value={empresa.ubicacion} 
          />
          
          {empresa.sitio_web && (
            <InfoItem 
              icon={Globe} 
              label="Web" 
              value={empresa.sitio_web}
              isLink 
            />
          )}
          
          {empresa.cnae_codigo && (
            <InfoItem 
              icon={Hash} 
              label="CNAE" 
              value={empresa.cnae_codigo} 
            />
          )}
        </div>
        
        {empresa.descripcion && (
          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {empresa.descripcion}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
