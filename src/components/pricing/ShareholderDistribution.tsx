import { useState } from "react";
import { Plus, Trash2, Building2, User, Percent, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/pricing-utils";
import { cn } from "@/lib/utils";
import type { Shareholder, ShareholderType } from "@/types/pricing";
import { generateId } from "@/lib/pricing-utils";

interface ShareholderDistributionProps {
  equityValue: number;
  shareholders: Shareholder[];
  onAddShareholder: (shareholder: Omit<Shareholder, 'id'>) => void;
  onUpdateShareholder: (id: string, updates: Partial<Shareholder>) => void;
  onRemoveShareholder: (id: string) => void;
}

export function ShareholderDistribution({
  equityValue,
  shareholders,
  onAddShareholder,
  onUpdateShareholder,
  onRemoveShareholder,
}: ShareholderDistributionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<ShareholderType>('persona_fisica');
  const [newPercentage, setNewPercentage] = useState<number>(0);

  const totalPercentage = shareholders.reduce((sum, s) => sum + s.percentage, 0);
  const remainingPercentage = 100 - totalPercentage;
  const isOverAllocated = totalPercentage > 100;

  const handleAddShareholder = () => {
    if (!newName.trim()) return;
    onAddShareholder({
      name: newName,
      type: newType,
      percentage: newPercentage || remainingPercentage,
    });
    setNewName('');
    setNewPercentage(0);
    setShowAddForm(false);
  };

  const calculateAmount = (percentage: number): number => {
    return (equityValue * percentage) / 100;
  };

  const getTypeIcon = (type: ShareholderType) => {
    switch (type) {
      case 'sociedad':
        return <Building2 className="h-4 w-4" />;
      case 'persona_fisica':
        return <User className="h-4 w-4" />;
      case 'holding':
        return <Building2 className="h-4 w-4 text-primary" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: ShareholderType) => {
    switch (type) {
      case 'sociedad':
        return <Badge variant="outline" className="text-xs">Sociedad</Badge>;
      case 'persona_fisica':
        return <Badge variant="secondary" className="text-xs">Persona Física</Badge>;
      case 'holding':
        return <Badge className="text-xs bg-primary/10 text-primary hover:bg-primary/20">Holding</Badge>;
      default:
        return null;
    }
  };

  if (equityValue <= 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            Distribución entre Socios
          </CardTitle>
          <div className="flex items-center gap-2">
            {isOverAllocated ? (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {totalPercentage.toFixed(1)}% asignado
              </Badge>
            ) : (
              <Badge 
                variant={totalPercentage === 100 ? "default" : "secondary"}
                className={cn(
                  totalPercentage === 100 && "bg-emerald-600 hover:bg-emerald-700"
                )}
              >
                {totalPercentage.toFixed(1)}% asignado
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {shareholders.length === 0 && !showAddForm ? (
          <div className="text-center py-6 text-muted-foreground">
            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay socios definidos</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="mt-3"
            >
              <Plus className="h-4 w-4 mr-2" />
              Añadir socio
            </Button>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Nombre / Razón Social</TableHead>
                  <TableHead className="w-32">Tipo</TableHead>
                  <TableHead className="w-24 text-right">%</TableHead>
                  <TableHead className="w-40 text-right">Importe</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shareholders.map((shareholder) => (
                  <TableRow key={shareholder.id} className="group">
                    <TableCell>
                      {getTypeIcon(shareholder.type)}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={shareholder.name}
                        onChange={(e) => onUpdateShareholder(shareholder.id, { name: e.target.value })}
                        className="h-8 border-0 bg-transparent p-0 focus-visible:ring-0"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={shareholder.type}
                        onValueChange={(value: ShareholderType) => 
                          onUpdateShareholder(shareholder.id, { type: value })
                        }
                      >
                        <SelectTrigger className="h-8 w-full text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="persona_fisica">Persona Física</SelectItem>
                          <SelectItem value="sociedad">Sociedad</SelectItem>
                          <SelectItem value="holding">Holding</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={shareholder.percentage || ''}
                          onChange={(e) => onUpdateShareholder(shareholder.id, { 
                            percentage: parseFloat(e.target.value) || 0 
                          })}
                          className="h-8 w-16 text-right"
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(calculateAmount(shareholder.percentage))}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={() => onRemoveShareholder(shareholder.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Add Form Row */}
                {showAddForm && (
                  <TableRow className="bg-muted/30">
                    <TableCell>
                      {getTypeIcon(newType)}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Nombre o razón social..."
                        className="h-8"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddShareholder();
                          if (e.key === 'Escape') setShowAddForm(false);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={newType} onValueChange={(v: ShareholderType) => setNewType(v)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="persona_fisica">Persona Física</SelectItem>
                          <SelectItem value="sociedad">Sociedad</SelectItem>
                          <SelectItem value="holding">Holding</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={newPercentage || ''}
                          onChange={(e) => setNewPercentage(parseFloat(e.target.value) || 0)}
                          placeholder={remainingPercentage.toFixed(1)}
                          className="h-8 w-16 text-right"
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(calculateAmount(newPercentage || remainingPercentage))}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" className="h-7" onClick={handleAddShareholder}>
                        OK
                      </Button>
                    </TableCell>
                  </TableRow>
                )}

                {/* Total Row */}
                {shareholders.length > 0 && (
                  <TableRow className="bg-muted/50 font-semibold border-t-2">
                    <TableCell></TableCell>
                    <TableCell>TOTAL</TableCell>
                    <TableCell></TableCell>
                    <TableCell className={cn(
                      "text-right",
                      isOverAllocated && "text-destructive"
                    )}>
                      {totalPercentage.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right text-primary font-bold">
                      {formatCurrency(calculateAmount(totalPercentage))}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Add button */}
            {!showAddForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="w-full mt-3"
              >
                <Plus className="h-4 w-4 mr-2" />
                Añadir socio o sociedad
              </Button>
            )}

            {/* Remaining percentage hint */}
            {remainingPercentage > 0 && remainingPercentage < 100 && !showAddForm && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Queda {remainingPercentage.toFixed(1)}% por asignar
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
