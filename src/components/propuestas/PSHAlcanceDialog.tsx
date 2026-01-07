import { useState, useEffect } from "react";
import { Check, Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AREAS_DD, type AreaDD, type AlcanceAreaDD } from "@/types/psh";

interface PSHAlcanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  area: AreaDD;
  alcance: AlcanceAreaDD;
  onSave: (alcance: AlcanceAreaDD) => void;
}

export function PSHAlcanceDialog({
  open,
  onOpenChange,
  area,
  alcance,
  onSave,
}: PSHAlcanceDialogProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const areaConfig = AREAS_DD[area];

  useEffect(() => {
    if (open && alcance.alcance) {
      setSelectedItems(alcance.alcance);
    }
  }, [open, alcance]);

  const toggleItem = (item: string) => {
    setSelectedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const selectAll = () => {
    setSelectedItems([...areaConfig.alcanceOpciones]);
  };

  const deselectAll = () => {
    setSelectedItems([]);
  };

  const handleSave = () => {
    onSave({
      ...alcance,
      alcance: selectedItems,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Configurar alcance - {areaConfig.label}
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-end gap-2 mb-2">
          <Button variant="ghost" size="sm" onClick={selectAll}>
            Seleccionar todo
          </Button>
          <Button variant="ghost" size="sm" onClick={deselectAll}>
            Deseleccionar todo
          </Button>
        </div>

        <ScrollArea className="max-h-[300px] pr-4">
          <div className="space-y-3">
            {areaConfig.alcanceOpciones.map((opcion) => {
              const isSelected = selectedItems.includes(opcion);
              return (
                <div
                  key={opcion}
                  className="flex items-center space-x-3 cursor-pointer"
                  onClick={() => toggleItem(opcion)}
                >
                  <Checkbox
                    id={opcion}
                    checked={isSelected}
                    onCheckedChange={() => toggleItem(opcion)}
                  />
                  <Label
                    htmlFor={opcion}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {opcion}
                  </Label>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Check className="h-4 w-4 mr-2" />
            Guardar alcance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
