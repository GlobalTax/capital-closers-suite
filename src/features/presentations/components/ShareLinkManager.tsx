import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Copy, 
  Link2, 
  Trash2, 
  ExternalLink,
  Download,
  Eye,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useShareLinks, useCreateShareLink, useDeactivateShareLink } from "@/hooks/usePresentations";
import type { PresentationSharingLink } from "@/types/presentations";

interface ShareLinkManagerProps {
  projectId: string;
}

export function ShareLinkManager({ projectId }: ShareLinkManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<'view' | 'download_pdf'>('view');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [expiresIn, setExpiresIn] = useState<string>('7');

  const { data: links = [], isLoading } = useShareLinks(projectId);
  const createLink = useCreateShareLink();
  const deactivateLink = useDeactivateShareLink();

  const handleCreate = async () => {
    const expiresAt = expiresIn !== 'never' 
      ? new Date(Date.now() + parseInt(expiresIn) * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    await createLink.mutateAsync({
      projectId,
      options: {
        permission,
        expiresAt,
        recipientEmail: recipientEmail || undefined,
      },
    });

    setIsOpen(false);
    setRecipientEmail('');
    setPermission('view');
    setExpiresIn('7');
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/p/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Enlace copiado');
  };

  const handleDeactivate = async (id: string) => {
    await deactivateLink.mutateAsync({ id, projectId });
  };

  const activeLinks = links.filter(l => l.is_active);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg">Enlaces compartidos</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nuevo enlace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear enlace de compartir</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Permisos</Label>
                <Select value={permission} onValueChange={(v) => setPermission(v as typeof permission)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Solo ver
                      </div>
                    </SelectItem>
                    <SelectItem value="download_pdf">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Ver y descargar PDF
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Expira en</Label>
                <Select value={expiresIn} onValueChange={setExpiresIn}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 día</SelectItem>
                    <SelectItem value="7">7 días</SelectItem>
                    <SelectItem value="30">30 días</SelectItem>
                    <SelectItem value="90">90 días</SelectItem>
                    <SelectItem value="never">Nunca</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Email del destinatario (opcional)</Label>
                <Input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="ejemplo@email.com"
                />
              </div>

              <Button 
                onClick={handleCreate} 
                className="w-full"
                disabled={createLink.isPending}
              >
                Crear enlace
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando...</div>
      ) : activeLinks.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-lg">
          No hay enlaces activos
        </div>
      ) : (
        <div className="space-y-2">
          {activeLinks.map((link) => (
            <ShareLinkItem
              key={link.id}
              link={link}
              onCopy={() => handleCopyLink(link.token)}
              onDeactivate={() => handleDeactivate(link.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ShareLinkItem({
  link,
  onCopy,
  onDeactivate,
}: {
  link: PresentationSharingLink;
  onCopy: () => void;
  onDeactivate: () => void;
}) {
  const isExpired = link.expires_at && new Date(link.expires_at) < new Date();

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {link.permission === 'download_pdf' ? (
            <Download className="h-3 w-3" />
          ) : (
            <Eye className="h-3 w-3" />
          )}
          <span className="text-sm">
            {link.permission === 'download_pdf' ? 'Ver + PDF' : 'Solo ver'}
          </span>
          {link.recipient_email && (
            <span className="text-xs text-muted-foreground">
              → {link.recipient_email}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {link.view_count} visitas
          {link.expires_at && (
            <>
              {' · '}
              {isExpired ? (
                <span className="text-destructive">Expirado</span>
              ) : (
                <>Expira {format(new Date(link.expires_at), "d MMM yyyy", { locale: es })}</>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={onCopy}>
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.open(`/p/${link.token}`, '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDeactivate}
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default ShareLinkManager;
