import { useState } from "react";
import { Trash2, GripVertical, Star, Clock, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { DailyPlanItem, DailyPlanItemPriority } from "@/types/dailyPlans";

interface DailyPlanItemRowProps {
  item: DailyPlanItem;
  canEdit: boolean;
  mandatoName?: string;
  onUpdate: (updates: Partial<DailyPlanItem>) => void;
  onDelete: () => void;
}

const priorityConfig: Record<DailyPlanItemPriority, { label: string; class: string }> = {
  urgente: { label: 'Urgente', class: 'bg-red-500/10 text-red-600 border-red-500/30' },
  alta: { label: 'Alta', class: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  media: { label: 'Media', class: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  baja: { label: 'Baja', class: 'bg-gray-500/10 text-gray-600 border-gray-500/30' },
};

export function DailyPlanItemRow({ 
  item, 
  canEdit, 
  mandatoName,
  onUpdate, 
  onDelete 
}: DailyPlanItemRowProps) {
  const [title, setTitle] = useState(item.title);
  const [estimatedMinutes, setEstimatedMinutes] = useState(item.estimated_minutes);
  
  const handleTitleBlur = () => {
    if (title !== item.title && title.trim()) {
      onUpdate({ title: title.trim() });
    }
  };
  
  const handleMinutesChange = (value: string) => {
    const mins = parseInt(value) || 0;
    setEstimatedMinutes(mins);
    if (mins !== item.estimated_minutes) {
      onUpdate({ estimated_minutes: mins });
    }
  };
  
  const hoursDisplay = (estimatedMinutes / 60).toFixed(1);
  
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border bg-card transition-all group",
      item.completed && "opacity-60 bg-muted/50",
      item.assigned_by_admin && "border-amber-500/30 bg-amber-500/5"
    )}>
      {/* Drag handle (visual only for now) */}
      {canEdit && (
        <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
      )}
      
      {/* Completed checkbox */}
      <Checkbox
        checked={item.completed}
        onCheckedChange={(checked) => onUpdate({ completed: checked as boolean })}
        disabled={!canEdit}
      />
      
      {/* Admin assigned indicator */}
      {item.assigned_by_admin && (
        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
      )}
      
      {/* Title */}
      <div className="flex-1 min-w-0">
        {canEdit ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className={cn(
              "h-8 border-0 bg-transparent p-0 focus-visible:ring-0",
              item.completed && "line-through"
            )}
            placeholder="Título de la tarea..."
          />
        ) : (
          <span className={cn(
            "text-sm",
            item.completed && "line-through text-muted-foreground"
          )}>
            {item.title}
          </span>
        )}
        
        {/* Mandato badge */}
        {mandatoName && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{mandatoName}</span>
          </div>
        )}
      </div>
      
      {/* Estimated time */}
      <div className="flex items-center gap-1">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        {canEdit ? (
          <Input
            type="number"
            value={estimatedMinutes}
            onChange={(e) => handleMinutesChange(e.target.value)}
            className="w-16 h-7 text-center text-xs"
            min={15}
            step={15}
          />
        ) : (
          <span className="text-sm font-mono">{hoursDisplay}h</span>
        )}
      </div>
      
      {/* Priority */}
      {canEdit ? (
        <Select
          value={item.priority}
          onValueChange={(value) => onUpdate({ priority: value as DailyPlanItemPriority })}
        >
          <SelectTrigger className="w-24 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(priorityConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Badge variant="outline" className={priorityConfig[item.priority].class}>
          {priorityConfig[item.priority].label}
        </Badge>
      )}
      
      {/* Delete button */}
      {canEdit && !item.assigned_by_admin && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      )}
    </div>
  );
}
