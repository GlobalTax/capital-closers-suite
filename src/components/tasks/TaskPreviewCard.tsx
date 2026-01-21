import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, User, X, Briefcase, Building2, Sparkles, Pencil, Check } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { ParsedTask } from "@/types/taskAI";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InlineEditDate } from "@/components/shared/InlineEditDate";

interface AvailableUser {
  id: string;
  name: string;
}

interface TaskPreviewCardProps {
  task: ParsedTask;
  index: number;
  onRemove?: () => void;
  onUpdate?: (updatedTask: ParsedTask) => void;
  editable?: boolean;
  availableUsers?: AvailableUser[];
  assignmentConfidence?: number;
  assignmentReason?: string;
}

const PRIORITY_OPTIONS = [
  { value: 'urgente', label: 'Urgente' },
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
] as const;

export function TaskPreviewCard({ 
  task, 
  index, 
  onRemove, 
  onUpdate,
  editable = false,
  availableUsers = [],
  assignmentConfidence, 
  assignmentReason 
}: TaskPreviewCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente': return 'destructive';
      case 'alta': return 'default';
      case 'media': return 'secondary';
      case 'baja': return 'outline';
      default: return 'secondary';
    }
  };

  const getContextIcon = (contextType: string) => {
    switch (contextType) {
      case 'mandato': return <Briefcase className="h-3 w-3" />;
      case 'cliente': return <Building2 className="h-3 w-3" />;
      default: return null;
    }
  };

  const handleTitleSave = useCallback(() => {
    if (editedTitle.trim() && editedTitle !== task.title && onUpdate) {
      onUpdate({ ...task, title: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  }, [editedTitle, task, onUpdate]);

  const handlePriorityChange = useCallback((newPriority: string) => {
    if (onUpdate) {
      onUpdate({ ...task, priority: newPriority as ParsedTask['priority'] });
    }
  }, [task, onUpdate]);

  const handleDateChange = useCallback(async (newDate: string | null) => {
    if (onUpdate) {
      onUpdate({ ...task, due_date: newDate });
    }
  }, [task, onUpdate]);

  const handleAssigneeChange = useCallback((userId: string) => {
    if (onUpdate) {
      const user = availableUsers.find(u => u.id === userId);
      onUpdate({ 
        ...task, 
        assigned_to_id: userId === 'none' ? null : userId,
        assigned_to_name: userId === 'none' ? null : (user?.name || null)
      });
    }
  }, [task, onUpdate, availableUsers]);

  return (
    <div className={cn(
      "p-4 bg-card border rounded-lg transition-all hover:shadow-md",
      "animate-in fade-in-50 slide-in-from-bottom-2 duration-300",
    )} style={{ animationDelay: `${index * 100}ms` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {editable && isEditingTitle ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSave();
                    if (e.key === 'Escape') {
                      setEditedTitle(task.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  className="h-6 text-sm font-medium"
                  autoFocus
                />
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleTitleSave}>
                  <Check className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <h4 
                className={cn(
                  "font-medium text-sm truncate",
                  editable && "cursor-pointer hover:text-primary group inline-flex items-center gap-1"
                )}
                onClick={() => editable && setIsEditingTitle(true)}
              >
                {task.title}
                {editable && <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50" />}
              </h4>
            )}
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20 shrink-0">
              IA
            </Badge>
          </div>
          
          {task.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 text-xs items-center">
            {editable ? (
              <Select value={task.priority} onValueChange={handlePriorityChange}>
                <SelectTrigger className="h-6 w-auto text-xs border-none p-0 shadow-none hover:bg-muted/50 rounded">
                  <Badge variant={getPriorityColor(task.priority)} className="text-xs cursor-pointer">
                    {task.priority}
                  </Badge>
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                {task.priority}
              </Badge>
            )}

            {editable ? (
              <InlineEditDate
                value={task.due_date}
                onSave={handleDateChange}
                placeholder="Añadir fecha"
              />
            ) : task.due_date && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{format(parseISO(task.due_date), "dd MMM", { locale: es })}</span>
              </div>
            )}

            {task.estimated_minutes > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{task.estimated_minutes} min</span>
              </div>
            )}

            {editable && availableUsers.length > 0 ? (
              <Select 
                value={task.assigned_to_id || 'none'} 
                onValueChange={handleAssigneeChange}
              >
                <SelectTrigger className="h-6 w-auto text-xs border-none p-0 shadow-none hover:bg-muted/50 rounded">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{task.assigned_to_name || 'Sin asignar'}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">Sin asignar</SelectItem>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id} className="text-xs">
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : task.assigned_to_name && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "flex items-center gap-1",
                      assignmentConfidence && assignmentConfidence > 0.7 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-muted-foreground"
                    )}>
                      <User className="h-3 w-3" />
                      <span>{task.assigned_to_name}</span>
                      {assignmentConfidence && (
                        <Sparkles className="h-2.5 w-2.5 text-primary" />
                      )}
                    </div>
                  </TooltipTrigger>
                  {assignmentReason && (
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-xs">{assignmentReason}</p>
                      {assignmentConfidence && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Confianza: {Math.round(assignmentConfidence * 100)}%
                        </p>
                      )}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}

            {task.context_type !== 'general' && (
              <div className="flex items-center gap-1 text-muted-foreground">
                {getContextIcon(task.context_type)}
                <span className="capitalize">{task.context_hint || task.context_type}</span>
              </div>
            )}

            {task.suggested_fase && (
              <Badge variant="outline" className="text-[10px]">
                {task.suggested_fase}
              </Badge>
            )}
          </div>
        </div>

        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
