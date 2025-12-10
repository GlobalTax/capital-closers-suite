import { supabase } from '@/integrations/supabase/client';

interface SignedUrlResponse {
  signedUrl: string;
  expiresIn: number;
  expiresAt: string;
}

/**
 * Service for accessing valuation PDFs via signed URLs
 * Only available to authenticated administrators
 */
export const valuationDocumentsService = {
  /**
   * Get a temporary signed URL for a valuation PDF
   * @param filePath - Path to the file in the valuations bucket (e.g., "2025/12/empresa.pdf")
   * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour, max: 604800 = 7 days)
   * @returns Signed URL data or throws an error
   */
  async getSignedUrl(filePath: string, expiresIn = 3600): Promise<SignedUrlResponse> {
    const { data, error } = await supabase.functions.invoke('get-signed-valuation-url', {
      body: { filePath, expiresIn }
    });

    if (error) {
      console.error('Error getting signed URL:', error);
      throw new Error(error.message || 'Error al obtener URL de documento');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return data as SignedUrlResponse;
  },

  /**
   * Open a valuation PDF in a new tab
   * @param filePath - Path to the file in the valuations bucket
   */
  async openDocument(filePath: string): Promise<void> {
    const { signedUrl } = await this.getSignedUrl(filePath);
    window.open(signedUrl, '_blank');
  },

  /**
   * Download a valuation PDF
   * @param filePath - Path to the file in the valuations bucket
   * @param fileName - Optional custom filename for download
   */
  async downloadDocument(filePath: string, fileName?: string): Promise<void> {
    const { signedUrl } = await this.getSignedUrl(filePath);
    
    const link = document.createElement('a');
    link.href = signedUrl;
    link.download = fileName || filePath.split('/').pop() || 'documento.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
