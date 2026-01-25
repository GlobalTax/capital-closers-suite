// ============================================
// DATA ROOM HEADER
// Header para la página pública del Data Room
// ============================================

import { Building2, User, CheckCircle2, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DataRoomHeaderProps {
  project: {
    id: string;
    nombre: string;
  } | null;
  recipient: {
    nombre: string | null;
    email: string;
    empresa: string | null;
  } | null;
  hasAccess: boolean;
}

export function DataRoomHeader({ project, recipient, hasAccess }: DataRoomHeaderProps) {
  return (
    <header className="text-center">
      {/* Logo */}
      <div className="mb-6">
        <img 
          src="/lovable-uploads/d95c5867-f0f3-470a-b626-4ebf5038b798.png" 
          alt="Capittal" 
          className="h-10 mx-auto dark:invert"
        />
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-foreground mb-2">
        Data Room
      </h1>

      {/* Project name */}
      {project && (
        <div className="flex items-center justify-center gap-2 text-xl text-muted-foreground mb-4">
          <FolderOpen className="h-5 w-5" />
          <span>{project.nombre}</span>
        </div>
      )}

      {/* Welcome message */}
      {recipient && hasAccess && (
        <div className="bg-card border rounded-lg p-4 inline-block">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{recipient.nombre || recipient.email}</span>
            </div>
            {recipient.empresa && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{recipient.empresa}</span>
              </div>
            )}
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Acceso autorizado
            </Badge>
          </div>
        </div>
      )}
    </header>
  );
}
