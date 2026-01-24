import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, FileText, Factory, MapPin, Globe, Hash, ExternalLink } from "lucide-react";
import { InlineEditText } from "@/components/shared/InlineEdit";
import { normalizeCIF } from "@/lib/validation/validators";
import { isValidCIF, VALIDATION_MESSAGES } from "@/lib/validation/regex";
import { toast } from "sonner";
import type { Empresa } from "@/types";

interface EmpresaIdentificacionCardProps {
  empresa: Empresa;
  onUpdate?: (empresaId: string, field: string, value: string | null) => Promise<void>;
}

interface EditableInfoItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  field: string;
  value: string | null | undefined;
  empresaId: string;
  onUpdate?: (empresaId: string, field: string, value: string | null) => Promise<void>;
  isLink?: boolean;
  placeholder?: string;
}

function EditableInfoItem({ 
  icon: Icon, 
  label, 
  field,
  value, 
  empresaId,
  onUpdate,
  isLink,
  placeholder = "Añadir..."
}: EditableInfoItemProps) {
  const handleSave = async (newValue: string) => {
    if (!onUpdate) return;
    
    // Trim y convertir vacío a null
    const trimmedValue = newValue.trim();
    let valueToSave: string | null = trimmedValue || null;
    
    // Tratamiento especial para CIF
    if (field === 'cif' && trimmedValue) {
      const normalized = normalizeCIF(trimmedValue);
      
      if (!isValidCIF(normalized)) {
        toast.error(VALIDATION_MESSAGES.cif);
        throw new Error('CIF inválido'); // Cancela el guardado
      }
      
      valueToSave = normalized;
    }
    
    await onUpdate(empresaId, field, valueToSave);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      {onUpdate ? (
        <InlineEditText
          value={value || ""}
          onSave={handleSave}
          placeholder={placeholder}
          className="text-sm font-medium"
        />
      ) : isLink && value ? (
        <a 
          href={value.startsWith('http') ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className="text-sm font-medium">{value || "—"}</p>
      )}
    </div>
  );
}

export function EmpresaIdentificacionCard({ empresa, onUpdate }: EmpresaIdentificacionCardProps) {
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
          <EditableInfoItem 
            icon={Building2} 
            label="Razón Social" 
            field="nombre"
            value={empresa.nombre}
            empresaId={empresa.id}
            onUpdate={onUpdate}
          />
          
          <EditableInfoItem 
            icon={FileText} 
            label="CIF" 
            field="cif"
            value={empresa.cif}
            empresaId={empresa.id}
            onUpdate={onUpdate}
          />
          
          <EditableInfoItem 
            icon={Factory} 
            label="Sector" 
            field="sector"
            value={empresa.sector}
            empresaId={empresa.id}
            onUpdate={onUpdate}
          />
          
          <EditableInfoItem 
            icon={MapPin} 
            label="Ubicación" 
            field="ubicacion"
            value={empresa.ubicacion}
            empresaId={empresa.id}
            onUpdate={onUpdate}
          />
          
          <EditableInfoItem 
            icon={Globe} 
            label="Web" 
            field="sitio_web"
            value={empresa.sitio_web}
            empresaId={empresa.id}
            onUpdate={onUpdate}
            isLink
          />
          
          <EditableInfoItem 
            icon={Hash} 
            label="CNAE" 
            field="cnae_codigo"
            value={empresa.cnae_codigo}
            empresaId={empresa.id}
            onUpdate={onUpdate}
          />
        </div>
        
        {/* Descripción editable */}
        <div className="pt-3 border-t space-y-1">
          <p className="text-xs text-muted-foreground">Descripción</p>
          {onUpdate ? (
            <InlineEditText
              value={empresa.descripcion || ""}
              onSave={async (newValue) => {
                await onUpdate(empresa.id, "descripcion", newValue || null);
              }}
              placeholder="Añadir descripción..."
              className="text-sm text-muted-foreground leading-relaxed"
            />
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {empresa.descripcion || "Sin descripción"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}