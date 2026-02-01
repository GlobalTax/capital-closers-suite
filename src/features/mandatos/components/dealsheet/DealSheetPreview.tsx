import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  CheckCircle,
  Target,
  Sparkles,
  FileCheck,
} from "lucide-react";
import type { DealSheetFormData, TransactionType } from "@/types/dealSheet";
import { TRANSACTION_TYPE_LABELS } from "@/types/dealSheet";

interface DealSheetPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: DealSheetFormData;
  mandatoNombre?: string;
}

export function DealSheetPreview({
  open,
  onOpenChange,
  formData,
  mandatoNombre,
}: DealSheetPreviewProps) {
  const [language, setLanguage] = useState<'es' | 'en'>('es');

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `€${(value / 1000).toFixed(0)}K`;
    }
    return `€${value.toLocaleString()}`;
  };

  const executiveSummary = language === 'es' ? formData.executive_summary_es : formData.executive_summary_en;
  const highlights = language === 'es' ? formData.investment_highlights_es : formData.investment_highlights_en;
  const saleRationale = language === 'es' ? formData.sale_rationale_es : formData.sale_rationale_en;
  const idealBuyer = language === 'es' ? formData.ideal_buyer_profile_es : formData.ideal_buyer_profile_en;

  const labels = {
    es: {
      executiveSummary: 'Resumen Ejecutivo',
      investmentHighlights: 'Highlights de Inversión',
      financialMetrics: 'Métricas Financieras',
      revenue: 'Facturación',
      ebitda: 'EBITDA',
      margin: 'Margen EBITDA',
      employees: 'Empleados',
      processInfo: 'Información del Proceso',
      transactionType: 'Tipo de Transacción',
      valuation: 'Valoración Objetivo',
      timeline: 'Timeline',
      requirements: 'Requisitos',
      saleRationale: 'Motivo de Venta',
      idealBuyer: 'Perfil de Comprador Ideal',
    },
    en: {
      executiveSummary: 'Executive Summary',
      investmentHighlights: 'Investment Highlights',
      financialMetrics: 'Financial Metrics',
      revenue: 'Revenue',
      ebitda: 'EBITDA',
      margin: 'EBITDA Margin',
      employees: 'Employees',
      processInfo: 'Process Information',
      transactionType: 'Transaction Type',
      valuation: 'Target Valuation',
      timeline: 'Timeline',
      requirements: 'Requirements',
      saleRationale: 'Sale Rationale',
      idealBuyer: 'Ideal Buyer Profile',
    },
  };

  const l = labels[language];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {mandatoNombre || 'Deal Sheet Preview'}
            </DialogTitle>
            <Tabs value={language} onValueChange={(v) => setLanguage(v as 'es' | 'en')}>
              <TabsList className="h-8">
                <TabsTrigger value="es" className="text-xs px-3">🇪🇸 ES</TabsTrigger>
                <TabsTrigger value="en" className="text-xs px-3">🇬🇧 EN</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Executive Summary */}
          {executiveSummary && (
            <section>
              <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {l.executiveSummary}
              </h3>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm leading-relaxed">{executiveSummary}</p>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Sale Rationale & Ideal Buyer */}
          {(saleRationale || idealBuyer) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {saleRationale && (
                <section>
                  <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    {l.saleRationale}
                  </h3>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm leading-relaxed">{saleRationale}</p>
                    </CardContent>
                  </Card>
                </section>
              )}
              {idealBuyer && (
                <section>
                  <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {l.idealBuyer}
                  </h3>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm leading-relaxed">{idealBuyer}</p>
                    </CardContent>
                  </Card>
                </section>
              )}
            </div>
          )}

          {/* Investment Highlights */}
          {highlights.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {l.investmentHighlights}
              </h3>
              <Card>
                <CardContent className="pt-4">
                  <ul className="space-y-2">
                    {highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-sm">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Financial Metrics */}
          {(formData.show_revenue_range || formData.show_ebitda_range || formData.show_ebitda_margin || formData.show_employees) && (
            <section>
              <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                {l.financialMetrics}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {formData.show_revenue_range && (
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{l.revenue}</p>
                      <p className="font-semibold">
                        {formData.custom_revenue_min || formData.custom_revenue_max
                          ? `${formatCurrency(formData.custom_revenue_min)} - ${formatCurrency(formData.custom_revenue_max)}`
                          : '€10M - €15M'}
                      </p>
                    </CardContent>
                  </Card>
                )}
                {formData.show_ebitda_range && (
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{l.ebitda}</p>
                      <p className="font-semibold">
                        {formData.custom_ebitda_min || formData.custom_ebitda_max
                          ? `${formatCurrency(formData.custom_ebitda_min)} - ${formatCurrency(formData.custom_ebitda_max)}`
                          : '€1.5M - €2M'}
                      </p>
                    </CardContent>
                  </Card>
                )}
                {formData.show_ebitda_margin && (
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{l.margin}</p>
                      <p className="font-semibold">15-20%</p>
                    </CardContent>
                  </Card>
                )}
                {formData.show_employees && (
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{l.employees}</p>
                      <p className="font-semibold">75-100</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>
          )}

          {/* Process Information */}
          {(formData.transaction_type || formData.expected_timeline || formData.valuation_multiple_min || formData.process_requirements.length > 0) && (
            <section>
              <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {l.processInfo}
              </h3>
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {formData.transaction_type && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{l.transactionType}</p>
                        <Badge variant="outline">
                          {TRANSACTION_TYPE_LABELS[formData.transaction_type as TransactionType]}
                        </Badge>
                      </div>
                    )}
                    {(formData.valuation_multiple_min || formData.valuation_multiple_max) && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{l.valuation}</p>
                        <p className="font-medium">
                          {formData.valuation_multiple_min}x - {formData.valuation_multiple_max}x EBITDA
                        </p>
                      </div>
                    )}
                    {formData.expected_timeline && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{l.timeline}</p>
                        <p className="font-medium">{formData.expected_timeline}</p>
                      </div>
                    )}
                  </div>
                  
                  {formData.process_requirements.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-2">{l.requirements}</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.process_requirements.map((req, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <FileCheck className="w-3 h-3 mr-1" />
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
