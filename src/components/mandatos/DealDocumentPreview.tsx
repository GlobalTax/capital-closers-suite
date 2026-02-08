import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { GeneratedDealDocument } from "@/hooks/useDealDocuments";

interface Props {
  document: GeneratedDealDocument;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DealDocumentPreview({ document, open, onOpenChange }: Props) {
  const sortedSections = [...document.sections].sort((a, b) => a.order - b.order);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg">{document.title}</DialogTitle>
            <Badge variant="outline">{document.document_type.toUpperCase()}</Badge>
            <Badge variant="secondary">{document.language.toUpperCase()}</Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {sortedSections.map((section, idx) => (
              <div key={idx}>
                {idx > 0 && <Separator className="my-6" />}
                <h2 className="text-lg font-semibold mb-3">{section.section_title}</h2>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.content}</ReactMarkdown>
              </div>
            ))}
          </div>

          <Separator className="my-6" />
          <p className="text-[10px] text-muted-foreground text-center italic">
            Este documento es confidencial y ha sido preparado exclusivamente para los destinatarios indicados.
            Queda prohibida su distribución, copia o uso sin autorización expresa.
          </p>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
