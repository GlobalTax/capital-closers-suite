import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, Loader2, X, Check, Lightbulb } from "lucide-react";
import { useTaskAI } from "@/hooks/useTaskAI";
import { TaskPreviewCard } from "./TaskPreviewCard";
import type { ParsedTask } from "@/types/taskAI";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface TaskCommandBarProps {
  onSuccess?: () => void;
  className?: string;
}

const EXAMPLE_PROMPTS = [
  "Preparar teaser de Empresa ABC para la semana que viene",
  "Revisar contrato y coordinar con el cliente",
  "Llamar a Juan para cerrar los términos del LOI",
  "Todo lo del due diligence de la operación TechCorp",
];

export function TaskCommandBar({ onSuccess, className }: TaskCommandBarProps) {
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const [localTasks, setLocalTasks] = useState<ParsedTask[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    parseInput,
    createTasks,
    parsedTasks,
    reasoning,
    isParsing,
    isCreating,
    error,
    reset,
  } = useTaskAI();

  // Fetch available users for inline assignment
  const { data: availableUsers = [] } = useQuery({
    queryKey: ['admin-users-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id, full_name')
        .eq('is_active', true)
        .order('full_name');
      
      if (error) throw error;
      return (data || []).map(u => ({ id: u.user_id, name: u.full_name || 'Sin nombre' }));
    },
    staleTime: 5 * 60 * 1000,
  });

  // Sync parsed tasks to local state
  useEffect(() => {
    if (parsedTasks.length > 0) {
      setLocalTasks(parsedTasks);
    }
  }, [parsedTasks]);

  const handleSubmit = async () => {
    if (!input.trim() || isParsing) return;

    setSourceText(input);
    setIsExpanded(true);
    await parseInput(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCreateTasks = async () => {
    if (localTasks.length === 0) return;
    
    const success = await createTasks(localTasks, sourceText);
    if (success) {
      setInput("");
      setIsExpanded(false);
      setLocalTasks([]);
      setSourceText("");
      reset();
      onSuccess?.();
    }
  };

  const handleRemoveTask = (index: number) => {
    setLocalTasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTask = (index: number, updatedTask: ParsedTask) => {
    setLocalTasks(prev => prev.map((t, i) => i === index ? updatedTask : t));
  };

  const handleCancel = () => {
    setInput("");
    setIsExpanded(false);
    setLocalTasks([]);
    setSourceText("");
    reset();
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
    textareaRef.current?.focus();
  };

  return (
    <Card className={cn("p-4 transition-all", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-primary/5">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="font-medium text-sm">Crear tareas con IA</h3>
          <p className="text-xs text-muted-foreground">
            Describe lo que necesitas hacer y la IA creará las tareas
          </p>
        </div>
      </div>

      {/* Input Area */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          placeholder="Escribe cualquier cosa... 'preparar teaser empresa X para la semana que viene'"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[60px] pr-12 resize-none"
          disabled={isParsing}
        />
        <Button
          size="icon"
          className="absolute right-2 bottom-2 h-8 w-8"
          onClick={handleSubmit}
          disabled={!input.trim() || isParsing}
        >
          {isParsing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Example Prompts */}
      {!isExpanded && !isParsing && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Lightbulb className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          {EXAMPLE_PROMPTS.slice(0, 2).map((example, i) => (
            <Badge
              key={i}
              variant="outline"
              className="cursor-pointer hover:bg-muted transition-colors text-xs"
              onClick={() => handleExampleClick(example)}
            >
              {example.length > 40 ? example.slice(0, 40) + "..." : example}
            </Badge>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Parsed Tasks Preview */}
      {isExpanded && localTasks.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <Sparkles className="h-3 w-3 mr-1" />
                {localTasks.length} tarea{localTasks.length > 1 ? 's' : ''} generada{localTasks.length > 1 ? 's' : ''}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Haz clic en cualquier campo para editarlo
              </span>
            </div>
          </div>

          {/* Reasoning */}
          {reasoning && (
            <p className="text-xs text-muted-foreground italic bg-muted/50 p-2 rounded">
              💡 {reasoning}
            </p>
          )}

          {/* Task Cards */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {localTasks.map((task, index) => (
              <TaskPreviewCard
                key={index}
                task={task}
                index={index}
                editable={true}
                availableUsers={availableUsers}
                onRemove={() => handleRemoveTask(index)}
                onUpdate={(updatedTask) => handleUpdateTask(index, updatedTask)}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isCreating}
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreateTasks}
              disabled={isCreating || localTasks.length === 0}
              className="flex-1"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Crear {localTasks.length} tarea{localTasks.length > 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isParsing && (
        <div className="mt-4 flex items-center justify-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Analizando con IA...</span>
        </div>
      )}
    </Card>
  );
}
