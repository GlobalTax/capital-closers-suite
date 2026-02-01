import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";
import { DealSheetEditor } from "./dealsheet/DealSheetEditor";

interface DealSheetDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mandatoId: string;
  mandatoNombre?: string;
}

export function DealSheetDrawer({
  open,
  onOpenChange,
  mandatoId,
  mandatoNombre,
}: DealSheetDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b">
          <DrawerTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Deal Sheet
            {mandatoNombre && (
              <span className="text-muted-foreground font-normal">
                — {mandatoNombre}
              </span>
            )}
          </DrawerTitle>
        </DrawerHeader>
        <ScrollArea className="flex-1 p-6 max-h-[calc(90vh-80px)]">
          <DealSheetEditor mandatoId={mandatoId} mandatoNombre={mandatoNombre} />
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
