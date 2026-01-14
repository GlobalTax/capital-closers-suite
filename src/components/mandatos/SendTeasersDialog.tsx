import { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Send, 
  Loader2,
  Link,
  Mail
} from "lucide-react";
import { toast } from "sonner";
import { 
  prepareTeasersForSending, 
  getSignedUrlForTeaser,
  type TeaserInfo 
} from "@/services/teaser.service";
import type { Mandato } from "@/types";

interface SendTeasersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMandatos: Mandato[];
}

export function SendTeasersDialog({ 
  open, 
  onOpenChange, 
  selectedMandatos 
}: SendTeasersDialogProps) {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Información de oportunidades M&A");
  const [message, setMessage] = useState("");
  const [withTeaser, setWithTeaser] = useState<TeaserInfo[]>([]);
  const [withoutTeaser, setWithoutTeaser] = useState<TeaserInfo[]>([]);
  const [generatedUrls, setGeneratedUrls] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (open && selectedMandatos.length > 0) {
      loadTeasers();
    }
  }, [open, selectedMandatos]);

  const loadTeasers = async () => {
    setLoading(true);
    try {
      const mandatoIds = selectedMandatos.map(m => m.id);
      const mandatosMap = new Map(
        selectedMandatos.map(m => [m.id, m.empresa_principal?.nombre || m.codigo || 'Sin nombre'])
      );
      
      const result = await prepareTeasersForSending(mandatoIds, mandatosMap);
      setWithTeaser(result.withTeaser);
      setWithoutTeaser(result.withoutTeaser);
    } catch (error) {
      console.error('[SendTeasers] Error loading teasers:', error);
      toast.error("Error al cargar teasers");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLinks = async () => {
    setSending(true);
    try {
      const urls = new Map<string, string>();
      
      for (const info of withTeaser) {
        if (info.teaser?.storage_path) {
          const url = await getSignedUrlForTeaser(info.teaser.storage_path, 86400); // 24 horas
          if (url) {
            urls.set(info.mandatoId, url);
          }
        }
      }
      
      setGeneratedUrls(urls);
      toast.success(`${urls.size} enlaces generados (válidos 24h)`);
    } catch (error) {
      toast.error("Error generando enlaces");
    } finally {
      setSending(false);
    }
  };

  const handleCopyLinks = () => {
    const linksText = withTeaser
      .filter(info => generatedUrls.has(info.mandatoId))
      .map(info => `${info.mandatoNombre}:\n${generatedUrls.get(info.mandatoId)}`)
      .join("\n\n");
    
    navigator.clipboard.writeText(linksText);
    toast.success("Enlaces copiados al portapapeles");
  };

  const handleSendEmail = () => {
    if (!email) {
      toast.error("Introduce un email de destino");
      return;
    }

    const linksText = withTeaser
      .filter(info => generatedUrls.has(info.mandatoId))
      .map(info => `• ${info.mandatoNombre}: ${generatedUrls.get(info.mandatoId)}`)
      .join("\n");

    const body = `${message}\n\n${linksText}`;
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.open(mailtoUrl, '_blank');
    toast.success("Abriendo cliente de correo...");
    onOpenChange(false);
  };

  const canSend = withTeaser.length > 0 && email.trim() !== "" && generatedUrls.size > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Enviar Teasers
          </DialogTitle>
          <DialogDescription>
            Envía los teasers de los mandatos seleccionados a un destinatario
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Resumen de selección */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-700 dark:text-green-400">
                    Con Teaser
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-600">{withTeaser.length}</p>
              </div>
              
              <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="font-medium text-orange-700 dark:text-orange-400">
                    Sin Teaser
                  </span>
                </div>
                <p className="text-2xl font-bold text-orange-600">{withoutTeaser.length}</p>
              </div>
            </div>

            {/* Advertencia si hay mandatos sin teaser */}
            {withoutTeaser.length > 0 && (
              <Alert variant="default" className="border-orange-300 bg-orange-50 dark:bg-orange-900/10">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 dark:text-orange-300">
                  Los siguientes mandatos no tienen teaser subido y no se incluirán:
                  <ScrollArea className="h-20 mt-2">
                    <ul className="text-sm space-y-1">
                      {withoutTeaser.map(info => (
                        <li key={info.mandatoId}>• {info.mandatoNombre}</li>
                      ))}
                    </ul>
                  </ScrollArea>
                </AlertDescription>
              </Alert>
            )}

            {withTeaser.length === 0 ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Ninguno de los mandatos seleccionados tiene teaser. Sube teasers desde el perfil de cada mandato.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Lista de teasers a enviar */}
                <div className="space-y-2">
                  <Label>Teasers a enviar ({withTeaser.length})</Label>
                  <ScrollArea className="h-32 border rounded-lg p-3">
                    <div className="space-y-2">
                      {withTeaser.map(info => (
                        <div key={info.mandatoId} className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">{info.mandatoNombre}</span>
                          <span className="text-xs text-muted-foreground truncate flex-1">
                            {info.teaser?.file_name}
                          </span>
                          {generatedUrls.has(info.mandatoId) && (
                            <Badge variant="secondary" className="text-xs">
                              <Link className="w-3 h-3 mr-1" />
                              Listo
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <Separator />

                {/* Formulario de envío */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email del destinatario *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="destinatario@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Asunto</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Mensaje (opcional)</Label>
                    <Textarea
                      id="message"
                      placeholder="Añade un mensaje personalizado..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          
          {withTeaser.length > 0 && (
            <>
              {generatedUrls.size === 0 ? (
                <Button onClick={handleGenerateLinks} disabled={sending}>
                  {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Link className="w-4 h-4 mr-2" />
                  Generar enlaces seguros
                </Button>
              ) : (
                <>
                  <Button variant="secondary" onClick={handleCopyLinks}>
                    <Link className="w-4 h-4 mr-2" />
                    Copiar enlaces
                  </Button>
                  <Button onClick={handleSendEmail} disabled={!canSend}>
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar por email
                  </Button>
                </>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
