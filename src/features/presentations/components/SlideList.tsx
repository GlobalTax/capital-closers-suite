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
  GripVertical, 
  Eye, 
  EyeOff, 
  Copy, 
  Trash2,
  Plus,
  Lock,
  CheckCircle,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isSlideProtected } from "@/hooks/usePresentationVersions";
import type { PresentationSlide, SlideLayout, LAYOUT_DEFINITIONS } from "@/types/presentations";

interface SlideListProps {
  slides: PresentationSlide[];
  selectedSlideId: string | null;
  onSelectSlide: (id: string) => void;
  onReorder: (slideIds: string[]) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, hidden: boolean) => void;
  onAddSlide: (layout: SlideLayout) => void;
}

const LAYOUTS: { value: SlideLayout; label: string }[] = [
  { value: 'title', label: 'Portada' },
  { value: 'bullets', label: 'Puntos' },
  { value: 'stats', label: 'Estadísticas' },
  { value: 'overview', label: 'Visión General' },
  { value: 'team', label: 'Equipo' },
  { value: 'comparison', label: 'Comparativa' },
  { value: 'closing', label: 'Cierre' },
];

export function SlideList({
  slides,
  selectedSlideId,
  onSelectSlide,
  onReorder,
  onDuplicate,
  onDelete,
  onToggleVisibility,
  onAddSlide,
}: SlideListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = slides.findIndex((s) => s.id === active.id);
      const newIndex = slides.findIndex((s) => s.id === over.id);
      const newOrder = arrayMove(slides, oldIndex, newIndex);
      onReorder(newOrder.map((s) => s.id));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {slides.length} slides
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Añadir
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {LAYOUTS.map((layout) => (
              <DropdownMenuItem
                key={layout.value}
                onClick={() => onAddSlide(layout.value)}
              >
                {layout.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={slides.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {slides.map((slide, index) => (
              <SortableSlideItem
                key={slide.id}
                slide={slide}
                index={index}
                isSelected={slide.id === selectedSlideId}
                onSelect={() => onSelectSlide(slide.id)}
                onDuplicate={() => onDuplicate(slide.id)}
                onDelete={() => onDelete(slide.id)}
                onToggleVisibility={() => onToggleVisibility(slide.id, !slide.is_hidden)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

interface SortableSlideItemProps {
  slide: PresentationSlide;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
}

function SortableSlideItem({
  slide,
  index,
  isSelected,
  onSelect,
  onDuplicate,
  onDelete,
  onToggleVisibility,
}: SortableSlideItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isProtected = isSlideProtected(slide);
  const isApproved = slide.approval_status === 'approved';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border bg-card transition-all",
        isSelected && "ring-2 ring-primary",
        isDragging && "opacity-50",
        slide.is_hidden && "opacity-50",
        isProtected && "border-green-500/30 bg-green-50/30 dark:bg-green-950/10"
      )}
    >
      {/* Protection indicator */}
      {isProtected && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute -top-1 -right-1 z-10">
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center shadow-sm",
                isApproved 
                  ? "bg-green-500 text-white" 
                  : "bg-amber-500 text-white"
              )}>
                {isApproved ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            {isApproved ? "Aprobado - No se regenerará" : "Bloqueado - No se regenerará"}
          </TooltipContent>
        </Tooltip>
      )}

      <div
        className="flex items-start gap-2 p-2 cursor-pointer"
        onClick={onSelect}
      >
        {/* Drag handle */}
        <button
          className={cn(
            "mt-1 cursor-grab text-muted-foreground hover:text-foreground",
            isProtected && "cursor-not-allowed opacity-50"
          )}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Slide number */}
        <span className="text-xs text-muted-foreground mt-1 w-5">
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Slide preview */}
        <div className="flex-1 min-w-0">
          <div className={cn(
            "aspect-[16/9] bg-muted rounded border overflow-hidden mb-1",
            isProtected && "border-green-500/50"
          )}>
            <div className="w-full h-full p-2 text-[6px] leading-tight overflow-hidden">
              <div className="font-medium truncate">{slide.headline || 'Sin título'}</div>
              {slide.subline && (
                <div className="text-muted-foreground truncate">{slide.subline}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground capitalize truncate">
              {slide.layout}
            </span>
            {isApproved && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-green-600 border-green-300">
                Aprobado
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          className="p-1 rounded hover:bg-muted"
          title={slide.is_hidden ? "Mostrar" : "Ocultar"}
        >
          {slide.is_hidden ? (
            <EyeOff className="h-3 w-3" />
          ) : (
            <Eye className="h-3 w-3" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1 rounded hover:bg-muted"
          title="Duplicar"
        >
          <Copy className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded hover:bg-muted text-destructive"
          title="Eliminar"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export default SlideList;
