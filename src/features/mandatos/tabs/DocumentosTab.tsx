import { DocumentList } from "@/components/documentos/DocumentList";
import { DocumentUploadZone } from "@/components/documentos/DocumentUploadZone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DocumentosTabProps {
  mandatoId: string;
  documentos: any[];
  onRefresh: () => void;
}

export function DocumentosTab({ mandatoId, documentos, onRefresh }: DocumentosTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subir Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentUploadZone
            mandatoId={mandatoId}
            onSuccess={onRefresh}
          />
        </CardContent>
      </Card>

      <DocumentList
        mandatoId={mandatoId}
        onUpdate={onRefresh}
      />
    </div>
  );
}
