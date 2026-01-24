// ============================================
// AI TASK DIALOG - Global modal for AI task creation
// ============================================

import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Send, 
  Loader2, 
  X, 
  Check, 
  Lightbulb, 
  AlertCircle,
  History 
} from "lucide-react";
import { useTaskAI } from "@/hooks/useTaskAI";
import { TaskPreviewCard } from "@/components/tasks/TaskPreviewCard";
import type { ParsedTask } from "@/types/taskAI";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useUIStore } from "@/stores/useUIStore";
import { KeyboardHint } from "./KeyboardHint";

const EXAMPLE_PROMPTS = [
  "Preparar teaser de Empresa ABC para la semana que viene",
  "Revisar contrato y coordinar con el cliente",
  "Llamar a Juan para cerrar los términos del LOI",
];

const RECENT_PROMPTS_KEY = "recentAITaskPrompts";
const MAX_RECENT_PROMPTS = 5;

export function AITaskDialog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isAITaskDialogOpen, closeAITaskDialog } = useUIStore();
  
  const [input, setInput] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const [localTasks, setLocalTasks] = useState<ParsedTask[]>([]);
  const [recentPrompts, setRecentPrompts] = useState<string[]>([]);
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

  // Load recent prompts from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_PROMPTS_KEY);
      if (stored) {
        setRecentPrompts(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error loading recent prompts:", e);
    }
  }, [isAITaskDialogOpen]);

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
    enabled: isAITaskDialogOpen,
  });

  // Sync parsed tasks to local state
  useEffect(() => {
    if (parsedTasks.length > 0) {
      setLocalTasks(parsedTasks);
    }
  }, [parsedTasks]);

  // Focus textarea when dialog opens
  useEffect(() => {
    if (isAITaskDialogOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isAITaskDialogOpen]);

  const savePromptToHistory = (prompt: string) => {
    const updated = [prompt, ...recentPrompts.filter(p => p !== prompt)].slice(0, MAX_RECENT_PROMPTS);
    setRecentPrompts(updated);
    localStorage.setItem(RECENT_PROMPTS_KEY, JSON.stringify(updated));
  };

  const handleSubmit = async () => {
    if (!input.trim() || isParsing) return;

    savePromptToHistory(input.trim());
    setSourceText(input);
    setShowPreview(true);
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
    
    if (!user?.id) {
      toast.error('Sesión expirada. Por favor, recarga la página.');
      return;
    }
    
    const success = await createTasks(localTasks, sourceText, user.id);
    if (success) {
      handleClose();
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
    }
  };

  const handleRemoveTask = (index: number) => {
    setLocalTasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTask = (index: number, updatedTask: ParsedTask) => {
    setLocalTasks(prev => prev.map((t, i) => i === index ? updatedTask : t));
  };

  const handleClose = () => {
    setInput("");
    setShowPreview(false);
    setLocalTasks([]);
    setSourceText("");
    reset();
    closeAITaskDialog();
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
    textareaRef.current?.focus();
  };

  return (
    <Dialog open={isAITaskDialogOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-primary/5">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            Crear tareas con IA
            <KeyboardHint shortcut="⌘⇧T" className="ml-auto" />
          </DialogTitle>
          <DialogDescription>
            Describe lo que necesitas hacer y la IA creará las tareas automáticamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Input Area */}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder="Escribe cualquier cosa... 'preparar teaser empresa X para la semana que viene'"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[80px] pr-12 resize-none"
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

          {/* Recent prompts */}
          {!showPreview && !isParsing && recentPrompts.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <History className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">Recientes:</span>
              {recentPrompts.slice(0, 3).map((prompt, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted transition-colors text-xs"
                  onClick={() => handleExampleClick(prompt)}
                >
                  {prompt.length > 35 ? prompt.slice(0, 35) + "..." : prompt}
                </Badge>
              ))}
            </div>
          )}

          {/* Example Prompts */}
          {!showPreview && !isParsing && recentPrompts.length === 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <Lightbulb className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">Ejemplos:</span>
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
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Loading State */}
          {isParsing && (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Analizando con IA...</span>
            </div>
          )}

          {/* Empty State - No tasks generated */}
          {showPreview && !isParsing && localTasks.length === 0 && !error && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">La IA no identificó tareas en tu mensaje</p>
              <p className="text-xs mt-1">Intenta ser más específico sobre lo que necesitas hacer</p>
            </div>
          )}

          {/* Parsed Tasks Preview */}
          {showPreview && localTasks.length > 0 && (
            <div className="space-y-3">
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
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {showPreview && localTasks.length > 0 && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowPreview(false);
                setLocalTasks([]);
                reset();
              }}
              disabled={isCreating}
            >
              <X className="h-4 w-4 mr-1" />
              Volver
            </Button>
            <Button
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
        )}
      </DialogContent>
    </Dialog>
  );
}