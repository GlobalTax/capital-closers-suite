import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, TrendingUp, Users, Percent, DollarSign } from "lucide-react";

interface FinancialDisclosureConfigProps {
  showRevenueRange: boolean;
  showEbitdaRange: boolean;
  showEbitdaMargin: boolean;
  showEmployees: boolean;
  showExactFinancials: boolean;
  customRevenueMin: number | null;
  customRevenueMax: number | null;
  customEbitdaMin: number | null;
  customEbitdaMax: number | null;
  onToggleChange: (field: string, value: boolean) => void;
  onRangeChange: (field: string, value: number | null) => void;
}

export function FinancialDisclosureConfig({
  showRevenueRange,
  showEbitdaRange,
  showEbitdaMargin,
  showEmployees,
  showExactFinancials,
  customRevenueMin,
  customRevenueMax,
  customEbitdaMin,
  customEbitdaMax,
  onToggleChange,
  onRangeChange,
}: FinancialDisclosureConfigProps) {
  const DisclosureItem = ({
    icon: Icon,
    label,
    description,
    field,
    checked,
    tier,
  }: {
    icon: React.ElementType;
    label: string;
    description: string;
    field: string;
    checked: boolean;
    tier: 1 | 2;
  }) => (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${checked ? 'bg-primary/10' : 'bg-muted'}`}>
          <Icon className={`w-4 h-4 ${checked ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{label}</span>
            <Badge variant="outline" className={`text-[10px] px-1.5 ${tier === 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              Tier {tier}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {checked ? (
          <Eye className="w-4 h-4 text-emerald-500" />
        ) : (
          <EyeOff className="w-4 h-4 text-muted-foreground" />
        )}
        <Switch
          checked={checked}
          onCheckedChange={(value) => onToggleChange(field, value)}
        />
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Configuración de Visibilidad Financiera
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Decide qué datos se comparten con los candidatos en cada fase
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tier 1 - Teaser */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-emerald-500">Tier 1</Badge>
            <span className="text-sm font-medium">Teaser (Pre-NDA)</span>
          </div>
          
          <DisclosureItem
            icon={TrendingUp}
            label="Rango de Facturación"
            description="Ej: €10M - €15M"
            field="show_revenue_range"
            checked={showRevenueRange}
            tier={1}
          />
          
          <DisclosureItem
            icon={DollarSign}
            label="Rango de EBITDA"
            description="Ej: €1.5M - €2M"
            field="show_ebitda_range"
            checked={showEbitdaRange}
            tier={1}
          />
          
          <DisclosureItem
            icon={Percent}
            label="Margen EBITDA"
            description="Ej: 15-20%"
            field="show_ebitda_margin"
            checked={showEbitdaMargin}
            tier={1}
          />
          
          <DisclosureItem
            icon={Users}
            label="Número de Empleados"
            description="Ej: 75-100"
            field="show_employees"
            checked={showEmployees}
            tier={1}
          />
        </div>

        {/* Tier 2 - Post-NDA */}
        <div className="space-y-1 pt-2">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-amber-500">Tier 2</Badge>
            <span className="text-sm font-medium">Post-NDA</span>
          </div>
          
          <DisclosureItem
            icon={DollarSign}
            label="Datos Financieros Exactos"
            description="Cifras exactas de facturación y EBITDA"
            field="show_exact_financials"
            checked={showExactFinancials}
            tier={2}
          />
        </div>

        {/* Custom ranges */}
        {(showRevenueRange || showEbitdaRange) && (
          <div className="pt-4 border-t space-y-4">
            <Label className="text-sm font-medium">Rangos Personalizados (opcional)</Label>
            <p className="text-xs text-muted-foreground -mt-2">
              Si no defines rangos, se calcularán automáticamente desde los datos financieros
            </p>

            {showRevenueRange && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Facturación Mín (€)</Label>
                  <Input
                    type="number"
                    placeholder="Ej: 10000000"
                    value={customRevenueMin ?? ''}
                    onChange={(e) => onRangeChange('custom_revenue_min', e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Facturación Máx (€)</Label>
                  <Input
                    type="number"
                    placeholder="Ej: 15000000"
                    value={customRevenueMax ?? ''}
                    onChange={(e) => onRangeChange('custom_revenue_max', e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
              </div>
            )}

            {showEbitdaRange && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">EBITDA Mín (€)</Label>
                  <Input
                    type="number"
                    placeholder="Ej: 1500000"
                    value={customEbitdaMin ?? ''}
                    onChange={(e) => onRangeChange('custom_ebitda_min', e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">EBITDA Máx (€)</Label>
                  <Input
                    type="number"
                    placeholder="Ej: 2000000"
                    value={customEbitdaMax ?? ''}
                    onChange={(e) => onRangeChange('custom_ebitda_max', e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
