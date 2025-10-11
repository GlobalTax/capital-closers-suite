import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ImportProgressProps {
  progress: number;
  total: number;
  current: number;
  importing: boolean;
}

export const ImportProgress = ({ progress, total, current, importing }: ImportProgressProps) => {
  if (!importing && progress === 0) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {importing && <Loader2 className="h-4 w-4 animate-spin" />}
              <span className="text-sm font-medium">
                {importing ? 'Importando...' : 'Importación completada'}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {current} / {total} registros
            </span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </CardContent>
    </Card>
  );
};
