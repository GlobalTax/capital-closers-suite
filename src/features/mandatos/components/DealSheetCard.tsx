import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, Edit, Globe, TrendingUp, DollarSign, Loader2 } from "lucide-react";
import { useDealSheet } from "@/hooks/useDealSheet";
import { DealSheetDrawer } from "./DealSheetDrawer";
import { DealSheetPreview } from "./dealsheet/DealSheetPreview";
import { DEFAULT_DEAL_SHEET_FORM } from "@/types/dealSheet";

interface DealSheetCardProps {
  mandatoId: string;
  mandatoNombre?: string;
}

export function DealSheetCard({ mandatoId, mandatoNombre }: DealSheetCardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: dealSheet, isLoading } = useDealSheet(mandatoId);

  const isPublished = dealSheet?.status === 'published';
  const hasContent = dealSheet?.executive_summary_es || dealSheet?.executive_summary_en;
  const highlightsCount = (dealSheet?.investment_highlights_es?.length || 0) + 
                          (dealSheet?.investment_highlights_en?.length || 0);
  const hasFinancials = dealSheet?.show_revenue_range || dealSheet?.show_ebitda_range;

  // Truncate executive summary for preview
  const summaryPreview = dealSheet?.executive_summary_es?.slice(0, 150) || 
                         dealSheet?.executive_summary_en?.slice(0, 150);

  // Prepare form data for preview
  const formDataForPreview = dealSheet ? {
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
    transaction_type: dealSheet.transaction_type as any,
    valuation_multiple_min: dealSheet.valuation_multiple_min,
    valuation_multiple_max: dealSheet.valuation_multiple_max,
    expected_timeline: dealSheet.expected_timeline || '',
    process_requirements: dealSheet.process_requirements || [],
  } : DEFAULT_DEAL_SHEET_FORM;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Deal Sheet
            </CardTitle>
            {isPublished ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <Globe className="w-3 h-3 mr-1" />
                Publicado
              </Badge>
            ) : (
              <Badge variant="secondary">
                Borrador
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasContent ? (
            <>
              {/* Preview of executive summary */}
              <p className="text-sm text-muted-foreground line-clamp-2">
                {summaryPreview}
                {summaryPreview && summaryPreview.length >= 150 && '...'}
              </p>

              {/* Quick stats */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {highlightsCount > 0 && (
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {highlightsCount} highlights
                  </span>
                )}
                {hasFinancials && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Financieros configurados
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Define la información estandarizada que se compartirá con los candidatos.
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setDrawerOpen(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            {hasContent && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Vista previa
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Drawer for editing */}
      <DealSheetDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mandatoId={mandatoId}
        mandatoNombre={mandatoNombre}
      />

      {/* Preview dialog */}
      <DealSheetPreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        formData={formDataForPreview}
        mandatoNombre={mandatoNombre}
      />
    </>
  );
}
