import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { DatosFinancieros } from "@/types";
import { updateEmpresa } from "@/services/empresas";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { useEffect } from "react";

interface DatosFinancierosFormProps {
  targetId: string;
  datosActuales?: DatosFinancieros;
  onUpdate: () => void;
}

export function DatosFinancierosForm({
  targetId,
  datosActuales,
  onUpdate,
}: DatosFinancierosFormProps) {
  const { register, handleSubmit, setValue, watch } = useForm<DatosFinancieros>({
    defaultValues: datosActuales || {},
  });

  const revenue = watch("revenue");
  const ebitda = watch("ebitda");

  // Calcular margen EBITDA automáticamente
  useEffect(() => {
    if (revenue && ebitda && revenue > 0) {
      const margen = (ebitda / revenue) * 100;
      setValue("margenEbitda", Number(margen.toFixed(2)));
    }
  }, [revenue, ebitda, setValue]);

  const onSubmit = async (data: DatosFinancieros) => {
    try {
      // Usar campos individuales en lugar de datos_financieros
      await updateEmpresa(targetId, {
        facturacion: data.revenue,
        ebitda: data.ebitda,
        // Otros campos financieros se pueden añadir según la estructura de la tabla
      } as any);
      toast.success("Datos financieros actualizados correctamente");
      onUpdate();
    } catch (error) {
      toast.error("Error al actualizar datos financieros");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos Financieros</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="revenue">Revenue (€)</Label>
              <Input
                id="revenue"
                type="number"
                step="1"
                {...register("revenue", { valueAsNumber: true })}
                placeholder="Ej: 5200000"
              />
              <p className="text-xs text-muted-foreground">
                Ingresar valor completo en euros
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ebitda">EBITDA (€)</Label>
              <Input
                id="ebitda"
                type="number"
                step="1"
                {...register("ebitda", { valueAsNumber: true })}
                placeholder="Ej: 780000"
              />
              <p className="text-xs text-muted-foreground">
                Earnings Before Interest, Taxes, Depreciation and Amortization
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="margenEbitda">Margen EBITDA (%)</Label>
              <Input
                id="margenEbitda"
                type="number"
                step="0.01"
                {...register("margenEbitda", { valueAsNumber: true })}
                placeholder="Calculado automáticamente"
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Calculado automáticamente: (EBITDA / Revenue) × 100
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deuda">Deuda (€)</Label>
              <Input
                id="deuda"
                type="number"
                step="1"
                {...register("deuda", { valueAsNumber: true })}
                placeholder="Ej: 450000"
              />
              <p className="text-xs text-muted-foreground">
                Deuda financiera total
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capitalCirculante">Capital Circulante (€)</Label>
              <Input
                id="capitalCirculante"
                type="number"
                step="1"
                {...register("capitalCirculante", { valueAsNumber: true })}
                placeholder="Ej: 320000"
              />
              <p className="text-xs text-muted-foreground">
                Activo corriente - Pasivo corriente
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas Financieras</Label>
            <Textarea
              id="notas"
              {...register("notas")}
              placeholder="Observaciones adicionales sobre la situación financiera..."
              rows={4}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              Guardar Datos Financieros
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
