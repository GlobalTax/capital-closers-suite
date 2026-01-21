import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Loader2, Check, Calendar as CalendarIcon, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface InlineEditDateProps {
  value: string | null | undefined;
  onSave: (newValue: string | null) => Promise<void>;
  className?: string;
  placeholder?: string;
  allowClear?: boolean;
}

export function InlineEditDate({
  value,
  onSave,
  className,
  placeholder = "Sin fecha",
  allowClear = true,
}: InlineEditDateProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const dateValue = value ? parseISO(value) : undefined;

  const handleSelect = useCallback(async (date: Date | undefined) => {
    const newValue = date ? format(date, 'yyyy-MM-dd') : null;
    if (newValue === value) {
      setIsOpen(false);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(newValue);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    } finally {
      setIsSaving(false);
      setIsOpen(false);
    }
  }, [value, onSave]);

  const handleClear = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value) return;
    setIsSaving(true);
    try {
      await onSave(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    } finally {
      setIsSaving(false);
    }
  }, [value, onSave]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 text-xs hover:bg-muted/60 transition-colors rounded px-1.5 py-0.5 -mx-1 group",
            !value && "text-muted-foreground",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <CalendarIcon className="h-3 w-3" />
          {value ? format(parseISO(value), "d MMM yyyy", { locale: es }) : placeholder}
          {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
          {showSuccess && <Check className="w-3 h-3 text-green-500" />}
          {allowClear && value && !isSaving && (
            <X 
              className="w-3 h-3 opacity-0 group-hover:opacity-70 hover:text-destructive transition-opacity" 
              onClick={handleClear}
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          locale={es}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
