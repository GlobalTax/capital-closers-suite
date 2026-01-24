import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MessageSquare, Check, X } from 'lucide-react';

interface MatchNotesCellProps {
  notes: string | null;
  onSave: (notes: string) => void;
  isLoading?: boolean;
}

export function MatchNotesCell({ notes, onSave, isLoading }: MatchNotesCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editValue, setEditValue] = useState(notes || '');

  const handleOpen = (open: boolean) => {
    if (open) {
      setEditValue(notes || '');
    }
    setIsOpen(open);
  };

  const handleSave = () => {
    onSave(editValue);
    setIsOpen(false);
  };

  const truncatedNotes = notes && notes.length > 40 
    ? `${notes.substring(0, 40)}...` 
    : notes;

  return (
    <Popover open={isOpen} onOpenChange={handleOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-left justify-start font-normal w-full max-w-[200px]"
              >
                {notes ? (
                  <span className="truncate text-xs text-muted-foreground">
                    {truncatedNotes}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                    <MessageSquare className="w-3 h-3" />
                    Añadir nota
                  </span>
                )}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          {notes && notes.length > 40 && (
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs">{notes}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          <Textarea
            placeholder="Notas internas sobre este match..."
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="min-h-[80px] text-sm resize-none"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="h-7 px-2"
            >
              <X className="w-3 h-3 mr-1" />
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isLoading}
              className="h-7 px-2"
            >
              <Check className="w-3 h-3 mr-1" />
              Guardar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
