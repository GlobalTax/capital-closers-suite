import { useState } from "react";
import { Sparkles, FileText, Eye, Pencil, CheckCircle, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  useDealDocuments,
  useDealDocumentTemplates,
  useGenerateDealDocument,
  type GeneratedDealDocument,
} from "@/hooks/useDealDocuments";
import { DealDocumentEditor } from "./DealDocumentEditor";
import { DealDocumentPreview } from "./DealDocumentPreview";

interface Props {
  mandatoId: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Borrador", variant: "secondary" },
  reviewed: { label: "Revisado", variant: "outline" },
  approved: { label: "Aprobado", variant: "default" },
  exported: { label: "Exportado", variant: "default" },
};

export function DealDocumentGenerator({ mandatoId }: Props) {
  const [docType, setDocType] = useState<"teaser" | "cim">("teaser");
  const [language, setLanguage] = useState("es");
  const [templateId, setTemplateId] = useState<string>("");
  const [editingDoc, setEditingDoc] = useState<GeneratedDealDocument | null>(null);
  const [previewDoc, setPreviewDoc] = useState<GeneratedDealDocument | null>(null);

  const { data: documents = [], isLoading } = useDealDocuments(mandatoId);
  const { data: templates = [] } = useDealDocumentTemplates(docType);
  const generateMutation = useGenerateDealDocument();

  const filteredTemplates = templates.filter((t) => t.language === language);

  const handleGenerate = () => {
    generateMutation.mutate({
      mandato_id: mandatoId,
      document_type: docType,
      language,
      template_id: templateId || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Generator Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-5 h-5 text-primary" />
            Generar Documento con IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tipo de Documento</label>
              <Select value={docType} onValueChange={(v) => { setDocType(v as any); setTemplateId(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="teaser">Teaser (Anónimo)</SelectItem>
                  <SelectItem value="cim">CIM (Completo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Idioma</label>
              <Select value={language} onValueChange={(v) => { setLanguage(v); setTemplateId(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">🇪🇸 Español</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Plantilla</label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger><SelectValue placeholder="Por defecto" /></SelectTrigger>
                <SelectContent>
                  {filteredTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} {t.is_default && "(default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={generateMutation.isPending} className="w-full sm:w-auto">
            {generateMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generando...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />Generar {docType === "teaser" ? "Teaser" : "CIM"}</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Document List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documentos Generados ({documents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No hay documentos generados aún</p>
              <p className="text-xs mt-1">Usa el generador de arriba para crear tu primer Teaser o CIM</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => {
                const st = statusConfig[doc.status] || statusConfig.draft;
                return (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{doc.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px] px-1.5">
                            {doc.document_type.toUpperCase()}
                          </Badge>
                          <Badge variant={st.variant} className="text-[10px] px-1.5">
                            {st.label}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Globe className="w-3 h-3" />
                            {doc.language.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            v{doc.version} · {format(new Date(doc.created_at), "d MMM yyyy HH:mm", { locale: es })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => setPreviewDoc(doc)} title="Vista previa">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditingDoc(doc)} title="Editar">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor Drawer */}
      {editingDoc && (
        <DealDocumentEditor
          document={editingDoc}
          open={!!editingDoc}
          onOpenChange={(open) => !open && setEditingDoc(null)}
        />
      )}

      {/* Preview Dialog */}
      {previewDoc && (
        <DealDocumentPreview
          document={previewDoc}
          open={!!previewDoc}
          onOpenChange={(open) => !open && setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
