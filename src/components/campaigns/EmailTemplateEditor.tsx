import { useState, useEffect } from "react";
import { ArrowLeft, Save, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useCreateTemplate, useUpdateTemplate } from "@/hooks/useEmailTemplates";
import { useSendTestEmail } from "@/hooks/useEmailTemplates";
import { VariableInsertBar } from "./VariableInsertBar";
import { EmailPreview } from "./EmailPreview";
import {
  type EmailTemplate,
  type TemplateLanguage,
  type TemplateType,
  PREVIEW_DATA,
} from "@/services/emailTemplate.service";
import { useAuth } from "@/hooks/useAuth";

interface EmailTemplateEditorProps {
  template?: EmailTemplate | null;
  defaultLanguage?: TemplateLanguage;
  onClose: () => void;
}

const templateTypes: { value: TemplateType; label: string }[] = [
  { value: "teaser", label: "Teaser" },
  { value: "follow_up", label: "Seguimiento" },
  { value: "reminder", label: "Recordatorio" },
  { value: "custom", label: "Personalizado" },
];

export function EmailTemplateEditor({
  template,
  defaultLanguage = "ES",
  onClose,
}: EmailTemplateEditorProps) {
  const { user } = useAuth();
  const isEditing = !!template;

  // Form state
  const [nombre, setNombre] = useState(template?.nombre || "");
  const [idioma, setIdioma] = useState<TemplateLanguage>(
    template?.idioma || defaultLanguage
  );
  const [tipo, setTipo] = useState<TemplateType>(template?.tipo || "teaser");
  const [subjectTemplate, setSubjectTemplate] = useState(
    template?.subject_template || ""
  );
  const [htmlContent, setHtmlContent] = useState(template?.html_content || "");
  const [isDefault, setIsDefault] = useState(template?.is_default || false);

  // For variable insertion
  const [activeField, setActiveField] = useState<"subject" | "body">("subject");
  const [cursorPosition, setCursorPosition] = useState(0);

  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const sendTestMutation = useSendTestEmail();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleInsertVariable = (variable: string) => {
    const variableText = `{{${variable}}}`;

    if (activeField === "subject") {
      const newSubject =
        subjectTemplate.slice(0, cursorPosition) +
        variableText +
        subjectTemplate.slice(cursorPosition);
      setSubjectTemplate(newSubject);
      setCursorPosition(cursorPosition + variableText.length);
    } else {
      const newContent =
        htmlContent.slice(0, cursorPosition) +
        variableText +
        htmlContent.slice(cursorPosition);
      setHtmlContent(newContent);
      setCursorPosition(cursorPosition + variableText.length);
    }
  };

  const handleSave = () => {
    if (!nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    if (!subjectTemplate.trim()) {
      toast.error("El asunto es requerido");
      return;
    }
    if (!htmlContent.trim()) {
      toast.error("El contenido es requerido");
      return;
    }

    const data = {
      nombre: nombre.trim(),
      idioma,
      tipo,
      subject_template: subjectTemplate.trim(),
      html_content: htmlContent.trim(),
      is_default: isDefault,
    };

    if (isEditing && template) {
      updateMutation.mutate(
        { id: template.id, data },
        { onSuccess: () => onClose() }
      );
    } else {
      createMutation.mutate(data, { onSuccess: () => onClose() });
    }
  };

  const handleSendTest = () => {
    if (!user?.email) {
      toast.error("No se pudo obtener tu email");
      return;
    }

    if (!subjectTemplate.trim() || !htmlContent.trim()) {
      toast.error("Completa el asunto y contenido antes de enviar el test");
      return;
    }

    sendTestMutation.mutate({
      templateId: template?.id,
      testEmail: user.email,
      subjectTemplate: subjectTemplate.trim(),
      htmlContent: htmlContent.trim(),
      variables: PREVIEW_DATA,
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? "Editar plantilla" : "Nueva plantilla"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing
                ? `Editando: ${template.nombre}`
                : "Crea una nueva plantilla de email"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSendTest}
            disabled={sendTestMutation.isPending}
          >
            {sendTestMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Enviar test
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar
          </Button>
        </div>
      </div>

      {/* Main content - Two columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column - Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre de la plantilla</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Teaser M&A - Español"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as TemplateType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templateTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label>Idioma</Label>
              <RadioGroup
                value={idioma}
                onValueChange={(v) => setIdioma(v as TemplateLanguage)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ES" id="lang-es" />
                  <Label htmlFor="lang-es" className="cursor-pointer">
                    🇪🇸 Español
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="EN" id="lang-en" />
                  <Label htmlFor="lang-en" className="cursor-pointer">
                    🇬🇧 English
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Variable Insert Bar */}
            <VariableInsertBar
              onInsert={handleInsertVariable}
              activeField={activeField}
            />

            {/* Subject & Body Tabs */}
            <Tabs
              defaultValue="subject"
              onValueChange={(v) => setActiveField(v as "subject" | "body")}
            >
              <TabsList className="w-full">
                <TabsTrigger value="subject" className="flex-1">
                  Asunto
                </TabsTrigger>
                <TabsTrigger value="body" className="flex-1">
                  Cuerpo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="subject" className="mt-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Asunto del email</Label>
                  <Input
                    id="subject"
                    value={subjectTemplate}
                    onChange={(e) => setSubjectTemplate(e.target.value)}
                    onFocus={() => setActiveField("subject")}
                    onSelect={(e) =>
                      setCursorPosition((e.target as HTMLInputElement).selectionStart || 0)
                    }
                    placeholder="Ej: Oportunidad de inversión: {{mandato_nombre}}"
                  />
                </div>
              </TabsContent>

              <TabsContent value="body" className="mt-4">
                <div className="space-y-2">
                  <Label htmlFor="body">Contenido del email (HTML)</Label>
                  <Textarea
                    id="body"
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    onFocus={() => setActiveField("body")}
                    onSelect={(e) =>
                      setCursorPosition(
                        (e.target as HTMLTextAreaElement).selectionStart || 0
                      )
                    }
                    placeholder="Escribe el contenido del email aquí..."
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Default toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="is-default">Plantilla por defecto</Label>
                <p className="text-sm text-muted-foreground">
                  Se usará automáticamente al crear nuevas campañas
                </p>
              </div>
              <Switch
                id="is-default"
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
            </div>
          </CardContent>
        </Card>

        {/* Right column - Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Vista previa</CardTitle>
          </CardHeader>
          <CardContent>
            <EmailPreview
              subjectTemplate={subjectTemplate}
              htmlContent={htmlContent}
              variables={PREVIEW_DATA}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
