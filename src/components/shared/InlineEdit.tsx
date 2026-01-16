import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Loader2, Check, Pencil } from "lucide-react";

interface InlineEditTextProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  className?: string;
  placeholder?: string;
}

export function InlineEditText({
  value,
  onSave,
  className,
  placeholder = "—",
}: InlineEditTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = useCallback(async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(editValue);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  }, [editValue, value, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={cn("h-7 text-xs px-2 py-1 w-20", className)}
          disabled={isSaving}
        />
        {isSaving && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
      </div>
    );
  }

  return (
    <span
      className={cn(
        "cursor-pointer hover:text-primary transition-colors inline-flex items-center gap-1 group",
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
    >
      {value || <span className="text-muted-foreground">{placeholder}</span>}
      {showSuccess ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
      )}
    </span>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

interface InlineEditSelectProps {
  value: string;
  options: SelectOption[];
  onSave: (newValue: string) => Promise<void>;
  renderDisplay?: (value: string) => React.ReactNode;
  placeholder?: string;
  className?: string;
}

export function InlineEditSelect({
  value,
  options,
  onSave,
  renderDisplay,
  placeholder = "Seleccionar",
  className,
}: InlineEditSelectProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleChange = useCallback(async (newValue: string) => {
    if (newValue === value) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(newValue);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  }, [value, onSave]);

  // Close on click outside
  useEffect(() => {
    if (!isEditing) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsEditing(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditing]);

  if (isEditing) {
    return (
      <div ref={containerRef} className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Select
          value={value}
          onValueChange={handleChange}
          disabled={isSaving}
          open={true}
          onOpenChange={(open) => !open && setIsEditing(false)}
        >
          <SelectTrigger className={cn("h-7 text-xs w-auto min-w-[100px]", className)}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isSaving && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
      </div>
    );
  }

  const displayContent = renderDisplay
    ? renderDisplay(value)
    : options.find((o) => o.value === value)?.label || value || <span className="text-muted-foreground">{placeholder}</span>;

  return (
    <span
      className={cn(
        "cursor-pointer hover:opacity-80 transition-opacity inline-flex items-center gap-1 group",
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
    >
      {displayContent}
      {showSuccess ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
      )}
    </span>
  );
}

interface InlineEditNumberProps {
  value: number | null | undefined;
  onSave: (newValue: number | null) => Promise<void>;
  format?: (value: number | null | undefined) => string;
  className?: string;
  placeholder?: string;
}

export function InlineEditNumber({
  value,
  onSave,
  format,
  className,
  placeholder = "—",
}: InlineEditNumberProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value?.toString() || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value?.toString() || "");
  }, [value]);

  const handleSave = useCallback(async () => {
    const numValue = editValue ? parseFloat(editValue.replace(/[^\d.-]/g, "")) : null;
    if (numValue === value) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(numValue);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  }, [editValue, value, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(value?.toString() || "");
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={cn("h-7 text-xs px-2 py-1 w-24 font-mono", className)}
          disabled={isSaving}
          placeholder="0"
        />
        {isSaving && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
      </div>
    );
  }

  const displayValue = format ? format(value) : (value?.toLocaleString("es-ES") || placeholder);

  return (
    <span
      className={cn(
        "cursor-pointer hover:bg-muted/60 hover:text-primary transition-all inline-flex items-center gap-1.5 group font-mono rounded px-1.5 py-0.5 -mx-1.5",
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
    >
      {value ? displayValue : <span className="text-muted-foreground/70 italic text-sm">Añadir...</span>}
      {showSuccess ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <Pencil className="w-3 h-3 text-muted-foreground/50 group-hover:text-primary transition-colors" />
      )}
    </span>
  );
}

interface InlineEditCheckboxProps {
  checked: boolean;
  onSave: (newValue: boolean) => Promise<void>;
  label?: React.ReactNode;
  className?: string;
}

export function InlineEditCheckbox({
  checked,
  onSave,
  label,
  className,
}: InlineEditCheckboxProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = useCallback(async (newValue: boolean) => {
    if (newValue === checked) return;
    setIsSaving(true);
    try {
      await onSave(newValue);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    } finally {
      setIsSaving(false);
    }
  }, [checked, onSave]);

  return (
    <div 
      className={cn("flex items-center gap-1.5", className)}
      onClick={(e) => e.stopPropagation()}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(val) => handleChange(!!val)}
        disabled={isSaving}
      />
      {label}
      {isSaving && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
      {showSuccess && <Check className="w-3 h-3 text-green-500" />}
    </div>
  );
}
