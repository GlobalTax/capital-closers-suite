import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/useAppStore";
import { GripVertical, RotateCcw, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SortableItemProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

function SortableItem({ id, label, icon }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-card border rounded-lg",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

interface SidebarConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topLevelItems: Array<{ id: string; title: string; icon: React.ReactNode }>;
  menuGroups: Array<{ id: string; label: string; icon: React.ReactNode }>;
}

export function SidebarConfigDialog({
  open,
  onOpenChange,
  topLevelItems,
  menuGroups,
}: SidebarConfigDialogProps) {
  const { sidebarConfig, setSidebarConfig, resetSidebarConfig } = useAppStore();

  // Initialize local state from store
  const getOrderedTopLevel = () => {
    const order = sidebarConfig.topLevelOrder;
    return [...topLevelItems].sort((a, b) => {
      const indexA = order.indexOf(a.id);
      const indexB = order.indexOf(b.id);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  };

  const getOrderedGroups = () => {
    const order = sidebarConfig.groupOrder;
    return [...menuGroups].sort((a, b) => {
      const indexA = order.indexOf(a.id);
      const indexB = order.indexOf(b.id);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  };

  const [orderedTopLevel, setOrderedTopLevel] = useState(getOrderedTopLevel);
  const [orderedGroups, setOrderedGroups] = useState(getOrderedGroups);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleTopLevelDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedTopLevel.findIndex((item) => item.id === active.id);
    const newIndex = orderedTopLevel.findIndex((item) => item.id === over.id);
    const newOrder = arrayMove(orderedTopLevel, oldIndex, newIndex);
    
    setOrderedTopLevel(newOrder);
    setSidebarConfig({ topLevelOrder: newOrder.map((item) => item.id) });
    toast.success("Orden actualizado");
  };

  const handleGroupsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedGroups.findIndex((item) => item.id === active.id);
    const newIndex = orderedGroups.findIndex((item) => item.id === over.id);
    const newOrder = arrayMove(orderedGroups, oldIndex, newIndex);
    
    setOrderedGroups(newOrder);
    setSidebarConfig({ groupOrder: newOrder.map((item) => item.id) });
    toast.success("Orden actualizado");
  };

  const handleReset = () => {
    resetSidebarConfig();
    setOrderedTopLevel(topLevelItems);
    setOrderedGroups(menuGroups);
    toast.success("Configuración restablecida");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurar Sidebar
          </DialogTitle>
          <DialogDescription>
            Arrastra los elementos para reordenar el menú lateral.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Top Level Items */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Accesos directos
            </h3>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleTopLevelDragEnd}
            >
              <SortableContext
                items={orderedTopLevel.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {orderedTopLevel.map((item) => (
                    <SortableItem
                      key={item.id}
                      id={item.id}
                      label={item.title}
                      icon={item.icon}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Menu Groups */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Grupos del menú
            </h3>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleGroupsDragEnd}
            >
              <SortableContext
                items={orderedGroups.map((group) => group.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {orderedGroups.map((group) => (
                    <SortableItem
                      key={group.id}
                      id={group.id}
                      label={group.label}
                      icon={group.icon}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restablecer
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Listo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
