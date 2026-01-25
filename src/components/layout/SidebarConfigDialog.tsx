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
import { GripVertical, RotateCcw, Settings, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

interface SortableSubItemProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

function SortableSubItem({ id, label, icon }: SortableSubItemProps) {
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
        "flex items-center gap-2 p-2 bg-muted/50 border rounded-md ml-4",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-3 w-3" />
      </button>
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

interface MenuGroupWithItems {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: Array<{ id: string; title: string; icon: React.ReactNode }>;
}

interface SortableGroupWithItemsProps {
  group: MenuGroupWithItems;
  orderedItems: Array<{ id: string; title: string; icon: React.ReactNode }>;
  onItemDragEnd: (event: DragEndEvent) => void;
  sensors: ReturnType<typeof useSensors>;
}

function SortableGroupWithItems({
  group,
  orderedItems,
  onItemDragEnd,
  sensors,
}: SortableGroupWithItemsProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });
  const [isOpen, setIsOpen] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border rounded-lg bg-card overflow-hidden",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary"
      )}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center gap-3 p-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          {group.icon && <span className="text-muted-foreground">{group.icon}</span>}
          <span className="text-sm font-medium flex-1">{group.label}</span>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="px-3 pb-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onItemDragEnd}
            >
              <SortableContext
                items={orderedItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {orderedItems.map((item) => (
                    <SortableSubItem
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
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

interface SidebarConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topLevelItems: Array<{ id: string; title: string; icon: React.ReactNode }>;
  menuGroups: Array<MenuGroupWithItems>;
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

  const getOrderedGroupItems = (groupId: string, items: Array<{ id: string; title: string; icon: React.ReactNode }>) => {
    const order = sidebarConfig.groupItemsOrder[groupId] || [];
    return [...items].sort((a, b) => {
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
  const [orderedGroupItems, setOrderedGroupItems] = useState<Record<string, Array<{ id: string; title: string; icon: React.ReactNode }>>>(() => {
    const result: Record<string, Array<{ id: string; title: string; icon: React.ReactNode }>> = {};
    menuGroups.forEach((group) => {
      result[group.id] = getOrderedGroupItems(group.id, group.items);
    });
    return result;
  });

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

  const handleGroupItemDragEnd = (groupId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const items = orderedGroupItems[groupId] || [];
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const newOrder = arrayMove(items, oldIndex, newIndex);
    
    setOrderedGroupItems((prev) => ({ ...prev, [groupId]: newOrder }));
    setSidebarConfig({
      groupItemsOrder: {
        ...sidebarConfig.groupItemsOrder,
        [groupId]: newOrder.map((item) => item.id),
      },
    });
    toast.success("Orden actualizado");
  };

  const handleReset = () => {
    resetSidebarConfig();
    setOrderedTopLevel(topLevelItems);
    setOrderedGroups(menuGroups);
    const resetItems: Record<string, Array<{ id: string; title: string; icon: React.ReactNode }>> = {};
    menuGroups.forEach((group) => {
      resetItems[group.id] = group.items;
    });
    setOrderedGroupItems(resetItems);
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
            Arrastra los elementos para reordenar el menú lateral. Expande los grupos para ordenar sus items.
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

          {/* Menu Groups with Items */}
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
                    <SortableGroupWithItems
                      key={group.id}
                      group={group}
                      orderedItems={orderedGroupItems[group.id] || group.items}
                      onItemDragEnd={handleGroupItemDragEnd(group.id)}
                      sensors={sensors}
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
