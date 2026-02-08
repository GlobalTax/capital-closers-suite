import { useAuth } from "@/hooks/useAuth";
import { AccessDenied } from "@/components/auth/AccessDenied";
import { useBillingForecast } from "@/hooks/useBillingForecast";
import { BillingForecastTable } from "@/components/billing-forecast/BillingForecastTable";
import { BillingForecastSummary } from "@/components/billing-forecast/BillingForecastSummary";
import { Loader2, TrendingUp } from "lucide-react";

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
            Forecast de honorarios por mandato y fecha estimada de cierre
          </p>
        </div>
      </div>

      <BillingForecastSummary mandatos={data ?? []} />
      <BillingForecastTable mandatos={data ?? []} />
    </div>
  );
}
