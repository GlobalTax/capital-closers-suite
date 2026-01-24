import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  confidence: number; // 0-1
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function ConfidenceBadge({ 
  confidence, 
  showLabel = true, 
  size = 'md',
  className 
}: ConfidenceBadgeProps) {
  const percentage = Math.round(confidence * 100);
  const level = percentage >= 80 ? 'high' : percentage >= 60 ? 'medium' : 'low';
  
  const colors = {
    high: 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400',
    medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400',
    low: 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400',
  };

  const labels = {
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
  };

  const dots = {
    high: '●●●●○',
    medium: '●●●○○',
    low: '●●○○○',
  };
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        colors[level],
        size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-xs px-2 py-0.5',
        className
      )}
    >
      <span className="mr-1 tracking-tighter">{dots[level]}</span>
      {percentage}%
      {showLabel && <span className="ml-1 hidden sm:inline">({labels[level]})</span>}
    </Badge>
  );
}
