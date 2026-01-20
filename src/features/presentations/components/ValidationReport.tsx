import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
  FileWarning,
  ChevronRight,
} from "lucide-react";
import {
  ValidationReport as ValidationReportType,
  getSeverityColor,
  getSeverityBg,
  getIssueTypeLabel,
  getScoreColor,
  getQualityStatus,
} from "@/hooks/useValidatePresentation";
import type { PresentationSlide } from "@/types/presentations";

interface ValidationReportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ValidationReportType | null;
  slides: PresentationSlide[];
  onApplyFix?: (slideIndex: number, location: string, suggested: string) => void;
}

export function ValidationReport({
  open,
  onOpenChange,
  report,
  slides,
  onApplyFix,
}: ValidationReportProps) {
  const [expandedSlides, setExpandedSlides] = useState<string[]>([]);

  if (!report) return null;

  const score = report.overall_quality_score;
  const scorePercentage = (score / 10) * 100;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileWarning className="h-5 w-5" />
            Informe de Validación
          </SheetTitle>
          <SheetDescription>
            Análisis de calidad y cumplimiento de la presentación
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-4">
            {/* Quality Score */}
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Puntuación de Calidad</span>
                <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                  {score.toFixed(1)}/10
                </span>
              </div>
              <Progress value={scorePercentage} className="h-2" />
              <p className={`text-sm mt-2 ${getScoreColor(score)}`}>
                Estado: {getQualityStatus(score)}
              </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border bg-destructive/5 border-destructive/20 text-center">
                <div className="text-2xl font-bold text-destructive">
                  {report.summary.high_severity}
                </div>
                <div className="text-xs text-muted-foreground">Críticos</div>
              </div>
              <div className="p-3 rounded-lg border bg-orange-500/5 border-orange-500/20 text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {report.summary.medium_severity}
                </div>
                <div className="text-xs text-muted-foreground">Moderados</div>
              </div>
              <div className="p-3 rounded-lg border bg-yellow-500/5 border-yellow-500/20 text-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {report.summary.low_severity}
                </div>
                <div className="text-xs text-muted-foreground">Menores</div>
              </div>
            </div>

            {/* Risk Flags */}
            {report.risk_flags.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Alertas de Riesgo ({report.risk_flags.length})
                </h3>
                <div className="space-y-2">
                  {report.risk_flags.map((flag, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border border-destructive/30 bg-destructive/5"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            Slide {flag.slide_index + 1}: {flag.flag}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {flag.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Issues per Slide */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4" />
                Problemas por Slide
              </h3>

              {report.issues_per_slide.length === 0 ? (
                <div className="p-4 rounded-lg border bg-green-500/5 border-green-500/20 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-green-600">
                    ¡No se encontraron problemas!
                  </p>
                </div>
              ) : (
                <Accordion
                  type="multiple"
                  value={expandedSlides}
                  onValueChange={setExpandedSlides}
                >
                  {report.issues_per_slide
                    .filter((s) => s.issues.length > 0)
                    .map((slideIssues) => {
                      const slide = slides[slideIssues.slide_index];
                      const hasHighSeverity = slideIssues.issues.some(
                        (i) => i.severity === 'high'
                      );

                      return (
                        <AccordionItem
                          key={slideIssues.slide_index}
                          value={`slide-${slideIssues.slide_index}`}
                        >
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-2 text-left">
                              <span className="font-medium">
                                Slide {slideIssues.slide_index + 1}
                              </span>
                              <span className="text-muted-foreground text-sm truncate max-w-[200px]">
                                {slide?.headline || 'Sin título'}
                              </span>
                              <Badge
                                variant={hasHighSeverity ? 'destructive' : 'secondary'}
                                className="ml-auto"
                              >
                                {slideIssues.issues.length}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pt-2">
                              {slideIssues.issues.map((issue, i) => (
                                <div
                                  key={i}
                                  className={`p-3 rounded-lg border ${getSeverityBg(
                                    issue.severity
                                  )}`}
                                >
                                  <div className="flex items-start gap-2">
                                    <Badge
                                      variant="outline"
                                      className={`${getSeverityColor(
                                        issue.severity
                                      )} text-xs`}
                                    >
                                      {issue.severity.toUpperCase()}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {issue.location}
                                    </Badge>
                                  </div>
                                  <p className="text-sm mt-2">
                                    {getIssueTypeLabel(issue.type)}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {issue.description}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                </Accordion>
              )}
            </div>

            {/* Suggested Fixes */}
            {report.suggested_fixes.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Correcciones Sugeridas ({report.suggested_fixes.length})
                </h3>
                <div className="space-y-3">
                  {report.suggested_fixes.map((fix, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border bg-primary/5 border-primary/20"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Slide {fix.slide_index + 1}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {fix.location}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-muted-foreground w-16 flex-shrink-0">
                            Original:
                          </span>
                          <span className="text-sm line-through text-muted-foreground">
                            {fix.original}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-primary w-16 flex-shrink-0">
                            Sugerido:
                          </span>
                          <span className="text-sm text-primary font-medium">
                            {fix.suggested}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {fix.reason}
                        </p>
                      </div>
                      {onApplyFix && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() =>
                            onApplyFix(fix.slide_index, fix.location, fix.suggested)
                          }
                        >
                          <ChevronRight className="h-3 w-3 mr-1" />
                          Aplicar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="pt-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
