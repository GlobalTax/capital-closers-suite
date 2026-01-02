import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFinancialStatements } from "@/hooks/useFinancialStatements";
import type { FinancialStatement } from "@/types/financials";

const schema = z.object({
  year: z.coerce.number().min(2000).max(2100),
  is_audited: z.boolean().default(false),
  // PyG
  revenue: z.coerce.number().nullable().optional(),
  other_income: z.coerce.number().nullable().optional(),
  cost_of_sales: z.coerce.number().nullable().optional(),
  personnel_expenses: z.coerce.number().nullable().optional(),
  other_operating_expenses: z.coerce.number().nullable().optional(),
  ebitda: z.coerce.number().nullable().optional(),
  depreciation_amortization: z.coerce.number().nullable().optional(),
  financial_result: z.coerce.number().nullable().optional(),
  taxes: z.coerce.number().nullable().optional(),
  net_income: z.coerce.number().nullable().optional(),
  // Balance Activo
  intangible_assets: z.coerce.number().nullable().optional(),
  tangible_assets: z.coerce.number().nullable().optional(),
  financial_assets: z.coerce.number().nullable().optional(),
  inventories: z.coerce.number().nullable().optional(),
  trade_receivables: z.coerce.number().nullable().optional(),
  cash_equivalents: z.coerce.number().nullable().optional(),
  other_current_assets: z.coerce.number().nullable().optional(),
  // Balance Pasivo
  share_capital: z.coerce.number().nullable().optional(),
  reserves: z.coerce.number().nullable().optional(),
  retained_earnings: z.coerce.number().nullable().optional(),
  long_term_debt: z.coerce.number().nullable().optional(),
  other_non_current_liabilities: z.coerce.number().nullable().optional(),
  short_term_debt: z.coerce.number().nullable().optional(),
  trade_payables: z.coerce.number().nullable().optional(),
  other_current_liabilities: z.coerce.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

type FormData = z.infer<typeof schema>;

interface AddFinancialYearDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId: string;
  existingStatement?: FinancialStatement | null;
}

export function AddFinancialYearDrawer({
  open,
  onOpenChange,
  empresaId,
  existingStatement
}: AddFinancialYearDrawerProps) {
  const { createStatement, updateStatement, isCreating, isUpdating } = useFinancialStatements(empresaId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      year: new Date().getFullYear() - 1,
      is_audited: false,
    }
  });

  useEffect(() => {
    if (existingStatement) {
      Object.entries(existingStatement).forEach(([key, value]) => {
        if (key in schema.shape) {
          setValue(key as keyof FormData, value);
        }
      });
    } else {
      reset({ year: new Date().getFullYear() - 1, is_audited: false });
    }
  }, [existingStatement, setValue, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const cleanData = Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v === '' ? null : v])
      );

      if (existingStatement) {
        await updateStatement({ id: existingStatement.id, updates: cleanData });
      } else {
        await createStatement({
          ...cleanData,
          empresa_id: empresaId,
          period_type: 'annual',
          source: 'manual',
          currency: 'EUR',
        } as any);
      }
      onOpenChange(false);
      reset();
    } catch (error) {
      // Error handled by hook
    }
  };

  const NumberField = ({ name, label }: { name: keyof FormData; label: string }) => (
    <div className="space-y-1">
      <Label htmlFor={name} className="text-xs">{label}</Label>
      <Input
        id={name}
        type="number"
        step="0.01"
        {...register(name)}
        placeholder="0"
        className="h-8"
      />
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            {existingStatement ? `Editar ${existingStatement.year}` : 'Añadir Estado Financiero'}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 h-[calc(100vh-120px)]">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-6 pb-6">
              {/* Header fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="year">Año Fiscal *</Label>
                  <Input
                    id="year"
                    type="number"
                    {...register('year')}
                    disabled={!!existingStatement}
                  />
                  {errors.year && <p className="text-xs text-destructive">{errors.year.message}</p>}
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    id="is_audited"
                    checked={watch('is_audited')}
                    onCheckedChange={(v) => setValue('is_audited', v)}
                  />
                  <Label htmlFor="is_audited">Auditado</Label>
                </div>
              </div>

              <Tabs defaultValue="pyg">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="pyg">PyG</TabsTrigger>
                  <TabsTrigger value="balance">Balance</TabsTrigger>
                </TabsList>

                <TabsContent value="pyg" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Ingresos</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <NumberField name="revenue" label="Cifra de Negocios" />
                      <NumberField name="other_income" label="Otros Ingresos" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Costes</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <NumberField name="cost_of_sales" label="Coste de Ventas" />
                      <NumberField name="personnel_expenses" label="Gastos de Personal" />
                      <NumberField name="other_operating_expenses" label="Otros Gastos Operativos" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Resultados</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <NumberField name="ebitda" label="EBITDA" />
                      <NumberField name="depreciation_amortization" label="Amortizaciones" />
                      <NumberField name="financial_result" label="Resultado Financiero" />
                      <NumberField name="taxes" label="Impuestos" />
                      <NumberField name="net_income" label="Beneficio Neto" />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="balance" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Activo No Corriente</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <NumberField name="intangible_assets" label="Inmovilizado Intangible" />
                      <NumberField name="tangible_assets" label="Inmovilizado Material" />
                      <NumberField name="financial_assets" label="Inversiones Financieras L/P" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Activo Corriente</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <NumberField name="inventories" label="Existencias" />
                      <NumberField name="trade_receivables" label="Deudores Comerciales" />
                      <NumberField name="cash_equivalents" label="Efectivo" />
                      <NumberField name="other_current_assets" label="Otros Activos Corrientes" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Patrimonio Neto</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <NumberField name="share_capital" label="Capital Social" />
                      <NumberField name="reserves" label="Reservas" />
                      <NumberField name="retained_earnings" label="Resultados Anteriores" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Pasivo No Corriente</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <NumberField name="long_term_debt" label="Deuda L/P" />
                      <NumberField name="other_non_current_liabilities" label="Otros Pasivos L/P" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Pasivo Corriente</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <NumberField name="short_term_debt" label="Deuda C/P" />
                      <NumberField name="trade_payables" label="Acreedores Comerciales" />
                      <NumberField name="other_current_liabilities" label="Otros Pasivos C/P" />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-1">
                <Label htmlFor="notes">Notas</Label>
                <Input id="notes" {...register('notes')} placeholder="Notas adicionales..." />
              </div>

              <Button type="submit" className="w-full" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? 'Guardando...' : existingStatement ? 'Guardar Cambios' : 'Crear Estado Financiero'}
              </Button>
            </div>
          </ScrollArea>
        </form>
      </SheetContent>
    </Sheet>
  );
}
