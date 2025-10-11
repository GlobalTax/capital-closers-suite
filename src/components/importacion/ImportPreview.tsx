import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import type { ValidationResult } from "@/services/importacion/validator";

interface ImportPreviewProps {
  headers: string[];
  rows: Record<string, string>[];
  validationResults: ValidationResult[];
  maxRows?: number;
}

export const ImportPreview = ({ headers, rows, validationResults, maxRows = 10 }: ImportPreviewProps) => {
  const displayRows = rows.slice(0, maxRows);
  const totalErrors = validationResults.filter(r => !r.isValid).length;
  const totalWarnings = validationResults.reduce(
    (sum, r) => sum + r.errors.filter(e => e.severity === 'warning').length,
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 Vista Previa de Datos</CardTitle>
        <CardDescription>
          Mostrando {displayRows.length} de {rows.length} registros
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alertas de validación */}
        {totalErrors > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ❌ {totalErrors} filas con errores críticos que no se importarán
            </AlertDescription>
          </Alert>
        )}
        
        {totalWarnings > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              ⚠️ {totalWarnings} advertencias detectadas (se importarán igualmente)
            </AlertDescription>
          </Alert>
        )}

        {totalErrors === 0 && totalWarnings === 0 && (
          <Alert className="border-green-500">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              ✅ Todos los registros son válidos y listos para importar
            </AlertDescription>
          </Alert>
        )}

        {/* Tabla de preview */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead className="w-16">Estado</TableHead>
                {headers.slice(0, 6).map((header, i) => (
                  <TableHead key={i} className="min-w-[120px]">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map((row, index) => {
                const validation = validationResults[index];
                const hasErrors = !validation?.isValid;
                const hasWarnings = validation?.errors.some(e => e.severity === 'warning');
                
                return (
                  <TableRow key={index} className={hasErrors ? 'bg-destructive/5' : ''}>
                    <TableCell className="font-mono text-xs">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      {hasErrors ? (
                        <Badge variant="destructive" className="text-xs">
                          Error
                        </Badge>
                      ) : hasWarnings ? (
                        <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">
                          ⚠️
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs border-green-500 text-green-700">
                          ✓
                        </Badge>
                      )}
                    </TableCell>
                    {headers.slice(0, 6).map((header, i) => (
                      <TableCell key={i} className="max-w-[200px] truncate text-sm">
                        {row[header.toLowerCase()] || '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {rows.length > maxRows && (
          <p className="text-sm text-muted-foreground text-center">
            ... y {rows.length - maxRows} filas más
          </p>
        )}
      </CardContent>
    </Card>
  );
};
