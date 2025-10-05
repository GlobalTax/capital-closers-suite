import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Mail, Phone, Building2, StickyNote } from "lucide-react";
import { MandatoContacto } from "@/types";
import { getRolColor } from "@/lib/mandato-utils";

interface ContactosClaveCardProps {
  contactos: MandatoContacto[];
  onAddContacto: () => void;
  loading?: boolean;
}

export function ContactosClaveCard({ contactos, onAddContacto, loading }: ContactosClaveCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getInitials = (nombre?: string, apellidos?: string) => {
    const n = nombre?.charAt(0) || '';
    const a = apellidos?.charAt(0) || '';
    return (n + a).toUpperCase() || '?';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Contactos Clave
        </CardTitle>
        <Button onClick={onAddContacto} size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Añadir Contacto
        </Button>
      </CardHeader>
      <CardContent>
        {contactos.length === 0 ? (
          <div className="text-center py-8">
            <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No hay contactos asociados a este mandato
            </p>
            <Button onClick={onAddContacto} variant="outline" size="sm">
              Añadir primer contacto
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {contactos.map((mc) => (
              <div key={mc.id} className="flex gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={mc.contacto?.avatar} />
                  <AvatarFallback>
                    {getInitials(mc.contacto?.nombre, mc.contacto?.apellidos)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">
                        {mc.contacto?.nombre} {mc.contacto?.apellidos}
                      </h4>
                      {mc.contacto?.cargo && (
                        <p className="text-sm text-muted-foreground">{mc.contacto.cargo}</p>
                      )}
                    </div>
                    <Badge className={getRolColor(mc.rol)}>
                      {mc.rol}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm">
                    {mc.contacto?.email && (
                      <a 
                        href={`mailto:${mc.contacto.email}`}
                        className="flex items-center gap-1 text-muted-foreground hover:text-primary"
                      >
                        <Mail className="h-3 w-3" />
                        {mc.contacto.email}
                      </a>
                    )}
                    {mc.contacto?.telefono && (
                      <a 
                        href={`tel:${mc.contacto.telefono}`}
                        className="flex items-center gap-1 text-muted-foreground hover:text-primary"
                      >
                        <Phone className="h-3 w-3" />
                        {mc.contacto.telefono}
                      </a>
                    )}
                    {mc.contacto?.empresa_principal_id && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span className="text-xs">Empresa asociada</span>
                      </div>
                    )}
                  </div>

                  {mc.notas && (
                    <div className="flex gap-2 mt-2 p-2 bg-muted rounded text-sm">
                      <StickyNote className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">{mc.notas}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
