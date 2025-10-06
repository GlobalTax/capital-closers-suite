import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableEnhanced } from "@/components/shared/DataTableEnhanced";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchContactos } from "@/services/contactos";
import { supabase } from "@/integrations/supabase/client";
import type { Contacto } from "@/types";
import { toast } from "sonner";
import { NuevoContactoDrawer } from "@/components/contactos/NuevoContactoDrawer";
import { Mail, MessageCircle, Linkedin, Users, UserCheck, UserPlus, TrendingUp, Activity } from "lucide-react";
import { format, isAfter, subDays } from "date-fns";
import { es } from "date-fns/locale";

export default function Contactos() {
  const navigate = useNavigate();
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [interaccionesCounts, setInteraccionesCounts] = useState<Record<string, { total: number; pendientes: number }>>({});

  useEffect(() => {
    cargarContactos();
  }, []);

  const cargarContactos = async () => {
    setLoading(true);
    try {
      const data = await fetchContactos();
      setContactos(data);
      
      // Cargar contadores de interacciones del último mes
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data: interacciones } = await supabase
        .from('interacciones')
        .select('contacto_id, siguiente_accion, fecha_siguiente_accion')
        .gte('fecha', thirtyDaysAgo);
      
      if (interacciones) {
        const counts: Record<string, { total: number; pendientes: number }> = {};
        interacciones.forEach((int) => {
          if (int.contacto_id) {
            if (!counts[int.contacto_id]) {
              counts[int.contacto_id] = { total: 0, pendientes: 0 };
            }
            counts[int.contacto_id].total++;
            if (int.siguiente_accion && int.fecha_siguiente_accion) {
              counts[int.contacto_id].pendientes++;
            }
          }
        });
        setInteraccionesCounts(counts);
      }
    } catch (error) {
      console.error("Error cargando contactos:", error);
      toast.error("Error al cargar los contactos");
    } finally {
      setLoading(false);
    }
  };

  // Calcular KPIs
  const kpis = useMemo(() => {
    const total = contactos.length;
    const activos = contactos.filter(c => 
      c.updated_at && isAfter(new Date(c.updated_at), subDays(new Date(), 30))
    ).length;
    const nuevos = contactos.filter(c => 
      c.created_at && isAfter(new Date(c.created_at), subDays(new Date(), 30))
    ).length;
    
    return { total, activos, nuevos };
  }, [contactos]);

  const columns = [
    {
      key: "nombre",
      label: "Contacto",
      sortable: true,
      filterable: true,
      render: (_value: string, row: Contacto) => (
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {row.nombre.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.nombre} {row.apellidos || ""}</p>
            {row.cargo && <p className="text-xs text-muted-foreground">{row.cargo}</p>}
          </div>
        </div>
      ),
    },
    { 
      key: "empresa_principal", 
      label: "Empresa", 
      sortable: true, 
      filterable: true,
      render: (_value: any, row: Contacto) => (
        <div>
          {row.empresa_principal?.nombre || <span className="text-muted-foreground">-</span>}
        </div>
      )
    },
    { 
      key: "email", 
      label: "Email", 
      filterable: true,
      render: (value: string) => (
        <span className="text-sm">{value}</span>
      )
    },
    { 
      key: "telefono", 
      label: "Teléfono",
      render: (value: string) => value || <span className="text-muted-foreground">-</span>
    },
    {
      key: "updated_at",
      label: "Última Actividad",
      sortable: true,
      render: (_value: string, row: Contacto) => {
        if (!row.updated_at) return <span className="text-muted-foreground">-</span>;
        
        const isRecent = isAfter(new Date(row.updated_at), subDays(new Date(), 7));
        const interaccionesData = interaccionesCounts[row.id];
        
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {format(new Date(row.updated_at), "d MMM yyyy", { locale: es })}
              </span>
              {isRecent && (
                <Badge variant="secondary" className="text-xs">Reciente</Badge>
              )}
            </div>
            {interaccionesData && interaccionesData.total > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {interaccionesData.total} interacción{interaccionesData.total !== 1 ? 'es' : ''} (30d)
                </Badge>
                {interaccionesData.pendientes > 0 && (
                  <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs">
                    ⏰ {interaccionesData.pendientes} pendiente{interaccionesData.pendientes !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: "actions",
      label: "Acciones",
      render: (_value: any, row: Contacto) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {row.email && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              asChild
            >
              <a href={`mailto:${row.email}`} title="Enviar email">
                <Mail className="h-4 w-4" />
              </a>
            </Button>
          )}
          {row.telefono && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              asChild
            >
              <a href={`https://wa.me/${row.telefono.replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer" title="WhatsApp">
                <MessageCircle className="h-4 w-4" />
              </a>
            </Button>
          )}
          {row.linkedin && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              asChild
            >
              <a href={row.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contactos"
        description="Gestiona tus contactos profesionales"
        actionLabel="Nuevo Contacto"
        onAction={() => setDrawerOpen(true)}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Contactos</p>
                <p className="text-3xl font-bold mt-2">{kpis.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Activos (30 días)</p>
                <p className="text-3xl font-bold mt-2">{kpis.activos}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpis.total > 0 ? Math.round((kpis.activos / kpis.total) * 100) : 0}% del total
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-secondary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nuevos (30 días)</p>
                <p className="text-3xl font-bold mt-2">{kpis.nuevos}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <p className="text-xs text-green-500">Crecimiento</p>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTableEnhanced
        columns={columns}
        data={contactos}
        loading={loading}
        onRowClick={(row) => navigate(`/contactos/${row.id}`)}
      />

      <NuevoContactoDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSuccess={cargarContactos}
      />
    </div>
  );
}
