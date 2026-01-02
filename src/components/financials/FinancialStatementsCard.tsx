import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Camera, Trash2, Edit, TrendingUp, FileSpreadsheet, Scale, Calculator } from "lucide-react";
import { useFinancialStatements } from "@/hooks/useFinancialStatements";
import { PyGDetailView } from "./PyGDetailView";
import { BalanceSheetView } from "./BalanceSheetView";
import { FinancialRatiosView } from "./FinancialRatiosView";
import { FinancialTrendChart } from "./FinancialTrendChart";
import { AddFinancialYearDrawer } from "./AddFinancialYearDrawer";
import { ImportFinancialsFromImageDrawer } from "./ImportFinancialsFromImageDrawer";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { FinancialStatement } from "@/types/financials";

interface FinancialStatementsCardProps {
  empresaId: string;
  empresaNombre?: string;
}

export function FinancialStatementsCard({ empresaId, empresaNombre }: FinancialStatementsCardProps) {
  const { statements, isLoading, deleteStatement, isDeleting } = useFinancialStatements(empresaId);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [showImportDrawer, setShowImportDrawer] = useState(false);
  const [editingStatement, setEditingStatement] = useState<FinancialStatement | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const years = [...new Set(statements.map(s => s.year))].sort((a, b) => b - a);
  const activeYear = selectedYear || years[0];
  const currentStatement = statements.find(s => s.year === activeYear);

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(value);
  };

  const handleEdit = (statement: FinancialStatement) => {
    setEditingStatement(statement);
    setShowAddDrawer(true);
  };

  const handleCloseDrawer = () => {
    setShowAddDrawer(false);
    setEditingStatement(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estados Financieros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center text-muted-foreground">
            Cargando...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Estados Financieros {empresaNombre && `de ${empresaNombre}`}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImportDrawer(true)}>
              <Camera className="h-4 w-4 mr-2" />
              Importar con IA
            </Button>
            <Button size="sm" onClick={() => setShowAddDrawer(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Añadir Año
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {statements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">No hay estados financieros registrados</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setShowImportDrawer(true)}>
                  <Camera className="h-4 w-4 mr-2" />
                  Importar desde imagen
                </Button>
                <Button onClick={() => setShowAddDrawer(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir manualmente
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Year selector */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {years.map(year => (
                  <Button
                    key={year}
                    variant={activeYear === year ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedYear(year)}
                  >
                    {year}
                    {statements.find(s => s.year === year)?.is_audited && (
                      <Badge variant="secondary" className="ml-2 text-xs">Auditado</Badge>
                    )}
                  </Button>
                ))}
              </div>

              {currentStatement && (
                <>
                  {/* Quick KPIs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Ingresos</p>
                      <p className="text-xl font-semibold">{formatCurrency(currentStatement.revenue)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">EBITDA</p>
                      <p className="text-xl font-semibold">{formatCurrency(currentStatement.ebitda)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Beneficio Neto</p>
                      <p className="text-xl font-semibold">{formatCurrency(currentStatement.net_income)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Total Activo</p>
                      <p className="text-xl font-semibold">{formatCurrency(currentStatement.total_assets)}</p>
                    </div>
                  </div>

                  {/* Actions for current statement */}
                  <div className="flex gap-2 mb-4">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(currentStatement)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(currentStatement.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                    {currentStatement.source === 'ai_image' && (
                      <Badge variant="outline" className="ml-auto">
                        <Camera className="h-3 w-3 mr-1" />
                        Importado con IA
                      </Badge>
                    )}
                  </div>

                  {/* Detail tabs */}
                  <Tabs defaultValue="pyg" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="pyg" className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="hidden sm:inline">PyG</span>
                      </TabsTrigger>
                      <TabsTrigger value="balance" className="flex items-center gap-1">
                        <Scale className="h-4 w-4" />
                        <span className="hidden sm:inline">Balance</span>
                      </TabsTrigger>
                      <TabsTrigger value="ratios" className="flex items-center gap-1">
                        <Calculator className="h-4 w-4" />
                        <span className="hidden sm:inline">Ratios</span>
                      </TabsTrigger>
                      <TabsTrigger value="evolution" className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="hidden sm:inline">Evolución</span>
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="pyg" className="mt-4">
                      <PyGDetailView statement={currentStatement} />
                    </TabsContent>
                    <TabsContent value="balance" className="mt-4">
                      <BalanceSheetView statement={currentStatement} />
                    </TabsContent>
                    <TabsContent value="ratios" className="mt-4">
                      <FinancialRatiosView statement={currentStatement} />
                    </TabsContent>
                    <TabsContent value="evolution" className="mt-4">
                      <FinancialTrendChart statements={statements} />
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AddFinancialYearDrawer
        open={showAddDrawer}
        onOpenChange={handleCloseDrawer}
        empresaId={empresaId}
        existingStatement={editingStatement}
      />

      <ImportFinancialsFromImageDrawer
        open={showImportDrawer}
        onOpenChange={setShowImportDrawer}
        empresaId={empresaId}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        titulo="Eliminar Estado Financiero"
        descripcion="¿Estás seguro de que quieres eliminar este estado financiero? Esta acción no se puede deshacer."
        onConfirmar={() => {
          if (deleteId) {
            deleteStatement(deleteId);
            setDeleteId(null);
          }
        }}
        variant="destructive"
      />
    </>
  );
}
