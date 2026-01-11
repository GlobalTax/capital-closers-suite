import { useState } from "react";
import { useKanbanConfig, KanbanFase } from "@/hooks/useKanbanConfig";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface KanbanConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SortableFaseItemProps {
  fase: KanbanFase;
  editingId: string | null;
  editLabel: string;
  editColor: string;
  setEditLabel: (value: string) => void;
  setEditColor: (value: string) => void;
  onStartEdit: (fase: KanbanFase) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onToggle: (id: string, activo: boolean) => void;
  colorOptions: { value: string; label: string }[];
}

function SortableFaseItem({
  fase,
  editingId,
  editLabel,
  editColor,
  setEditLabel,
  setEditColor,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onToggle,
  colorOptions,
}: SortableFaseItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fase.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border",
        fase.color,
        isDragging && "shadow-lg"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {editingId === fase.id ? (
        <>
          <div className="flex-1 space-y-2">
            <Input
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              placeholder="Nombre de la fase"
            />
            <select
              value={editColor}
              onChange={(e) => setEditColor(e.target.value)}
              className="w-full p-2 rounded-md border bg-background"
            >
              {colorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <Button size="sm" onClick={() => onSaveEdit(fase.id)}>
            Guardar
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancelEdit}>
            Cancelar
          </Button>
        </>
      ) : (
        <>
          <div className="flex-1">
            <p className="font-medium">{fase.label}</p>
            <p className="text-xs text-muted-foreground">ID: {fase.fase_id}</p>
          </div>
          <Switch
            checked={fase.activo}
            onCheckedChange={(checked) => onToggle(fase.id, checked)}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStartEdit(fase)}
          >
            Editar
          </Button>
        </>
      )}
    </div>
  );
}

export function KanbanConfigDialog({ open, onOpenChange }: KanbanConfigDialogProps) {
  const { fases, updateFase, createFase, reorderFases, toggleFase } = useKanbanConfig();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editColor, setEditColor] = useState("");
  const [newFaseId, setNewFaseId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("bg-slate-100 dark:bg-slate-800");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = fases.findIndex((f) => f.id === active.id);
      const newIndex = fases.findIndex((f) => f.id === over?.id);
      const newOrder = arrayMove(fases, oldIndex, newIndex);

      reorderFases.mutate(
        newOrder.map((fase, index) => ({ id: fase.id, orden: index }))
      );
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editLabel.trim()) return;

    await updateFase.mutateAsync({
      id,
      label: editLabel,
      color: editColor,
    });

    setEditingId(null);
  };

  const handleCreateFase = async () => {
    if (!newFaseId.trim() || !newLabel.trim()) return;

    const maxOrden = Math.max(...fases.map((f) => f.orden), 0);

    await createFase.mutateAsync({
      fase_id: newFaseId,
      label: newLabel,
      color: newColor,
      orden: maxOrden + 1,
      activo: true,
    });

    setNewFaseId("");
    setNewLabel("");
    setNewColor("bg-slate-100 dark:bg-slate-800");
  };

  const colorOptions = [
    { value: "bg-slate-100 dark:bg-slate-800", label: "Gris" },
    { value: "bg-blue-50 dark:bg-blue-950", label: "Azul" },
    { value: "bg-amber-50 dark:bg-amber-950", label: "Ámbar" },
    { value: "bg-green-50 dark:bg-green-950", label: "Verde" },
    { value: "bg-red-50 dark:bg-red-950", label: "Rojo" },
    { value: "bg-purple-50 dark:bg-purple-950", label: "Púrpura" },
    { value: "bg-pink-50 dark:bg-pink-950", label: "Rosa" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Fases del Kanban</DialogTitle>
          <DialogDescription>
            Personaliza las columnas que aparecen en tu vista Kanban
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Fases existentes */}
          <div className="space-y-3">
            <h3 className="font-medium">Fases Actuales</h3>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={fases.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {fases.map((fase) => (
                  <SortableFaseItem
                    key={fase.id}
                    fase={fase}
                    editingId={editingId}
                    editLabel={editLabel}
                    editColor={editColor}
                    setEditLabel={setEditLabel}
                    setEditColor={setEditColor}
                    onStartEdit={(f) => {
                      setEditingId(f.id);
                      setEditLabel(f.label);
                      setEditColor(f.color);
                    }}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={() => setEditingId(null)}
                    onToggle={(id, activo) => toggleFase.mutate({ id, activo })}
                    colorOptions={colorOptions}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* Nueva fase */}
          <div className="space-y-3 pt-6 border-t">
            <h3 className="font-medium">Agregar Nueva Fase</h3>
            <div className="space-y-3">
              <div>
                <Label>ID de la Fase</Label>
                <Input
                  value={newFaseId}
                  onChange={(e) => setNewFaseId(e.target.value)}
                  placeholder="ej: due_diligence"
                />
              </div>
              <div>
                <Label>Nombre</Label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="ej: Due Diligence"
                />
              </div>
              <div>
                <Label>Color</Label>
                <select
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-full p-2 rounded-md border bg-background"
                >
                  {colorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={handleCreateFase} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Fase
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
