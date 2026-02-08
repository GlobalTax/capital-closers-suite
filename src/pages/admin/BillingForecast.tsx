import { useAuth } from "@/hooks/useAuth";
import { AccessDenied } from "@/components/auth/AccessDenied";
import { useBillingForecast } from "@/hooks/useBillingForecast";
import { BillingForecastTable } from "@/components/billing-forecast/BillingForecastTable";
import { BillingForecastSummary } from "@/components/billing-forecast/BillingForecastSummary";
import { QuarterlyForecastChart } from "@/components/billing-forecast/QuarterlyForecastChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp, BarChart3, Table2 } from "lucide-react";

const ALLOWED_EMAILS = ["lluis@capittal.es", "s.navarro@obn.es"];

export default function BillingForecast() {
  const { user } = useAuth();
  const email = user?.email?.toLowerCase() ?? "";

  if (!ALLOWED_EMAILS.includes(email)) {
    return <AccessDenied message="No tienes acceso a esta sección." />;
  }

  const { data, isLoading } = useBillingForecast();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Previsión de Facturación</h1>
          <p className="text-muted-foreground text-sm">
            Forecast de honorarios por mandato y predicciones trimestrales
          </p>
        </div>
      </div>

      <Tabs defaultValue="forecast" className="space-y-4">
        <TabsList>
          <TabsTrigger value="forecast" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Forecast Trimestral
          </TabsTrigger>
          <TabsTrigger value="detalle" className="gap-1.5">
            <Table2 className="h-4 w-4" />
            Detalle
          </TabsTrigger>
        </TabsList>

        <TabsContent value="forecast">
          <QuarterlyForecastChart mandatos={data ?? []} />
        </TabsContent>

        <TabsContent value="detalle" className="space-y-4">
          <BillingForecastSummary mandatos={data ?? []} />
          <BillingForecastTable mandatos={data ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
