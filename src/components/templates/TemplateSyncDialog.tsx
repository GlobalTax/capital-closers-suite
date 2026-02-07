import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  countAffectedMandatos,
  syncAdditions,
  syncFullReset,
} from "@/services/checklistTemplates.service";

interface Props {
  tipo: string;
}

export function TemplateSyncDialog({ tipo }: Props) {
  const { adminUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"additions" | "full_reset">("additions");
  const [confirmText, setConfirmText] = useState("");

  const isSuperAdmin = adminUser?.role === "super_admin";
  const tipoLabel = tipo === "venta" ? "Sell-Side" : "Buy-Side";

  const countQuery = useQuery({
    queryKey: ["sync-affected-count", tipo],
    queryFn: () => countAffectedMandatos(tipo),
    enabled: open,
  });

  const syncMutation = useMutation({
    mutationFn: () => (mode === "additions" ? syncAdditions(tipo) : syncFullReset(tipo)),
    onSuccess: (result) => {
      toast({
        title: "Sincronización completada",
        description: `${result.mandatos_updated} mandato(s) actualizados, ${result.tasks_added} tarea(s) añadidas.`,
      });
      setOpen(false);
      setConfirmText("");
    },
    onError: (err: Error) => {
      toast({ title: "Error en sincronización", description: err.message, variant: "destructive" });
    },
  });

  const canExecute =
    mode === "additions" || (mode === "full_reset" && confirmText === "CONFIRMAR");

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-foreground">Sincronizar mandatos existentes</h3>
      <p className="text-xs text-muted-foreground">
        Aplica los cambios de esta plantilla a mandatos {tipoLabel} activos que ya tienen checklist.
      </p>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); setConfirmText(""); setMode("additions"); }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Aplicar a mandatos existentes
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sincronizar plantilla {tipoLabel}</DialogTitle>
            <DialogDescription>
              {countQuery.isLoading ? (
                "Calculando mandatos afectados..."
              ) : (
                <>Se afectarán <strong>{countQuery.data ?? 0}</strong> mandato(s) activos.</>
              )}
            </DialogDescription>
          </DialogHeader>

          <RadioGroup value={mode} onValueChange={(v) => setMode(v as "additions" | "full_reset")}>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <RadioGroupItem value="additions" id="additions" className="mt-0.5" />
              <div>
                <Label htmlFor="additions" className="font-medium cursor-pointer">Solo añadir tareas nuevas</Label>
                <p className="text-xs text-muted-foreground">
                  Añade las tareas que falten sin borrar ni modificar las existentes. Seguro.
                </p>
              </div>
            </div>
            {isSuperAdmin && (
              <div className="flex items-start gap-3 p-3 border rounded-lg border-destructive/30">
                <RadioGroupItem value="full_reset" id="full_reset" className="mt-0.5" />
                <div>
                  <Label htmlFor="full_reset" className="font-medium cursor-pointer text-destructive">
                    Re-sincronizar completo
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Elimina todas las tareas del checklist y las recrea desde la plantilla.
                    Se perderá el progreso (estados, fechas).
                  </p>
                </div>
              </div>
            )}
          </RadioGroup>

          {mode === "full_reset" && (
            <div className="space-y-2 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
              <p className="text-xs text-destructive font-medium">
                Escribe CONFIRMAR para habilitar esta acción:
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="CONFIRMAR"
                className="h-8"
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => syncMutation.mutate()}
              disabled={!canExecute || syncMutation.isPending || countQuery.isLoading}
              variant={mode === "full_reset" ? "destructive" : "default"}
            >
              {syncMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {mode === "additions" ? "Añadir tareas faltantes" : "Re-sincronizar todo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
