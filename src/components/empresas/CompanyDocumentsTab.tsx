import { FileText, FileSignature, Briefcase, Presentation, FileSpreadsheet } from "lucide-react";
import { CompanyDocumentCategorySection } from "./CompanyDocumentCategorySection";

interface CompanyDocumentsTabProps {
  empresaId: string;
}

export function CompanyDocumentsTab({ empresaId }: CompanyDocumentsTabProps) {
  return (
    <div className="space-y-6">
      <CompanyDocumentCategorySection
        empresaId={empresaId}
        category="nda"
        icon={<FileSignature className="h-5 w-5 text-purple-600" />}
      />
      
      <CompanyDocumentCategorySection
        empresaId={empresaId}
        category="mandate"
        icon={<Briefcase className="h-5 w-5 text-blue-600" />}
      />
      
      <CompanyDocumentCategorySection
        empresaId={empresaId}
        category="presentation"
        icon={<Presentation className="h-5 w-5 text-orange-600" />}
      />
      
      <CompanyDocumentCategorySection
        empresaId={empresaId}
        category="info_request_excel"
        icon={<FileSpreadsheet className="h-5 w-5 text-green-600" />}
      />
    </div>
  );
}
