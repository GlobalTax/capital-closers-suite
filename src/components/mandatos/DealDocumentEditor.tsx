import { useState } from "react";
import { Save, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateDealDocument, type GeneratedDealDocument, type DealDocumentSection } from "@/hooks/useDealDocuments";

interface Props {
  document: GeneratedDealDocument;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DealDocumentEditor({ document, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const updateMutation = useUpdateDealDocument();
  const [title, setTitle] = useState(document.title);
  const [sections, setSections] = useState<DealDocumentSection[]>([...document.sections]);

  const updateSection = (index: number, field: keyof DealDocumentSection, value: string | number) => {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const handleSave = (status?: string) => {
    updateMutation.mutate({
      id: document.id,
      mandato_id: document.mandato_id,
      title,
      sections,
      ...(status === "approved"
        ? { status: "approved", approved_at: new Date().toISOString(), reviewed_by: user?.id }
        : status
        ? { status }
        : {}),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="p-4 pb-2 border-b shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base">Editar Documento</SheetTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{document.document_type.toUpperCase()}</Badge>
              <Badge variant="secondary">v{document.version}</Badge>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Título</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            {sections
              .sort((a, b) => a.order - b.order)
              .map((section, idx) => (
                <div key={idx} className="space-y-1.5 border rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">§{section.order}</span>
                    <Input
                      value={section.section_title}
                      onChange={(e) => updateSection(idx, "section_title", e.target.value)}
                      className="font-medium text-sm h-8"
                    />
                  </div>
                  <Textarea
                    value={section.content}
                    onChange={(e) => updateSection(idx, "content", e.target.value)}
                    rows={8}
                    className="text-sm font-mono"
                  />
                </div>
              ))}
          </div>
        </ScrollArea>

        <div className="border-t p-4 flex items-center gap-2 shrink-0">
          <Button onClick={() => handleSave()} disabled={updateMutation.isPending} variant="outline">
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            Guardar borrador
          </Button>
          <Button onClick={() => handleSave("approved")} disabled={updateMutation.isPending}>
            <CheckCircle className="w-4 h-4 mr-1" />
            Aprobar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
