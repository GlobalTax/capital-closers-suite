import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, FileText } from "lucide-react";
import { fetchMandatos, fetchClientes, fetchTargets } from "@/services/api";
import type { Mandato } from "@/types";

export default function Reportes() {
  const [mandatos, setMandatos] = useState<Mandato[]>([]);
  const [totalClientes, setTotalClientes] = useState(0);
  const [totalTargets, setTotalTargets] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [mandatosData, clientesData, targetsData] = await Promise.all([
        fetchMandatos(),
        fetchClientes(),
        fetchTargets(),
      ]);
      setMandatos(mandatosData);
      setTotalClientes(clientesData.length);
      setTotalTargets(targetsData.length);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const mandatosActivos = mandatos.filter(
    (m) => m.estado !== "Cerrado" && m.estado !== "Cancelado"
  ).length;

  const mandatosCerrados = mandatos.filter((m) => m.estado === "Cerrado").length;
  const tasaConversion =
    mandatos.length > 0
      ? Math.round((mandatosCerrados / mandatos.length) * 100)
      : 0;

  const mandatosPorEstado = [
    {
      estado: "En progreso",
      cantidad: mandatos.filter((m) => m.estado === "En progreso").length,
      color: "bg-blue-500",
    },
    {
      estado: "Negociación",
      cantidad: mandatos.filter((m) => m.estado === "Negociación").length,
      color: "bg-yellow-500",
    },
    {
      estado: "Due Diligence",
      cantidad: mandatos.filter((m) => m.estado === "Due Diligence").length,
      color: "bg-purple-500",
    },
    {
      estado: "Cerrado",
      cantidad: mandatos.filter((m) => m.estado === "Cerrado").length,
      color: "bg-green-500",
    },
  ];

  const stats = [
    {
      title: "Mandatos Activos",
      value: mandatosActivos.toString(),
      change: `${mandatos.length} total`,
      icon: FileText,
      color: "text-primary",
    },
    {
      title: "Tasa de Conversión",
      value: `${tasaConversion}%`,
      change: `${mandatosCerrados} cerrados`,
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "Clientes Activos",
      value: totalClientes.toString(),
      change: "En sistema",
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Empresas Target",
      value: totalTargets.toString(),
      change: "Prospección",
      icon: BarChart3,
      color: "text-orange-600",
    },
  ];

  if (loading) {
    return (
      <div>
        <PageHeader title="Reportes" description="Análisis y métricas del negocio" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Reportes" description="Análisis y métricas del negocio" />

      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gráfico de Mandatos por Estado */}
        <Card>
          <CardHeader>
            <CardTitle>Mandatos por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mandatosPorEstado.map((item) => (
                <div key={item.estado} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.estado}</span>
                    <span className="text-muted-foreground">
                      {item.cantidad} mandatos
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full transition-all`}
                      style={{
                        width: `${
                          mandatos.length > 0
                            ? (item.cantidad / mandatos.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pipeline de Conversión */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline de Conversión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              {[
                { label: "Targets", value: totalTargets, color: "bg-blue-500" },
                {
                  label: "En Progreso",
                  value: mandatos.filter((m) => m.estado === "En progreso").length,
                  color: "bg-purple-500",
                },
                {
                  label: "Negociación",
                  value: mandatos.filter((m) => m.estado === "Negociación").length,
                  color: "bg-yellow-500",
                },
                { label: "Cerrados", value: mandatosCerrados, color: "bg-green-500" },
              ].map((stage, index) => (
                <div key={stage.label} className="flex-1 text-center relative">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-16 h-16 rounded-full ${stage.color} flex items-center justify-center text-white font-bold text-xl`}
                    >
                      {stage.value}
                    </div>
                    <span className="text-sm font-medium">{stage.label}</span>
                  </div>
                  {index < 3 && (
                    <div className="hidden md:block absolute w-full h-0.5 bg-muted top-8 left-1/2 -z-10" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
