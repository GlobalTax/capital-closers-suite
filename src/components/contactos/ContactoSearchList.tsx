import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Building2 } from "lucide-react";
import type { Contacto } from "@/types";
import { cn } from "@/lib/utils";

interface ContactoSearchListProps {
  contactos: Contacto[];
  selectedId?: string;
  onSelect: (contacto: Contacto) => void;
}

export function ContactoSearchList({ contactos, selectedId, onSelect }: ContactoSearchListProps) {
  const getInitials = (nombre?: string, apellidos?: string) => {
    const n = nombre?.charAt(0) || '';
    const a = apellidos?.charAt(0) || '';
    return (n + a).toUpperCase() || '?';
  };

  if (contactos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No se encontraron contactos</p>
        <p className="text-sm mt-1">Intenta con otro término de búsqueda</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
      {contactos.map((contacto) => (
        <button
          key={contacto.id}
          onClick={() => onSelect(contacto)}
          className={cn(
            "w-full flex gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors text-left",
            selectedId === contacto.id && "bg-accent border-primary"
          )}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={contacto.avatar} />
            <AvatarFallback>
              {getInitials(contacto.nombre, contacto.apellidos)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-medium truncate">
                  {contacto.nombre} {contacto.apellidos}
                </h4>
                {contacto.cargo && (
                  <p className="text-sm text-muted-foreground truncate">{contacto.cargo}</p>
                )}
              </div>
              {selectedId === contacto.id && (
                <Badge variant="default" className="bg-primary shrink-0">Seleccionado</Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
              {contacto.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {contacto.email}
                </span>
              )}
              {contacto.telefono && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {contacto.telefono}
                </span>
              )}
              {contacto.empresa_principal && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {contacto.empresa_principal.nombre}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
