import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Presentation, 
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  Share2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { TemplateSelector } from "@/features/presentations/components/TemplateSelector";
import { usePresentationProjects, useCreateProject, useDeleteProject } from "@/hooks/usePresentations";
import { TEMPLATE_DEFINITIONS, type PresentationType } from "@/types/presentations";
import { cn } from "@/lib/utils";

export default function Presentaciones() {
  const navigate = useNavigate();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PresentationType | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: projects = [], isLoading } = usePresentationProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!selectedTemplate || !newTitle.trim()) return;

    const result = await createProject.mutateAsync({
      project: {
        title: newTitle.trim(),
        type: selectedTemplate,
        status: 'draft',
        is_confidential: true,
      },
      templateType: selectedTemplate,
    });

    setShowNewDialog(false);
    setSelectedTemplate(null);
    setNewTitle('');
    navigate(`/presentaciones/${result.id}/editor`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar esta presentación?')) {
      await deleteProject.mutateAsync(id);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <PageHeader
        title="Presentaciones"
        subtitle="Crea y gestiona presentaciones profesionales"
      />

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Buscar presentaciones..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex-1" />
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Presentación
        </Button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="aspect-[16/9] bg-muted rounded mb-4" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16">
          <Presentation className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg mb-2">No hay presentaciones</h3>
          <p className="text-muted-foreground mb-4">
            Crea tu primera presentación profesional
          </p>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Presentación
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProjects.map((project) => (
            <Card 
              key={project.id} 
              className="group cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/presentaciones/${project.id}/editor`)}
            >
              <CardContent className="p-4">
                {/* Preview thumbnail */}
                <div className="aspect-[16/9] bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                  <div className="text-center p-4">
                    <Presentation className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <span className="text-xs text-muted-foreground capitalize">
                      {TEMPLATE_DEFINITIONS[project.type as PresentationType]?.name || project.type}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm truncate">{project.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(project.updated_at), "d MMM yyyy", { locale: es })}
                    </p>
                    {project.client_name && (
                      <p className="text-xs text-muted-foreground truncate">
                        {project.client_name}
                      </p>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/presentaciones/${project.id}/editor`);
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/presentaciones/${project.id}/present`);
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        Presentar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(project.id);
                      }} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Status badge */}
                <div className="mt-2">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    project.status === 'draft' && "bg-muted text-muted-foreground",
                    project.status === 'review' && "bg-yellow-100 text-yellow-700",
                    project.status === 'approved' && "bg-green-100 text-green-700",
                  )}>
                    {project.status === 'draft' && 'Borrador'}
                    {project.status === 'review' && 'En revisión'}
                    {project.status === 'approved' && 'Aprobado'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Presentation Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nueva Presentación</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            {/* Template selection */}
            <div className="space-y-3">
              <Label>Selecciona una plantilla</Label>
              <TemplateSelector
                selectedType={selectedTemplate}
                onSelect={setSelectedTemplate}
              />
            </div>

            {/* Title input - only show after template selection */}
            {selectedTemplate && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                <Label>Nombre de la presentación</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej: Teaser Proyecto Alpha"
                  autoFocus
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setShowNewDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!selectedTemplate || !newTitle.trim() || createProject.isPending}
              >
                {createProject.isPending ? 'Creando...' : 'Crear Presentación'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
