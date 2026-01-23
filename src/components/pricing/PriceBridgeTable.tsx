import { useState } from "react";
import { Plus, Minus, Trash2, GripVertical, Plus as PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { formatCurrency } from "@/lib/pricing-utils";
import { cn } from "@/lib/utils";
import type { PriceBridgeItem, BridgeOperation } from "@/types/pricing";

interface PriceBridgeTableProps {
  enterpriseValue: number;
  bridgeItems: PriceBridgeItem[];
  equityValue: number;
  onEnterpriseValueChange: (value: number) => void;
  onUpdateItem: (id: string, updates: Partial<PriceBridgeItem>) => void;
  onRemoveItem: (id: string) => void;
  onAddItem: (item: Omit<PriceBridgeItem, 'id'>) => void;
}

export function PriceBridgeTable({
  enterpriseValue,
  bridgeItems,
  equityValue,
  onEnterpriseValueChange,
  onUpdateItem,
  onRemoveItem,
  onAddItem,
}: PriceBridgeTableProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemValue, setNewItemValue] = useState<number>(0);
  const [newItemOperation, setNewItemOperation] = useState<BridgeOperation>('subtract');

  const handleAddItem = () => {
    if (!newItemLabel.trim()) return;
    onAddItem({
      label: newItemLabel,
      value: newItemValue,
      operation: newItemOperation,
      editable: true,
      source: 'manual',
      category: 'other',
    });
    setNewItemLabel('');
    setNewItemValue(0);
    setShowAddForm(false);
  };

  const getSourceBadge = (source: PriceBridgeItem['source']) => {
    switch (source) {
      case 'financial_statement':
        return <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">CCAA</span>;
      case 'calculated':
        return <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Calc</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">Manual</span>;
    }
  };

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>Concepto</TableHead>
            <TableHead className="w-24 text-center">Operación</TableHead>
            <TableHead className="w-40 text-right">Importe</TableHead>
            <TableHead className="w-20 text-center">Fuente</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Enterprise Value Row */}
          <TableRow className="bg-primary/5 font-medium">
            <TableCell></TableCell>
            <TableCell>Enterprise Value</TableCell>
            <TableCell></TableCell>
            <TableCell className="text-right">
              <Input
                type="number"
                value={enterpriseValue || ''}
                onChange={(e) => onEnterpriseValueChange(parseFloat(e.target.value) || 0)}
                className="h-8 w-full text-right font-semibold"
                placeholder="0"
              />
            </TableCell>
            <TableCell className="text-center">
              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Input</span>
            </TableCell>
            <TableCell></TableCell>
          </TableRow>

          {/* Bridge Items */}
          {bridgeItems.map((item) => (
            <TableRow key={item.id} className="group">
              <TableCell>
                <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
              </TableCell>
              <TableCell>
                {item.editable ? (
                  <Input
                    value={item.label}
                    onChange={(e) => onUpdateItem(item.id, { label: e.target.value })}
                    className="h-8 border-0 bg-transparent p-0 focus-visible:ring-0"
                  />
                ) : (
                  <span className="text-muted-foreground">{item.label}</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {item.editable ? (
                  <Select
                    value={item.operation}
                    onValueChange={(value: BridgeOperation) => 
                      onUpdateItem(item.id, { operation: value })
                    }
                  >
                    <SelectTrigger className="h-8 w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add">
                        <span className="flex items-center gap-1 text-emerald-600">
                          <Plus className="h-3 w-3" /> Sumar
                        </span>
                      </SelectItem>
                      <SelectItem value="subtract">
                        <span className="flex items-center gap-1 text-red-600">
                          <Minus className="h-3 w-3" /> Restar
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className={cn(
                    "flex items-center justify-center gap-1",
                    item.operation === 'add' ? "text-emerald-600" : "text-red-600"
                  )}>
                    {item.operation === 'add' ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {item.editable ? (
                  <Input
                    type="number"
                    value={item.value || ''}
                    onChange={(e) => onUpdateItem(item.id, { value: parseFloat(e.target.value) || 0 })}
                    className={cn(
                      "h-8 w-full text-right",
                      item.operation === 'add' ? "text-emerald-600" : "text-red-600"
                    )}
                    placeholder="0"
                  />
                ) : (
                  <span className={cn(
                    "font-medium",
                    item.operation === 'add' ? "text-emerald-600" : "text-red-600"
                  )}>
                    {item.operation === 'add' ? '+' : '-'}{formatCurrency(item.value)}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {getSourceBadge(item.source)}
              </TableCell>
              <TableCell>
                {item.source === 'manual' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}

          {/* Add Item Form */}
          {showAddForm && (
            <TableRow className="bg-muted/30">
              <TableCell></TableCell>
              <TableCell>
                <Input
                  value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                  placeholder="Nuevo concepto..."
                  className="h-8"
                  autoFocus
                />
              </TableCell>
              <TableCell className="text-center">
                <Select value={newItemOperation} onValueChange={(v: BridgeOperation) => setNewItemOperation(v)}>
                  <SelectTrigger className="h-8 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Sumar</SelectItem>
                    <SelectItem value="subtract">Restar</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-right">
                <Input
                  type="number"
                  value={newItemValue || ''}
                  onChange={(e) => setNewItemValue(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="h-8 text-right"
                />
              </TableCell>
              <TableCell></TableCell>
              <TableCell>
                <Button size="sm" className="h-7" onClick={handleAddItem}>
                  OK
                </Button>
              </TableCell>
            </TableRow>
          )}

          {/* Equity Value Result */}
          <TableRow className="bg-primary/10 font-bold text-lg border-t-2">
            <TableCell></TableCell>
            <TableCell>EQUITY VALUE</TableCell>
            <TableCell></TableCell>
            <TableCell className="text-right text-primary text-xl">
              {formatCurrency(equityValue)}
            </TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {!showAddForm && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(true)}
          className="w-full"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Añadir concepto
        </Button>
      )}
    </div>
  );
}
