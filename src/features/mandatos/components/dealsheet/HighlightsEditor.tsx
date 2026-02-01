import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface HighlightsEditorProps {
  highlights: string[];
  onChange: (highlights: string[]) => void;
  placeholder?: string;
  maxItems?: number;
}

interface SortableItemProps {
  id: string;
  value: string;
  index: number;
  onRemove: (index: number) => void;
  onChange: (index: number, value: string) => void;
}

function SortableItem({ id, value, index, onRemove, onChange }: SortableItemProps) {
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
      className={`flex items-center gap-2 ${isDragging ? 'opacity-50' : ''}`}
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 flex items-center gap-2">
        <span className="text-sm font-medium text-primary w-5">{index + 1}.</span>
        <Input
          value={value}
          onChange={(e) => onChange(index, e.target.value)}
          placeholder="Escribe un highlight..."
          className="flex-1"
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => onRemove(index)}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function HighlightsEditor({
  highlights,
  onChange,
  placeholder = "Añadir highlight...",
  maxItems = 8,
}: HighlightsEditorProps) {
  const [newItem, setNewItem] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAdd = () => {
    if (newItem.trim() && highlights.length < maxItems) {
      onChange([...highlights, newItem.trim()]);
      setNewItem("");
    }
  };

  const handleRemove = (index: number) => {
    onChange(highlights.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, value: string) => {
    const updated = [...highlights];
    updated[index] = value;
    onChange(updated);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = highlights.findIndex((_, i) => `item-${i}` === active.id);
      const newIndex = highlights.findIndex((_, i) => `item-${i}` === over.id);
      onChange(arrayMove(highlights, oldIndex, newIndex));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={highlights.map((_, i) => `item-${i}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {highlights.map((highlight, index) => (
              <SortableItem
                key={`item-${index}`}
                id={`item-${index}`}
                value={highlight}
                index={index}
                onRemove={handleRemove}
                onChange={handleChange}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {highlights.length < maxItems && (
        <div className="flex items-center gap-2">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAdd}
            disabled={!newItem.trim()}
          >
            <Plus className="w-4 h-4 mr-1" />
            Añadir
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {highlights.length}/{maxItems} highlights · Arrastra para reordenar
      </p>
    </div>
  );
}
