import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, XCircle, AlertTriangle, Upload, X, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ValidationResult {
  isValid: boolean;
  errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }>;
}

interface CampaignContactsImportPreviewProps {
  rows: Record<string, string>[];
  headers: string[];
  validationResults: ValidationResult[];
  validCount: number;
  invalidCount: number;
  onImport: () => void;
  onCancel: () => void;
  isImporting: boolean;
  campaignType: 'buy' | 'sell';
}

export function CampaignContactsImportPreview({
  rows,
  headers,
  validationResults,
  validCount,
  invalidCount,
  onImport,
  onCancel,
  isImporting,
  campaignType
}: CampaignContactsImportPreviewProps) {
  const previewRows = rows.slice(0, 10);
  
  return (
    <div className="space-y-4">
      {/* Resumen de validación */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{validCount}</p>
                <p className="text-sm text-muted-foreground">Válidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{invalidCount}</p>
                <p className="text-sm text-muted-foreground">Inválidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">
                  {validationResults.reduce((acc, v) => 
                    acc + v.errors.filter(e => e.severity === 'warning').length, 0
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
                  {campaignType === 'buy' ? 'C' : 'V'}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold">{rows.length}</p>
                <p className="text-sm text-muted-foreground">Total filas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vista previa de datos */}
      <Card>
        <CardHeader>
          <CardTitle>Vista previa de datos</CardTitle>
          <CardDescription>
            Mostrando primeros {previewRows.length} de {rows.length} registros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead className="w-[80px]">Estado</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Errores</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, index) => {
                  const validation = validationResults[index];
                  const errors = validation?.errors.filter(e => e.severity === 'error') || [];
                  const warnings = validation?.errors.filter(e => e.severity === 'warning') || [];
                  
                  return (
                    <TableRow key={index}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        {validation?.isValid ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            OK
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Error
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.first_name || row.nombre || '—'} {row.last_name || row.apellidos || ''}
                      </TableCell>
                      <TableCell>{row.email || row.correo || '—'}</TableCell>
                      <TableCell>{row.company || row.empresa || '—'}</TableCell>
                      <TableCell>{row.position || row.cargo || '—'}</TableCell>
                      <TableCell>
                        {errors.length > 0 && (
                          <span className="text-sm text-destructive">
                            {errors.map(e => e.message).join(', ')}
                          </span>
                        )}
                        {warnings.length > 0 && (
                          <span className="text-sm text-yellow-600">
                            {warnings.map(e => e.message).join(', ')}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel} disabled={isImporting}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={onImport} 
            disabled={validCount === 0 || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importar {validCount} contactos
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
