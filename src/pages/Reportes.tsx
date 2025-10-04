import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, FileText } from "lucide-react";

export default function Reportes() {
  const stats = [
    {
      title: "Mandatos Activos",
      value: "12",
      change: "+3 este mes",
      icon: FileText,
      color: "text-blue-600",
    },
    {
      title: "Tasa de Conversión",
      value: "68%",
      change: "+5% vs mes anterior",
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "Clientes Nuevos",
      value: "8",
      change: "+2 esta semana",
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Ciclo Medio",
      value: "45 días",
      change: "-3 días vs mes anterior",
      icon: BarChart3,
      color: "text-orange-600",
    },
  ];

  const mandatosPorEstado = [
    { estado: "Prospección", cantidad: 5, color: "bg-blue-500" },
    { estado: "Negociación", cantidad: 3, color: "bg-yellow-500" },
    { estado: "Due Diligence", cantidad: 2, color: "bg-purple-500" },
    { estado: "Cierre", cantidad: 2, color: "bg-green-500" },
  ];

  return (
    <div>
      <PageHeader
        title="Reportes"
        description="Análisis y métricas del negocio"
      />

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
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.change}
                </p>
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
                        width: `${(item.cantidad / 12) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conversión de Leads a Clientes */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline de Conversión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {[
                { label: "Leads", value: 25, color: "bg-blue-500" },
                { label: "Cualificados", value: 18, color: "bg-purple-500" },
                { label: "Propuestas", value: 12, color: "bg-yellow-500" },
                { label: "Clientes", value: 8, color: "bg-green-500" },
              ].map((stage, index) => (
                <div key={stage.label} className="flex-1 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-16 h-16 rounded-full ${stage.color} flex items-center justify-center text-white font-bold text-xl`}
                    >
                      {stage.value}
                    </div>
                    <span className="text-sm font-medium">{stage.label}</span>
                    {index < 3 && (
                      <div className="hidden md:block absolute w-full h-0.5 bg-muted top-8 left-1/2 -z-10" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
