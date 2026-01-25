import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts, degrees } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateWatermarkRequest {
  recipientId: string;
  campaignId?: string;
}

interface WatermarkResult {
  success: boolean;
  watermarkedPath?: string;
  watermarkText?: string;
  error?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientId, campaignId } = await req.json() as GenerateWatermarkRequest;

    if (!recipientId) {
      throw new Error("recipientId is required");
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch recipient with campaign and document data
    const { data: recipient, error: recipientError } = await supabase
      .from("teaser_recipients")
      .select(`
        *,
        campaign:teaser_campaigns(
          *,
          mandato:mandatos(id, nombre_proyecto),
          teaser_document:documentos(id, file_name, storage_path, file_type, mime_type)
        )
      `)
      .eq("id", recipientId)
      .single();

    if (recipientError || !recipient) {
      throw new Error(`Recipient not found: ${recipientError?.message}`);
    }

    const campaign = recipient.campaign;
    if (!campaign) {
      throw new Error("Campaign not found for recipient");
    }

    // Check if watermark is enabled
    if (!campaign.enable_watermark) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          watermarkedPath: null,
          message: "Watermark disabled for this campaign" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if teaser document exists
    const doc = campaign.teaser_document;
    if (!doc) {
      throw new Error("No teaser document found for campaign");
    }

    // Check if PDF (only PDFs can be watermarked)
    if (!doc.mime_type?.includes("pdf")) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Only PDF files can be watermarked" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already watermarked
    if (recipient.watermarked_path) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          watermarkedPath: recipient.watermarked_path,
          watermarkText: recipient.watermark_text,
          message: "Already watermarked" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Download original PDF
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("mandato-documentos")
      .download(doc.storage_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download original PDF: ${downloadError?.message}`);
    }

    // Generate watermark text from template
    const watermarkTemplate = campaign.watermark_template || 
      "Confidencial — {nombre} — {email} — ID:{id}";
    
    const watermarkText = watermarkTemplate
      .replace("{nombre}", recipient.nombre || recipient.empresa_nombre || "Destinatario")
      .replace("{email}", recipient.email)
      .replace("{id}", campaign.id.substring(0, 8).toUpperCase());

    console.log(`Generating watermark for ${recipient.email}: "${watermarkText}"`);

    // Apply watermark to PDF
    const pdfBytes = new Uint8Array(await fileData.arrayBuffer());
    const watermarkedPdfBytes = await addWatermarkToPdf(pdfBytes, watermarkText);

    // Generate storage path for watermarked PDF
    const mandatoId = campaign.mandato_id;
    const watermarkedPath = `${mandatoId}/teaser_watermarked/${campaign.id}/${recipientId}.pdf`;

    // Upload watermarked PDF
    const { error: uploadError } = await supabase.storage
      .from("mandato-documentos")
      .upload(watermarkedPath, watermarkedPdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload watermarked PDF: ${uploadError.message}`);
    }

    // Update recipient with watermark info
    const { error: updateError } = await supabase
      .from("teaser_recipients")
      .update({
        watermarked_path: watermarkedPath,
        watermarked_at: new Date().toISOString(),
        watermark_text: watermarkText,
      })
      .eq("id", recipientId);

    if (updateError) {
      console.error("Failed to update recipient:", updateError);
    }

    console.log(`Watermarked PDF created for ${recipient.email} at ${watermarkedPath}`);

    return new Response(
      JSON.stringify({
        success: true,
        watermarkedPath,
        watermarkText,
      } as WatermarkResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("Error generating watermarked PDF:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message } as WatermarkResult),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Adds watermark to all pages of a PDF
 * - Diagonal watermark in center with low opacity
 * - Footer watermark for readability
 */
async function addWatermarkToPdf(
  pdfBytes: Uint8Array,
  watermarkText: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();

    // Calculate font size based on page width and text length
    // Aim for text to be about 60% of page width
    const targetWidth = width * 0.6;
    const charWidth = 0.5; // Approximate character width ratio for Helvetica
    const estimatedFontSize = Math.min(
      targetWidth / (watermarkText.length * charWidth),
      32 // Max font size
    );
    const fontSize = Math.max(estimatedFontSize, 12); // Min font size

    // Diagonal watermark in center (low opacity)
    const textWidth = helvetica.widthOfTextAtSize(watermarkText, fontSize);
    
    page.drawText(watermarkText, {
      x: (width - textWidth * Math.cos(Math.PI / 4)) / 2,
      y: height / 2,
      size: fontSize,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
      opacity: 0.12, // Very subtle
      rotate: degrees(-45),
    });

    // Second diagonal watermark (offset for better coverage)
    page.drawText(watermarkText, {
      x: (width - textWidth * Math.cos(Math.PI / 4)) / 2 - 100,
      y: height / 2 + 150,
      size: fontSize * 0.8,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
      opacity: 0.08,
      rotate: degrees(-45),
    });

    // Footer watermark (more visible for traceability)
    const footerFontSize = 7;
    page.drawText(watermarkText, {
      x: 15,
      y: 10,
      size: footerFontSize,
      font: helvetica,
      color: rgb(0.6, 0.6, 0.6),
      opacity: 0.6,
    });

    // Also add to top-right corner (small)
    const cornerText = `ID:${watermarkText.split("ID:")[1] || ""}`;
    if (cornerText.length > 3) {
      page.drawText(cornerText, {
        x: width - 60,
        y: height - 15,
        size: 6,
        font: helvetica,
        color: rgb(0.7, 0.7, 0.7),
        opacity: 0.5,
      });
    }
  }

  return await pdfDoc.save();
}
