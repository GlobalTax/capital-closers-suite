import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { results } = useHelpSearch(query);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Reset query and selection when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleSelect = useCallback((slug: string) => {
    navigate(`/ayuda/${slug}`);
    onOpenChange(false);
  }, [navigate, onOpenChange]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex].slug);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, results, selectedIndex, handleSelect]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedElement = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, results.length]);

  // Highlight matching text
  const highlightMatch = (text: string, searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) return text;
    
    try {
      const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuery})`, 'gi');
      const parts = text.split(regex);
      
      return parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-900 px-0.5 rounded">
            {part}
          </mark>
        ) : part
      );
    } catch {
      return text;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="sr-only">Buscar en el manual</DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
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
          <div className="p-2" ref={resultsRef}>
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
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    data-index={index}
                    onClick={() => handleSelect(result.slug)}
                    className={cn(
                      "w-full text-left px-3 py-3 rounded-lg transition-colors",
                      index === selectedIndex 
                        ? "bg-primary/10 ring-1 ring-primary/50" 
                        : "hover:bg-muted focus:bg-muted focus:outline-none"
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
          <span className="hidden sm:inline">Usa </span>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">↑</kbd>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono ml-1">↓</kbd>
          <span className="mx-1">navegar,</span>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Enter</kbd>
          <span className="mx-1">seleccionar,</span>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Esc</kbd>
          <span className="ml-1">cerrar</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
