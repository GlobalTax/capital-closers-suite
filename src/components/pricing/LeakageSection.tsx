import { useState } from "react";
import { Plus, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/pricing-utils";
import { cn } from "@/lib/utils";
import type { LeakageItem } from "@/types/pricing";

interface LeakageSectionProps {
  lockedBoxDate: string | undefined;
  leakageItems: LeakageItem[];
  totalLeakage: number;
  permittedLeakage: number;
  onDateChange: (date: string) => void;
  onAddItem: (item: Omit<LeakageItem, 'id'>) => void;
  onRemoveItem: (id: string) => void;
}

export function LeakageSection({
  lockedBoxDate,
  leakageItems,
  totalLeakage,
  permittedLeakage,
  onDateChange,
  onAddItem,
  onRemoveItem,
}: LeakageSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState<number>(0);
  const [newDate, setNewDate] = useState('');
  const [newIsPermitted, setNewIsPermitted] = useState(false);

  const netLeakage = totalLeakage - permittedLeakage;

  const handleAdd = () => {
    if (!newLabel.trim() || !newValue) return;
    onAddItem({
      label: newLabel,
      value: newValue,
      date: newDate,
      isPermitted: newIsPermitted,
    });
    setNewLabel('');
    setNewValue(0);
    setNewDate('');
    setNewIsPermitted(false);
    setShowAddForm(false);
  };

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">Leakage (Locked Box)</h4>
      </div>

      {/* Locked Box Date */}
      <div className="space-y-2">
        <Label htmlFor="locked-box-date" className="text-xs">
          Fecha Locked Box
        </Label>
        <Input
          id="locked-box-date"
          type="date"
          value={lockedBoxDate || ''}
          onChange={(e) => onDateChange(e.target.value)}
          className="h-9 w-48"
        />
      </div>

      {/* Leakage Items List */}
      {leakageItems.length > 0 && (
        <div className="space-y-2">
          {leakageItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center justify-between p-2 rounded-lg",
                item.isPermitted ? "bg-emerald-500/10" : "bg-amber-500/10"
              )}
            >
              <div className="flex items-center gap-2">
                {item.isPermitted ? (
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                )}
                <div>
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.date && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({item.date})
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-medium",
                  item.isPermitted ? "text-emerald-600" : "text-amber-600"
                )}>
                  {formatCurrency(item.value)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onRemoveItem(item.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Form */}
      {showAddForm ? (
        <div className="grid grid-cols-4 gap-2 items-end border-t pt-3">
          <div className="col-span-2">
            <Label className="text-xs">Concepto</Label>
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Dividendo, salario..."
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs">Importe</Label>
            <Input
              type="number"
              value={newValue || ''}
              onChange={(e) => setNewValue(parseFloat(e.target.value) || 0)}
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs">Fecha</Label>
            <Input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <Checkbox
              id="permitted"
              checked={newIsPermitted}
              onCheckedChange={(checked) => setNewIsPermitted(!!checked)}
            />
            <Label htmlFor="permitted" className="text-xs">
              Leakage permitido
            </Label>
          </div>
          <div className="col-span-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleAdd}>
              Añadir
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Añadir leakage
        </Button>
      )}

      {/* Summary */}
      {leakageItems.length > 0 && (
        <div className="border-t pt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Leakage:</span>
            <span className="text-amber-600">{formatCurrency(totalLeakage)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Leakage Permitido:</span>
            <span className="text-emerald-600">{formatCurrency(permittedLeakage)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Leakage Neto:</span>
            <span className={netLeakage > 0 ? "text-red-600" : "text-emerald-600"}>
              {formatCurrency(netLeakage)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
