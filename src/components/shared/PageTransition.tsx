import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper que aplica animaciones suaves de entrada a las páginas.
 * Usa CSS animations nativas para máxima performance.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <div 
      className={cn(
        "animate-page-enter",
        className
      )}
    >
      {children}
    </div>
  );
}
