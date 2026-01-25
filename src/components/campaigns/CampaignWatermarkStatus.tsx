import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, ShieldCheck, AlertCircle } from "lucide-react";
import type { TeaserRecipient, TeaserCampaign } from "@/services/teaserCampaign.service";

interface CampaignWatermarkStatusProps {
  campaign: TeaserCampaign;
  recipients: TeaserRecipient[];
}

export function CampaignWatermarkStatus({
  campaign,
  recipients,
}: CampaignWatermarkStatusProps) {
  // If watermark disabled, show minimal status
  if (!campaign.enable_watermark) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            Watermark
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className="text-muted-foreground">
            Deshabilitado
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            Los PDFs se enviarán sin personalización
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate watermark stats
  const totalRecipients = recipients.length;
  const watermarked = recipients.filter((r) => r.watermarked_path).length;
  const pending = totalRecipients - watermarked;
  const progress = totalRecipients > 0 ? (watermarked / totalRecipients) * 100 : 0;

  // Check if PDF document exists and is PDF type
  const isPdfTeaser = campaign.teaser_document?.mime_type?.includes("pdf");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Watermark Personalizado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isPdfTeaser ? (
          <div className="flex items-start gap-2 text-amber-600">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <p className="text-xs">
              Solo los archivos PDF pueden tener watermark. El documento actual no es un PDF.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Generados</span>
              <span className="font-medium">
                {watermarked} / {totalRecipients}
              </span>
            </div>

            <Progress value={progress} className="h-2" />

            <div className="flex gap-2 text-xs">
              {watermarked > 0 && (
                <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                  {watermarked} listos
                </Badge>
              )}
              {pending > 0 && (
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  {pending} pendientes
                </Badge>
              )}
            </div>

            {pending > 0 && (
              <p className="text-xs text-muted-foreground">
                Los PDFs pendientes se generarán automáticamente al enviar cada email
              </p>
            )}
          </>
        )}

        {campaign.watermark_template && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Plantilla:</p>
            <code className="text-xs bg-muted px-2 py-1 rounded block truncate">
              {campaign.watermark_template}
            </code>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
