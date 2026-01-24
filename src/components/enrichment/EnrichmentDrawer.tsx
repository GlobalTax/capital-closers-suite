/**
 * EnrichmentDrawer - Multi-step drawer for company enrichment
 * Replaces the old EnrichFromWebDrawer with full duplicate detection and merge support
 */

import { useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Globe,
  Search,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEnrichment } from "@/hooks/useEnrichment";
import { EnrichmentLoadingPhases } from "./EnrichmentLoadingPhases";
import { EnrichmentMergePanel } from "./EnrichmentMergePanel";
import { EnrichmentPreview } from "./EnrichmentPreview";
import { ContactDedupeList } from "./ContactDedupeList";
import { EnrichmentConfirmation } from "./EnrichmentConfirmation";
import type { EnrichmentDrawerProps, InputMethod, MergeResult } from "@/types/enrichment";

export function EnrichmentDrawer({
  open,
  onOpenChange,
  mandatoId,
  empresaId,
  initialName = "",
  initialUrl = "",
  onSuccess,
}: EnrichmentDrawerProps) {
  const {
    state,
    updateState,
    setStep,
    setMergeMode,
    toggleFieldSelection,
    toggleContactSelection,
    reset,
    search,
    apply,
  } = useEnrichment({
    onSuccess,
    mandatoId,
    empresaId,
  });

  // Initialize with provided values
  useEffect(() => {
    if (open) {
      if (initialUrl) {
        updateState({ inputMethod: 'url', inputValue: initialUrl });
      } else if (initialName) {
        updateState({ inputMethod: 'name', inputValue: initialName });
      }
    }
  }, [open, initialName, initialUrl, updateState]);

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleSearch = () => {
    if (!state.inputValue.trim()) {
      toast.error("Introduce un nombre o URL");
      return;
    }
    if (state.inputMethod === 'name' && state.inputValue.trim().length < 3) {
      toast.error("El nombre debe tener al menos 3 caracteres");
      return;
    }
    search();
  };

  const handleManualUrlSearch = () => {
    if (!state.manualUrl.trim()) {
      toast.error("Introduce una URL");
      return;
    }
    search(state.manualUrl);
  };

  const handleApply = async () => {
    const result = await apply();
    if (result) {
      const message = result.action === 'created'
        ? `${state.enrichedData?.nombre} creada con ${result.contactsCreated} contacto(s)`
        : result.action === 'updated'
        ? `${state.enrichedData?.nombre} actualizada (${result.fieldsUpdated.length} campos)`
        : 'No se realizaron cambios';
      toast.success(message);
      handleClose();
    }
  };

  const canProceed = state.enrichedData != null && (
    state.mergeMode === 'create_new' ||
    !state.duplicateDetected ||
    state.existingEmpresa != null
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Enriquecer empresa
          </DrawerTitle>
          <DrawerDescription>
            {state.step === 'input' && 'Introduce un nombre o URL para extraer datos de fuentes fiables'}
            {state.step === 'loading' && 'Buscando y analizando información...'}
            {state.step === 'preview' && 'Revisa los datos encontrados antes de guardar'}
            {state.step === 'confirm' && 'Aplicando cambios...'}
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-6 pb-4">
            {/* ========== STEP: INPUT ========== */}
            {state.step === 'input' && (
              <>
                {/* Input Method Selection */}
                <RadioGroup
                  value={state.inputMethod}
                  onValueChange={(v) => updateState({ inputMethod: v as InputMethod })}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="name" id="method-name" />
                    <Label htmlFor="method-name" className="cursor-pointer flex items-center gap-1.5">
                      <Building2 className="h-4 w-4" />
                      Por nombre
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="url" id="method-url" />
                    <Label htmlFor="method-url" className="cursor-pointer flex items-center gap-1.5">
                      <Link2 className="h-4 w-4" />
                      Por URL
                    </Label>
                  </div>
                </RadioGroup>

                {/* Search Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder={state.inputMethod === 'url' ? "https://empresite.eleconomista.es/..." : "Nombre de la empresa..."}
                    value={state.inputValue}
                    onChange={(e) => updateState({ inputValue: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} disabled={!state.inputValue.trim()}>
                    <Search className="w-4 h-4 mr-2" />
                    Buscar
                  </Button>
                </div>

                {/* Manual URL Fallback */}
                {state.requireManualUrl && (
                  <Card className="p-4 border-amber-500/30 bg-amber-500/5">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-3">
                        <div>
                          <p className="font-medium text-amber-700 dark:text-amber-400">
                            No se encontró información automáticamente
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Introduce la URL directa de la empresa o su ficha en Empresite
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="https://empresite.eleconomista.es/..."
                            value={state.manualUrl}
                            onChange={(e) => updateState({ manualUrl: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && handleManualUrlSearch()}
                            className="flex-1"
                          />
                          <Button
                            variant="secondary"
                            onClick={handleManualUrlSearch}
                            disabled={!state.manualUrl}
                          >
                            Buscar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Error */}
                {state.error && !state.requireManualUrl && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p className="text-sm">{state.error}</p>
                  </div>
                )}
              </>
            )}

            {/* ========== STEP: LOADING ========== */}
            {state.step === 'loading' && state.loadingPhase && (
              <EnrichmentLoadingPhases currentPhase={state.loadingPhase} />
            )}

            {/* ========== STEP: PREVIEW ========== */}
            {state.step === 'preview' && state.enrichedData && (
              <>
                {/* Duplicate detected - Show merge panel */}
                {state.duplicateDetected && state.existingEmpresa ? (
                  <EnrichmentMergePanel
                    existing={state.existingEmpresa}
                    incoming={state.enrichedData}
                    mode={state.mergeMode}
                    matchType={state.matchType}
                    onModeChange={setMergeMode}
                    fieldSelections={state.fieldSelections}
                    onFieldToggle={toggleFieldSelection}
                  />
                ) : (
                  <EnrichmentPreview data={state.enrichedData} />
                )}

                <Separator />

                {/* Contacts */}
                <ContactDedupeList
                  contacts={state.contactsToImport}
                  onToggle={toggleContactSelection}
                />
              </>
            )}

            {/* ========== STEP: CONFIRM ========== */}
            {state.step === 'confirm' && state.enrichedData && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-muted-foreground">Aplicando cambios...</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <DrawerFooter className="flex-row justify-between gap-2">
          {state.step === 'input' && (
            <>
              <DrawerClose asChild>
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
              </DrawerClose>
              <div /> {/* Spacer */}
            </>
          )}

          {state.step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('input')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <Button onClick={handleApply} disabled={!canProceed}>
                <Check className="h-4 w-4 mr-2" />
                {state.duplicateDetected && state.mergeMode !== 'create_new'
                  ? 'Actualizar empresa'
                  : 'Crear target'}
              </Button>
            </>
          )}

          {state.step === 'loading' && (
            <Button variant="outline" onClick={() => setStep('input')}>
              Cancelar
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// Re-export for convenience
export { type EnrichmentDrawerProps, type MergeResult } from "@/types/enrichment";
