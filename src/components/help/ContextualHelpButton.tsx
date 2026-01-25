import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ContextualHelpSheet } from './ContextualHelpSheet';
import { getHelpSlugForRoute } from '@/config/helpMapping';
import { cn } from '@/lib/utils';

interface ContextualHelpButtonProps {
  /** Specific help slug, or auto-detect by route if not provided */
  slug?: string;
  className?: string;
}

export function ContextualHelpButton({ slug, className }: ContextualHelpButtonProps) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  
  // Auto-detect slug if not provided
  const helpSlug = slug || getHelpSlugForRoute(location.pathname);
  
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted",
              className
            )}
            onClick={() => setOpen(true)}
          >
            <HelpCircle className="h-4 w-4" />
            <span className="sr-only">Ayuda</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Ver ayuda</p>
        </TooltipContent>
      </Tooltip>
      
      <ContextualHelpSheet 
        open={open} 
        onOpenChange={setOpen}
        slug={helpSlug}
      />
    </>
  );
}
