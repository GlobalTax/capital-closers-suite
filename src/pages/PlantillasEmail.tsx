import { useState } from "react";
import { Mail, Plus, Globe, Star, Pencil, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEmailTemplates, useDeleteTemplate, useCreateTemplate } from "@/hooks/useEmailTemplates";
import { EmailTemplateEditor } from "@/components/campaigns/EmailTemplateEditor";
import { type TemplateLanguage, type EmailTemplate } from "@/services/emailTemplate.service";

const typeLabels: Record<string, string> = {
  teaser: "Teaser",
  follow_up: "Seguimiento",
  reminder: "Recordatorio",
  custom: "Personalizado",
};

const typeBadgeVariants: Record<string, "default" | "secondary" | "outline"> = {
  teaser: "default",
  follow_up: "secondary",
  reminder: "outline",
  custom: "outline",
};

export default function PlantillasEmail() {
  const [language, setLanguage] = useState<TemplateLanguage>("ES");
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

  const { data: templates = [], isLoading } = useEmailTemplates(language);
  const deleteTemplateMutation = useDeleteTemplate();
  const createTemplateMutation = useCreateTemplate();

  const handleDelete = () => {
    if (deleteTemplateId) {
      deleteTemplateMutation.mutate(deleteTemplateId, {
        onSuccess: () => setDeleteTemplateId(null),
      });
    }
  };

  const handleDuplicate = (template: EmailTemplate) => {
    createTemplateMutation.mutate({
      nombre: `${template.nombre} (copia)`,
      idioma: template.idioma,
      tipo: template.tipo,
      subject_template: template.subject_template,
      html_content: template.html_content,
      text_content: template.text_content,
      variables: template.variables,
      is_default: false,
    });
  };

  if (editingTemplate || isCreating) {
    return (
      <EmailTemplateEditor
        template={editingTemplate}
        defaultLanguage={language}
        onClose={() => {
          setEditingTemplate(null);
          setIsCreating(false);
        }}
      />
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Plantillas de Email</h1>
            <p className="text-muted-foreground">
              Gestiona las plantillas de email para campañas M&A
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva plantilla
        </Button>
      </div>

      {/* Language Tabs */}
      <Tabs value={language} onValueChange={(v) => setLanguage(v as TemplateLanguage)}>
        <TabsList>
          <TabsTrigger value="ES" className="gap-2">
            <Globe className="h-4 w-4" />
            Español
          </TabsTrigger>
          <TabsTrigger value="EN" className="gap-2">
            <Globe className="h-4 w-4" />
            English
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Templates List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-48 bg-muted rounded" />
                <div className="h-4 w-64 bg-muted rounded mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">
              No hay plantillas en {language === "ES" ? "español" : "inglés"}
            </h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primera plantilla para comenzar a enviar emails
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear plantilla
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="group hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => setEditingTemplate(template)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {template.is_default && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                    <CardTitle className="text-lg">{template.nombre}</CardTitle>
                  </div>
                  <Badge variant={typeBadgeVariants[template.tipo]}>
                    {typeLabels[template.tipo]}
                  </Badge>
                </div>
                <CardDescription className="truncate">
                  Asunto: {template.subject_template}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {template.is_default && (
                      <span className="text-primary font-medium">
                        Plantilla por defecto
                      </span>
                    )}
                  </div>
                  <div
                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingTemplate(template)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDuplicate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTemplateId(template.id)}
                      disabled={template.is_default}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTemplateId}
        onOpenChange={(open) => !open && setDeleteTemplateId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar plantilla?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La plantilla será desactivada
              y no estará disponible para futuras campañas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
