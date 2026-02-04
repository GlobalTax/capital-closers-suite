import { Building2, Users, Briefcase, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CorporateBuyersKPIs as KPIsType } from "@/services/corporateBuyers.service";
import { getBuyerTypeLabel } from "@/types/corporateBuyers";

interface CorporateBuyersKPIsProps {
  kpis: KPIsType | undefined;
  isLoading: boolean;
}

export function CorporateBuyersKPIs({ kpis, isLoading }: CorporateBuyersKPIsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Compradores",
      value: kpis?.total || 0,
      icon: Building2,
      color: "text-blue-500",
    },
    {
      label: "Corporativos",
      value: kpis?.byType?.corporate || 0,
      icon: Briefcase,
      color: "text-emerald-500",
    },
    {
      label: "Holdings",
      value: kpis?.byType?.holding || 0,
      icon: TrendingUp,
      color: "text-purple-500",
    },
    {
      label: "Family Offices",
      value: kpis?.byType?.family_office || 0,
      icon: Users,
      color: "text-amber-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <card.icon className={`w-4 h-4 ${card.color}`} />
              <span>{card.label}</span>
            </div>
            <p className="text-2xl font-semibold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
