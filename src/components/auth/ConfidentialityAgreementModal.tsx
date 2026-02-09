import { useState } from "react";
import { Shield, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConfidentialityAgreement } from "@/hooks/useConfidentialityAgreement";

const AGREEMENT_TEXT = `ACUERDO DE CONFIDENCIALIDAD Y NO DIVULGACIÓN

Al acceder a esta plataforma, usted reconoce y acepta las siguientes obligaciones:

1. INFORMACIÓN CONFIDENCIAL
Toda la información contenida en esta plataforma relativa a mandatos, operaciones de compraventa, valoraciones, datos financieros de empresas, contactos comerciales y cualquier documentación asociada tiene carácter estrictamente confidencial y privilegiado.

2. OBLIGACIÓN DE CONFIDENCIALIDAD
Usted se compromete a:
• No divulgar, compartir, copiar ni transmitir información sobre mandatos, operaciones o datos de empresas a terceros, ya sea de forma verbal, escrita o electrónica.
• No utilizar la información obtenida a través de esta plataforma para fines distintos a los estrictamente profesionales y autorizados.
• Proteger la información con el mismo nivel de diligencia que emplearía para proteger su propia información confidencial.

3. DATOS PROTEGIDOS
Se consideran confidenciales, sin carácter limitativo:
• Identidad de compradores y vendedores en operaciones de M&A.
• Términos financieros, valoraciones y condiciones de las operaciones.
• Estrategias comerciales y planes de negocio de las empresas.
• Datos de contacto y relaciones comerciales.
• Documentación legal, financiera y operativa compartida en procesos de due diligence.
• Información sobre el estado y progreso de las operaciones.

4. DURACIÓN
Esta obligación de confidencialidad permanecerá vigente durante su relación con la organización y durante un período de 2 años tras su finalización.

5. CONSECUENCIAS DEL INCUMPLIMIENTO
El incumplimiento de este acuerdo podrá dar lugar a acciones legales, incluyendo reclamaciones por daños y perjuicios, así como la revocación inmediata del acceso a la plataforma.

6. ACEPTACIÓN
Al pulsar "Acepto", usted confirma haber leído, comprendido y aceptado todas las condiciones anteriores, comprometiéndose a cumplirlas íntegramente.`;

export function ConfidentialityAgreementModal() {
  const { acceptAgreement, isAccepting } = useConfidentialityAgreement();
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-card border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b bg-muted/30">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Acuerdo de Confidencialidad</h2>
            <p className="text-sm text-muted-foreground">
              Debe aceptar este acuerdo para acceder a la plataforma
            </p>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[400px] px-6 py-4">
          <div className="flex items-center gap-2 mb-4 text-muted-foreground">
            <ScrollText className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Lea atentamente</span>
          </div>
          <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground/90">
            {AGREEMENT_TEXT}
          </pre>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/20 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={checked}
              onCheckedChange={(v) => setChecked(v === true)}
              className="mt-0.5"
            />
            <span className="text-sm">
              He leído y acepto el acuerdo de confidencialidad. Me comprometo a no divulgar información sobre mandatos y operaciones.
            </span>
          </label>
          <Button
            className="w-full"
            size="lg"
            disabled={!checked || isAccepting}
            onClick={() => acceptAgreement()}
          >
            {isAccepting ? "Registrando aceptación..." : "Acepto el Acuerdo de Confidencialidad"}
          </Button>
        </div>
      </div>
    </div>
  );
}
