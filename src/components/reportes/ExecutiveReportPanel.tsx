import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Mail, Plus, Trash2, Eye, CheckCircle, Clock, Users } from "lucide-react";
import { useExecutiveReports, useGenerateExecutiveReport, useReportRecipients } from "@/hooks/useExecutiveReports";
import DOMPurify from "dompurify";

export function ExecutiveReportPanel() {
  const { data: reports, isLoading: reportsLoading } = useExecutiveReports();
  const generateReport = useGenerateExecutiveReport();
  const { data: recipients, isLoading: recipientsLoading, addRecipient, removeRecipient, toggleRecipient } = useReportRecipients();

  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const handleAddRecipient = () => {
    if (!newEmail.trim()) return;
    addRecipient.mutate({ email: newEmail.trim(), name: newName.trim() || undefined });
    setNewEmail("");
    setNewName("");
  };

  return (
    <div className="space-y-6">
      {/* Generate Report */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Generar Reporte Ejecutivo
          </CardTitle>
          <Button
            onClick={() => generateReport.mutate()}
            disabled={generateReport.isPending}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {generateReport.isPending ? "Generando..." : "Generar Reporte Semanal"}
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Genera un reporte ejecutivo con resumen de actividad, métricas clave y próximos pasos usando IA. 
            El reporte se enviará automáticamente a los destinatarios configurados.
          </p>
        </CardContent>
      </Card>

      {/* Recipients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4" />
            Destinatarios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1"
              type="email"
            />
            <Input
              placeholder="Nombre (opcional)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-40"
            />
            <Button size="sm" onClick={handleAddRecipient} disabled={!newEmail.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {recipientsLoading ? (
            <Skeleton className="h-20" />
          ) : recipients && recipients.length > 0 ? (
            <div className="space-y-2">
              {recipients.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={r.active}
                      onCheckedChange={(active) => toggleRecipient.mutate({ id: r.id, active })}
                    />
                    <div>
                      <span className="text-sm font-medium">{r.email}</span>
                      {r.name && <span className="text-xs text-muted-foreground ml-2">({r.name})</span>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRecipient.mutate(r.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay destinatarios configurados. Añade emails de socios/directores.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Report History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="w-4 h-4" />
            Historial de Reportes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : reports && reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((report: any) => {
                const metrics = report.metrics_snapshot as any;
                return (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {new Date(report.report_date).toLocaleDateString("es-ES", {
                            day: "numeric", month: "long", year: "numeric",
                          })}
                        </span>
                        {report.email_sent ? (
                          <Badge variant="default" className="text-xs gap-1">
                            <CheckCircle className="w-3 h-3" /> Enviado
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Clock className="w-3 h-3" /> No enviado
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {metrics?.mandatos_activos || 0} mandatos · {metrics?.horas_semana || 0}h · {metrics?.reuniones || 0} reuniones
                        {report.recipients?.length > 0 && ` · ${report.recipients.length} destinatarios`}
                      </p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewHtml(report.summary_text || "")}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Resumen del Reporte</DialogTitle>
                        </DialogHeader>
                        <div className="prose prose-sm max-w-none">
                          <p className="whitespace-pre-wrap">{report.summary_text}</p>
                          {report.recommendations && (
                            <>
                              <h4>Logros</h4>
                              <ul>
                                {(report.recommendations as any)?.highlights?.map((h: string, i: number) => (
                                  <li key={i}>{h}</li>
                                ))}
                              </ul>
                              {(report.recommendations as any)?.risks?.length > 0 && (
                                <>
                                  <h4>Riesgos</h4>
                                  <ul>
                                    {(report.recommendations as any).risks.map((r: any, i: number) => (
                                      <li key={i}>
                                        <strong>{r.mandato}</strong>: {r.reason} → {r.suggested_action}
                                      </li>
                                    ))}
                                  </ul>
                                </>
                              )}
                              <h4>Próximos Pasos</h4>
                              <ul>
                                {(report.recommendations as any)?.recommendations?.map((r: any, i: number) => (
                                  <li key={i}>
                                    <strong>{r.mandato}</strong> [{r.priority}]: {r.action}
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aún no se han generado reportes ejecutivos.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
