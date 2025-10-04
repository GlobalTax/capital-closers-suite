import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableEnhanced } from "@/components/shared/DataTableEnhanced";
import { getClienteById, fetchMandatos } from "@/services/api";
import type { Cliente, Mandato } from "@/types";
import { BadgeStatus } from "@/components/shared/BadgeStatus";

export default function ClienteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [mandatos, setMandatos] = useState<Mandato[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const [clienteData, mandatosData] = await Promise.all([
          getClienteById(id),
          fetchMandatos(),
        ]);
        
        setCliente(clienteData);
        if (clienteData) {
          setMandatos(mandatosData.filter(m => m.clienteId === clienteData.id));
        }
      } catch (error) {
        console.error("Error cargando cliente:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!cliente) {
    return <div>Cliente no encontrado</div>;
  }

  const mandatosColumns = [
    { key: "id", label: "ID Mandato" },
    { key: "empresa", label: "Empresa" },
    {
      key: "estado",
      label: "Estado",
      render: (value: string) => <BadgeStatus status={value as any} type="mandato" />,
    },
    { key: "valor", label: "Valor Estimado" },
    { key: "fecha", label: "Fecha Inicio" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clientes")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-4 flex-1">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {cliente.nombre.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-semibold">{cliente.nombre}</h1>
            <p className="text-muted-foreground">{cliente.cargo} en {cliente.empresa}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{cliente.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Teléfono
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{cliente.telefono}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Mandatos Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{cliente.mandatos}</p>
          </CardContent>
        </Card>
      </div>

      {cliente.notas && (
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{cliente.notas}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Mandatos Asociados</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableEnhanced
            columns={mandatosColumns}
            data={mandatos}
            onRowClick={(row) => navigate(`/mandatos/${row.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
