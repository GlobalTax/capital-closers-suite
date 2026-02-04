import { CheckCircle2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BulkApprovalBarProps {
  selectedCount: number;
  onApprove: () => void;
  onClear: () => void;
  loading?: boolean;
}

export function BulkApprovalBar({ 
  selectedCount, 
  onApprove, 
  onClear,
  loading = false
}: BulkApprovalBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className={cn(
      "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
      "bg-background border border-border shadow-lg rounded-lg",
      "flex items-center gap-3 px-4 py-3",
      "animate-in fade-in slide-in-from-bottom-4 duration-200"
    )}>
      <span className="text-sm font-medium">
        {selectedCount} plan{selectedCount > 1 ? 'es' : ''} seleccionado{selectedCount > 1 ? 's' : ''}
      </span>
      
      <div className="flex items-center gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={onApprove}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          )}
          Aprobar {selectedCount > 1 ? 'todos' : ''}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={loading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
