import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  User,
  Plus,
  Link2,
  Mail,
  Phone,
  Linkedin,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import type { Contacto } from "@/types";

interface TargetContactosListProps {
  contactos: Contacto[];
  empresaId: string;
  onAddContacto: () => void;
  onImportFromLink: () => void;
  onInteraccion: (contactoId: string) => void;
  onAsociarExistente?: () => void;
}

export function TargetContactosList({
  contactos,
  empresaId,
  onAddContacto,
  onImportFromLink,
  onInteraccion,
  onAsociarExistente,
}: TargetContactosListProps) {
  const navigate = useNavigate();

  if (contactos.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <User className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            No hay contactos asociados a este target
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={onAddContacto}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Nuevo
            </Button>
            {onAsociarExistente && (
              <Button variant="outline" size="sm" onClick={onAsociarExistente}>
                <User className="h-3.5 w-3.5 mr-1" />
                Asociar Existente
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onImportFromLink}>
              <Link2 className="h-3.5 w-3.5 mr-1" />
              Importar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Contactos ({contactos.length})</h4>
        <div className="flex items-center gap-1">
          {onAsociarExistente && (
            <Button variant="ghost" size="sm" onClick={onAsociarExistente} title="Asociar contacto existente">
              <User className="h-3.5 w-3.5 mr-1" />
              Asociar
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onImportFromLink}>
            <Link2 className="h-3.5 w-3.5 mr-1" />
            Link
          </Button>
          <Button variant="outline" size="sm" onClick={onAddContacto}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Nuevo
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {contactos.map((contacto) => (
          <Card
            key={contacto.id}
            className="p-3 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => navigate(`/contactos/${contacto.id}`)}
                    className="font-medium text-sm hover:text-primary hover:underline transition-colors"
                  >
                    {contacto.nombre} {contacto.apellidos}
                  </button>
                  {contacto.cargo && (
                    <Badge variant="secondary" className="text-xs">
                      {contacto.cargo}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                  {contacto.email && (
                    <a
                      href={`mailto:${contacto.email}`}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Mail className="h-3 w-3" />
                      <span className="truncate max-w-[150px]">{contacto.email}</span>
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
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onInteraccion(contacto.id)}
                  title="Registrar interacción"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => navigate(`/contactos/${contacto.id}`)}
                  title="Ver ficha"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
