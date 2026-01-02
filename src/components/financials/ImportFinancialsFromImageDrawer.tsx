import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Camera, Upload, Loader2, Check, AlertCircle } from "lucide-react";
import { useFinancialStatements, useExtractFinancialData } from "@/hooks/useFinancialStatements";
import type { ExtractedFinancialData } from "@/types/financials";

interface ImportFinancialsFromImageDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId: string;
}

export function ImportFinancialsFromImageDrawer({
  open,
  onOpenChange,
  empresaId
}: ImportFinancialsFromImageDrawerProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedFinancialData | null>(null);
  const [editableData, setEditableData] = useState<ExtractedFinancialData | null>(null);

  const { createStatement, isCreating } = useFinancialStatements(empresaId);
  const extractMutation = useExtractFinancialData();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      
      try {
        const result = await extractMutation.mutateAsync(base64);
        if (result.success && result.data) {
          setExtractedData(result.data);
          setEditableData(result.data);
          setStep('preview');
        }
      } catch (error) {
        // Error handled by mutation
      }
    };
    reader.readAsDataURL(file);
  }, [extractMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    disabled: extractMutation.isPending
  });

  const handleSave = async () => {
    if (!editableData) return;

    try {
      await createStatement({
        empresa_id: empresaId,
        year: editableData.year,
        period_type: editableData.period_type as any || 'annual',
        source: 'ai_image',
        currency: 'EUR',
        // PyG
        revenue: editableData.pyg.revenue ?? null,
        other_income: editableData.pyg.other_income ?? null,
        cost_of_sales: editableData.pyg.cost_of_sales ?? null,
        gross_margin: editableData.pyg.gross_margin ?? null,
        personnel_expenses: editableData.pyg.personnel_expenses ?? null,
        other_operating_expenses: editableData.pyg.other_operating_expenses ?? null,
        ebitda: editableData.pyg.ebitda ?? null,
        depreciation_amortization: editableData.pyg.depreciation_amortization ?? null,
        ebit: editableData.pyg.ebit ?? null,
        financial_result: editableData.pyg.financial_result ?? null,
        ebt: editableData.pyg.ebt ?? null,
        taxes: editableData.pyg.taxes ?? null,
        net_income: editableData.pyg.net_income ?? null,
        // Balance
        intangible_assets: editableData.balance.intangible_assets ?? null,
        tangible_assets: editableData.balance.tangible_assets ?? null,
        financial_assets: editableData.balance.financial_assets ?? null,
        inventories: editableData.balance.inventories ?? null,
        trade_receivables: editableData.balance.trade_receivables ?? null,
        cash_equivalents: editableData.balance.cash_equivalents ?? null,
        other_current_assets: editableData.balance.other_current_assets ?? null,
        share_capital: editableData.balance.share_capital ?? null,
        reserves: editableData.balance.reserves ?? null,
        retained_earnings: editableData.balance.retained_earnings ?? null,
        long_term_debt: editableData.balance.long_term_debt ?? null,
        other_non_current_liabilities: editableData.balance.other_non_current_liabilities ?? null,
        short_term_debt: editableData.balance.short_term_debt ?? null,
        trade_payables: editableData.balance.trade_payables ?? null,
        other_current_liabilities: editableData.balance.other_current_liabilities ?? null,
      } as any);
      
      setStep('success');
      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 1500);
    } catch (error) {
      // Error handled by hook
    }
  };

  const resetState = () => {
    setStep('upload');
    setImagePreview(null);
    setExtractedData(null);
    setEditableData(null);
  };

  const handleClose = (open: boolean) => {
    if (!open) resetState();
    onOpenChange(open);
  };

  const updatePygField = (field: string, value: string) => {
    if (!editableData) return;
    setEditableData({
      ...editableData,
      pyg: {
        ...editableData.pyg,
        [field]: value ? parseFloat(value) : null
      }
    });
  };

  const updateBalanceField = (field: string, value: string) => {
    if (!editableData) return;
    setEditableData({
      ...editableData,
      balance: {
        ...editableData.balance,
        [field]: value ? parseFloat(value) : null
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Importar con IA
          </SheetTitle>
          <SheetDescription>
            Sube una imagen de un estado financiero y extraeremos los datos automáticamente
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 h-[calc(100vh-180px)]">
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary'
                } ${extractMutation.isPending ? 'pointer-events-none opacity-50' : ''}`}
              >
                <input {...getInputProps()} />
                {extractMutation.isPending ? (
                  <div className="space-y-4">
                    <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                    <p className="text-muted-foreground">Extrayendo datos con IA...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="font-medium">Arrastra una imagen aquí</p>
                    <p className="text-sm text-muted-foreground mt-1">o haz clic para seleccionar</p>
                    <p className="text-xs text-muted-foreground mt-4">
                      PNG, JPG, JPEG o WebP
                    </p>
                  </>
                )}
              </div>

              {imagePreview && (
                <div className="border rounded-lg p-2">
                  <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded" />
                </div>
              )}

              {extractMutation.isError && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Error al procesar la imagen. Intenta con otra imagen más clara.</span>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && editableData && (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6 pb-6">
                <div className="flex items-center gap-4">
                  <div className="space-y-1 flex-1">
                    <Label>Año Detectado</Label>
                    <Input
                      type="number"
                      value={editableData.year}
                      onChange={(e) => setEditableData({ ...editableData, year: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm border-b pb-2">Cuenta de Pérdidas y Ganancias</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(editableData.pyg).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-xs capitalize">{key.replace(/_/g, ' ')}</Label>
                        <Input
                          type="number"
                          value={value ?? ''}
                          onChange={(e) => updatePygField(key, e.target.value)}
                          placeholder="-"
                          className="h-8"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm border-b pb-2">Balance de Situación</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(editableData.balance).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-xs capitalize">{key.replace(/_/g, ' ')}</Label>
                        <Input
                          type="number"
                          value={value ?? ''}
                          onChange={(e) => updateBalanceField(key, e.target.value)}
                          placeholder="-"
                          className="h-8"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('upload')} className="flex-1">
                    Volver
                  </Button>
                  <Button onClick={handleSave} disabled={isCreating} className="flex-1">
                    {isCreating ? 'Guardando...' : 'Guardar Estado Financiero'}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium">¡Importación completada!</h3>
              <p className="text-muted-foreground">El estado financiero se ha guardado correctamente</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
