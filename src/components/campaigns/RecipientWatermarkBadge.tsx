import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Shield, ShieldCheck, Clock, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

interface RecipientWatermarkBadgeProps {
  watermarkedPath: string | null;
  watermarkedAt: string | null;
  watermarkText: string | null;
  recipientEmail: string;
  enableWatermark: boolean;
}

export function RecipientWatermarkBadge({
  watermarkedPath,
  watermarkedAt,
  watermarkText,
  recipientEmail,
  enableWatermark,
}: RecipientWatermarkBadgeProps) {
  const [downloading, setDownloading] = useState(false);

  // Watermark disabled for this campaign
  if (!enableWatermark) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-muted-foreground">
              <Shield className="w-3 h-3 mr-1" />
              Sin watermark
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Watermark deshabilitado para esta campaña</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Watermark pending
  if (!watermarkedPath) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
              <Clock className="w-3 h-3 mr-1" />
              Pendiente
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>El watermark se generará al enviar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Handle download of watermarked PDF
  const handleDownload = async () => {
    if (!watermarkedPath) return;
    
    setDownloading(true);
    try {
      const { data, error } = await supabase.storage
        .from("mandato-documentos")
        .download(watermarkedPath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `teaser_${recipientEmail.replace("@", "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("PDF descargado");
    } catch (error) {
      console.error("Error downloading watermarked PDF:", error);
      toast.error("Error al descargar el PDF");
    } finally {
      setDownloading(false);
    }
  };

  // Watermark generated
  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Personalizado
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">Watermark aplicado</p>
              <p className="text-xs text-muted-foreground break-all">{watermarkText}</p>
              {watermarkedAt && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(watermarkedAt), "dd MMM yyyy HH:mm", { locale: es })}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6"
        onClick={handleDownload}
        disabled={downloading}
        title="Descargar PDF personalizado"
      >
        {downloading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Download className="w-3 h-3" />
        )}
      </Button>
    </div>
  );
}
