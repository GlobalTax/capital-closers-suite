import { useMemo } from "react";
import DOMPurify from "dompurify";
import { Mail, User } from "lucide-react";
import { type RenderVariables } from "@/services/emailTemplate.service";

interface EmailPreviewProps {
  subjectTemplate: string;
  htmlContent: string;
  variables: RenderVariables;
}

function renderString(template: string, variables: RenderVariables): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, value || "");
  }
  
  // Remove any unreplaced variables
  result = result.replace(/{{[^}]+}}/g, "");
  
  return result;
}

export function EmailPreview({
  subjectTemplate,
  htmlContent,
  variables,
}: EmailPreviewProps) {
  const renderedSubject = useMemo(
    () => renderString(subjectTemplate, variables),
    [subjectTemplate, variables]
  );

  const renderedBody = useMemo(() => {
    const raw = renderString(htmlContent, variables);
    return DOMPurify.sanitize(raw, {
      ALLOWED_TAGS: [
        "p", "br", "b", "i", "u", "strong", "em", "a", "ul", "ol", "li",
        "h1", "h2", "h3", "h4", "h5", "h6", "span", "div", "img", "table",
        "thead", "tbody", "tr", "td", "th", "hr", "blockquote", "pre", "code",
      ],
      ALLOWED_ATTR: [
        "href", "target", "rel", "src", "alt", "width", "height",
        "style", "class", "align", "valign", "colspan", "rowspan",
      ],
    });
  }, [htmlContent, variables]);

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Email header */}
      <div className="border-b bg-muted/30 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground w-16">De:</span>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-3 w-3 text-primary" />
            </div>
            <span className="font-medium">Capittal M&A</span>
            <span className="text-muted-foreground">&lt;info@capittal.es&gt;</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground w-16">Para:</span>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
              <User className="h-3 w-3" />
            </div>
            <span>{variables.contact_name || "Destinatario"}</span>
            <span className="text-muted-foreground">&lt;ejemplo@email.com&gt;</span>
          </div>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <span className="text-muted-foreground w-16">Asunto:</span>
          <span className="font-medium">
            {renderedSubject || (
              <span className="text-muted-foreground italic">Sin asunto</span>
            )}
          </span>
        </div>
      </div>

      {/* Email body */}
      <div className="p-6 min-h-[300px]">
        {renderedBody ? (
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: renderedBody }}
          />
        ) : (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            <p>El contenido del email aparecerá aquí...</p>
          </div>
        )}
      </div>

      {/* Email footer */}
      <div className="border-t bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground text-center">
          Vista previa con datos de ejemplo • El email real usará los datos del destinatario
        </p>
      </div>
    </div>
  );
}
