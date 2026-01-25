import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useHelpSearch } from '@/hooks/useHelpCenter';
import { cn } from '@/lib/utils';

interface HelpSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpSearchDialog({ open, onOpenChange }: HelpSearchDialogProps) {
  const [query, setQuery] = useState('');
  const { results } = useHelpSearch(query);
  const navigate = useNavigate();

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const handleSelect = (slug: string) => {
    navigate(`/ayuda/${slug}`);
    onOpenChange(false);
  };

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query || query.length < 2) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-900 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="sr-only">Buscar en el manual</DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en el manual..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px]">
          <div className="p-2">
            {query.length < 2 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Escribe al menos 2 caracteres para buscar
              </p>
            ) : results.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No se encontraron resultados para "{query}"
              </p>
            ) : (
              <div className="space-y-1">
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result.slug)}
                    className={cn(
                      "w-full text-left px-3 py-3 rounded-lg transition-colors",
                      "hover:bg-muted focus:bg-muted focus:outline-none"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-foreground">
                          {highlightMatch(result.title, query)}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {highlightMatch(result.highlight, query)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="border-t p-2 text-xs text-muted-foreground text-center">
          Usa ↑↓ para navegar, Enter para seleccionar, Esc para cerrar
        </div>
      </DialogContent>
    </Dialog>
  );
}
