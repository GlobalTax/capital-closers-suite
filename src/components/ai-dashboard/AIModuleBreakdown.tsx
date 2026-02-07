import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Brain, Zap, Bell, ListChecks, Cpu } from "lucide-react";
import type { AIModuleStats, AIModelStats } from "@/hooks/queries/useAIDashboard";

const moduleIcons: Record<string, typeof Sparkles> = {
  meeting_summary: Brain,
  alerts: Bell,
  "batch-enrichment": Zap,
  alerts_cron: Bell,
  "task-ai": ListChecks,
};

const moduleLabels: Record<string, string> = {
  meeting_summary: "Resumen de reuniones",
  alerts: "Alertas IA",
  "batch-enrichment": "Enriquecimiento",
  alerts_cron: "Alertas CRON",
  "task-ai": "Tareas IA",
};

interface Props {
  modules: AIModuleStats[];
  models: AIModelStats[];
  isLoading: boolean;
}

export function AIModuleBreakdown({ modules, models, isLoading }: Props) {
  const maxCalls = Math.max(...modules.map(m => m.calls), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Uso por Módulo</CardTitle>
        </CardHeader>
        <CardContent>
          {modules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Módulo</TableHead>
                  <TableHead className="text-right">Llamadas</TableHead>
                  <TableHead className="text-right">Tokens IN</TableHead>
                  <TableHead className="text-right">Tokens OUT</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="text-right">Éxito</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map(m => {
                  const Icon = moduleIcons[m.module] || Cpu;
                  return (
                    <TableRow key={m.module}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{moduleLabels[m.module] || m.module}</span>
                        </div>
                        <Progress value={(m.calls / maxCalls) * 100} className="h-1 mt-1" />
                      </TableCell>
                      <TableCell className="text-right text-sm">{m.calls}</TableCell>
                      <TableCell className="text-right text-sm">{m.inputTokens.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm">{m.outputTokens.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm">${m.cost.toFixed(4)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={m.successRate >= 90 ? "excellent" : m.successRate >= 50 ? "important" : "critical"}>
                          {m.successRate.toFixed(0)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Uso por Modelo</CardTitle>
        </CardHeader>
        <CardContent>
          {models.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Modelo</TableHead>
                  <TableHead className="text-right">Llamadas</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="text-right">Latencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map(m => (
                  <TableRow key={m.model}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{m.model}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">{m.calls}</TableCell>
                    <TableCell className="text-right text-sm">{m.totalTokens.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm">${m.cost.toFixed(4)}</TableCell>
                    <TableCell className="text-right text-sm">{Math.round(m.avgLatency)} ms</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
