import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  Globe,
  FileText,
  Sparkles,
  TrendingUp,
  Users,
  Calendar,
  Loader2,
  Eye,
  GlobeIcon,
} from "lucide-react";
import { toast } from "sonner";

import { useDealSheet, useSaveDealSheet, usePublishDealSheet, useUnpublishDealSheet } from "@/hooks/useDealSheet";
import { HighlightsEditor } from "./HighlightsEditor";
import { FinancialDisclosureConfig } from "./FinancialDisclosureConfig";
import { DealSheetPreview } from "./DealSheetPreview";
import {
  type DealSheetFormData,
  type TransactionType,
  TRANSACTION_TYPE_LABELS,
  DEFAULT_DEAL_SHEET_FORM,
} from "@/types/dealSheet";

interface DealSheetEditorProps {
  mandatoId: string;
  mandatoNombre?: string;
}

export function DealSheetEditor({ mandatoId, mandatoNombre }: DealSheetEditorProps) {
  const [activeTab, setActiveTab] = useState<'es' | 'en'>('es');
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState<DealSheetFormData>(DEFAULT_DEAL_SHEET_FORM);

  const { data: dealSheet, isLoading } = useDealSheet(mandatoId);
  const saveMutation = useSaveDealSheet(mandatoId);
  const publishMutation = usePublishDealSheet(mandatoId);
  const unpublishMutation = useUnpublishDealSheet(mandatoId);

  // Load existing data
  useEffect(() => {
    if (dealSheet) {
      setFormData({
        executive_summary_es: dealSheet.executive_summary_es || '',
        executive_summary_en: dealSheet.executive_summary_en || '',
        investment_highlights_es: dealSheet.investment_highlights_es || [],
        investment_highlights_en: dealSheet.investment_highlights_en || [],
        sale_rationale_es: dealSheet.sale_rationale_es || '',
        sale_rationale_en: dealSheet.sale_rationale_en || '',
        ideal_buyer_profile_es: dealSheet.ideal_buyer_profile_es || '',
        ideal_buyer_profile_en: dealSheet.ideal_buyer_profile_en || '',
        show_revenue_range: dealSheet.show_revenue_range,
        show_ebitda_range: dealSheet.show_ebitda_range,
        show_ebitda_margin: dealSheet.show_ebitda_margin,
        show_employees: dealSheet.show_employees,
        show_exact_financials: dealSheet.show_exact_financials,
        custom_revenue_min: dealSheet.custom_revenue_min,
        custom_revenue_max: dealSheet.custom_revenue_max,
        custom_ebitda_min: dealSheet.custom_ebitda_min,
        custom_ebitda_max: dealSheet.custom_ebitda_max,
        transaction_type: dealSheet.transaction_type as TransactionType | null,
        valuation_multiple_min: dealSheet.valuation_multiple_min,
        valuation_multiple_max: dealSheet.valuation_multiple_max,
        expected_timeline: dealSheet.expected_timeline || '',
        process_requirements: dealSheet.process_requirements || [],
      });
    }
  }, [dealSheet]);

  const handleSave = async () => {
    await saveMutation.mutateAsync(formData);
  };

  const handlePublish = async () => {
    if (!dealSheet?.id) {
      // Save first
      const saved = await saveMutation.mutateAsync(formData);
      if (saved?.id) {
        await publishMutation.mutateAsync(saved.id);
      }
    } else {
      await publishMutation.mutateAsync(dealSheet.id);
    }
  };

  const handleUnpublish = async () => {
    if (dealSheet?.id) {
      await unpublishMutation.mutateAsync(dealSheet.id);
    }
  };

  const updateField = <K extends keyof DealSheetFormData>(
    field: K,
    value: DealSheetFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isPublished = dealSheet?.status === 'published';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Deal Sheet
          </h3>
          <p className="text-sm text-muted-foreground">
            Define qué información se comparte con los candidatos
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPublished && (
            <Badge className="bg-emerald-500">
              <Globe className="w-3 h-3 mr-1" />
              Publicado
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Previsualizar
          </Button>
        </div>
      </div>

      {/* Language tabs for content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'es' | 'en')}>
        <TabsList className="mb-4">
          <TabsTrigger value="es" className="gap-1">
            <span>🇪🇸</span> Español
          </TabsTrigger>
          <TabsTrigger value="en" className="gap-1">
            <span>🇬🇧</span> English
          </TabsTrigger>
        </TabsList>

        {/* Spanish content */}
        <TabsContent value="es" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Resumen Ejecutivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Descripción del Negocio</Label>
                <Textarea
                  value={formData.executive_summary_es}
                  onChange={(e) => updateField('executive_summary_es', e.target.value)}
                  placeholder="Empresa líder regional en el sector de [X] con más de 20 años de trayectoria..."
                  rows={4}
                />
              </div>
              <div>
                <Label>Motivo de Venta</Label>
                <Textarea
                  value={formData.sale_rationale_es}
                  onChange={(e) => updateField('sale_rationale_es', e.target.value)}
                  placeholder="Los socios fundadores buscan un socio estratégico que..."
                  rows={2}
                />
              </div>
              <div>
                <Label>Perfil de Comprador Ideal</Label>
                <Textarea
                  value={formData.ideal_buyer_profile_es}
                  onChange={(e) => updateField('ideal_buyer_profile_es', e.target.value)}
                  placeholder="Inversor financiero o estratégico con experiencia en..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Highlights de Inversión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HighlightsEditor
                highlights={formData.investment_highlights_es}
                onChange={(highlights) => updateField('investment_highlights_es', highlights)}
                placeholder="Ej: Líder regional con 35% de cuota de mercado"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* English content */}
        <TabsContent value="en" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Business Description</Label>
                <Textarea
                  value={formData.executive_summary_en}
                  onChange={(e) => updateField('executive_summary_en', e.target.value)}
                  placeholder="Regional leader in the [X] sector with over 20 years of track record..."
                  rows={4}
                />
              </div>
              <div>
                <Label>Sale Rationale</Label>
                <Textarea
                  value={formData.sale_rationale_en}
                  onChange={(e) => updateField('sale_rationale_en', e.target.value)}
                  placeholder="The founding partners are seeking a strategic partner to..."
                  rows={2}
                />
              </div>
              <div>
                <Label>Ideal Buyer Profile</Label>
                <Textarea
                  value={formData.ideal_buyer_profile_en}
                  onChange={(e) => updateField('ideal_buyer_profile_en', e.target.value)}
                  placeholder="Financial or strategic investor with experience in..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Investment Highlights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HighlightsEditor
                highlights={formData.investment_highlights_en}
                onChange={(highlights) => updateField('investment_highlights_en', highlights)}
                placeholder="E.g.: Regional leader with 35% market share"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Financial disclosure config (shared) */}
      <FinancialDisclosureConfig
        showRevenueRange={formData.show_revenue_range}
        showEbitdaRange={formData.show_ebitda_range}
        showEbitdaMargin={formData.show_ebitda_margin}
        showEmployees={formData.show_employees}
        showExactFinancials={formData.show_exact_financials}
        customRevenueMin={formData.custom_revenue_min}
        customRevenueMax={formData.custom_revenue_max}
        customEbitdaMin={formData.custom_ebitda_min}
        customEbitdaMax={formData.custom_ebitda_max}
        onToggleChange={(field, value) => updateField(field as keyof DealSheetFormData, value)}
        onRangeChange={(field, value) => updateField(field as keyof DealSheetFormData, value)}
      />

      {/* Process information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Información del Proceso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Transacción</Label>
              <Select
                value={formData.transaction_type || ''}
                onValueChange={(value) => updateField('transaction_type', value as TransactionType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Timeline Esperado</Label>
              <Input
                value={formData.expected_timeline}
                onChange={(e) => updateField('expected_timeline', e.target.value)}
                placeholder="Ej: Cierre estimado Q2 2025"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Múltiplo Valoración Mín (x EBITDA)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.valuation_multiple_min ?? ''}
                onChange={(e) => updateField('valuation_multiple_min', e.target.value ? Number(e.target.value) : null)}
                placeholder="Ej: 8"
              />
            </div>
            <div>
              <Label>Múltiplo Valoración Máx (x EBITDA)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.valuation_multiple_max ?? ''}
                onChange={(e) => updateField('valuation_multiple_max', e.target.value ? Number(e.target.value) : null)}
                placeholder="Ej: 10"
              />
            </div>
          </div>

          <div>
            <Label>Requisitos del Proceso</Label>
            <HighlightsEditor
              highlights={formData.process_requirements}
              onChange={(items) => updateField('process_requirements', items)}
              placeholder="Ej: NDA firmado, Carta de capacidad financiera"
              maxItems={5}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Guardar Borrador
        </Button>
        
        {isPublished ? (
          <Button
            variant="outline"
            onClick={handleUnpublish}
            disabled={unpublishMutation.isPending}
          >
            {unpublishMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <GlobeIcon className="w-4 h-4 mr-2" />
            )}
            Despublicar
          </Button>
        ) : (
          <Button
            onClick={handlePublish}
            disabled={publishMutation.isPending || saveMutation.isPending}
          >
            {publishMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Globe className="w-4 h-4 mr-2" />
            )}
            Publicar Deal Sheet
          </Button>
        )}
      </div>

      {/* Preview dialog */}
      <DealSheetPreview
        open={showPreview}
        onOpenChange={setShowPreview}
        formData={formData}
        mandatoNombre={mandatoNombre}
      />
    </div>
  );
}
