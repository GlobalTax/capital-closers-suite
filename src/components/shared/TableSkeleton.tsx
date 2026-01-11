import { Skeleton } from "@/components/ui/skeleton";
import { TableRow, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  columns: number;
  rows?: number;
  hasCheckbox?: boolean;
}

/**
 * Skeleton contextual para tablas que replica la estructura exacta del contenido.
 * Incluye animación shimmer direccional y proporciones realistas.
 */
export function TableSkeleton({ 
  columns, 
  rows = 5, 
  hasCheckbox = false 
}: TableSkeletonProps) {
  // Anchos variados para simular contenido real
  const widthVariants = [
    "w-3/4",
    "w-1/2", 
    "w-2/3",
    "w-full",
    "w-1/3",
  ];

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <TableRow 
          key={rowIdx} 
          className={cn(
            "transition-opacity duration-300",
            rowIdx === 0 && "animate-fade-in"
          )}
          style={{ 
            animationDelay: `${rowIdx * 50}ms`,
            animationFillMode: "backwards"
          }}
        >
          {hasCheckbox && (
            <TableCell className="w-12">
              <Skeleton className="h-4 w-4 rounded-sm bg-muted" />
            </TableCell>
          )}
          {Array.from({ length: columns }).map((_, colIdx) => {
            const widthClass = widthVariants[(rowIdx + colIdx) % widthVariants.length];
            const isFirstCol = colIdx === 0;
            const isLastCol = colIdx === columns - 1;
            
            return (
              <TableCell key={colIdx}>
                <div className="flex flex-col gap-1.5">
                  {/* Línea principal con shimmer */}
                  <Skeleton 
                    className={cn(
                      "h-4 bg-muted rounded",
                      widthClass,
                      "relative overflow-hidden",
                      "after:absolute after:inset-0",
                      "after:bg-gradient-to-r after:from-transparent after:via-background/20 after:to-transparent",
                      "after:animate-[shimmer_2s_infinite]"
                    )}
                    style={{ 
                      animationDelay: `${(rowIdx * columns + colIdx) * 30}ms` 
                    }}
                  />
                  {/* Línea secundaria para columnas con subtexto */}
                  {isFirstCol && (
                    <Skeleton 
                      className="h-3 w-1/3 bg-muted/60 rounded"
                      style={{ 
                        animationDelay: `${(rowIdx * columns + colIdx) * 30 + 50}ms` 
                      }}
                    />
                  )}
                  {/* Badge simulado para algunas columnas */}
                  {colIdx === 2 && (
                    <Skeleton 
                      className="h-5 w-16 bg-muted/80 rounded-full"
                      style={{ 
                        animationDelay: `${(rowIdx * columns + colIdx) * 30 + 50}ms` 
                      }}
                    />
                  )}
                </div>
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </>
  );
}
