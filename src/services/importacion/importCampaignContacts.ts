import { supabase } from "@/integrations/supabase/client";
import { normalizeCampaignContactRow } from "./columnNormalizer";
import { validateCampaignContactRow } from "./validator";

export interface CampaignImportResult {
  name: string;
  status: 'success' | 'skipped' | 'error';
  message: string;
  rowIndex: number;
}

type CampaignType = 'buy' | 'sell';

export const importCampaignContacts = async (
  rows: Record<string, string>[],
  campaignType: CampaignType,
  onProgress?: (current: number) => void
): Promise<CampaignImportResult[]> => {
  const results: CampaignImportResult[] = [];
  
  // Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  // Generar batch ID único para esta importación
  const importBatchId = crypto.randomUUID();
  const importFilename = `import_${new Date().toISOString().slice(0, 10)}`;

  // Set para detectar duplicados dentro del Excel
  const seenEmails = new Set<string>();
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const normalizedRow = normalizeCampaignContactRow(row);
    const name = `${normalizedRow.first_name || ''} ${normalizedRow.last_name || ''}`.trim() || 'Sin nombre';
    const email = (normalizedRow.email || '').toLowerCase().trim();

    try {
      // Validar fila
      const validation = validateCampaignContactRow(normalizedRow);
      if (!validation.isValid) {
        results.push({
          name,
          status: 'error',
          message: validation.errors.filter(e => e.severity === 'error').map(e => e.message).join('; '),
          rowIndex: i
        });
        continue;
      }

      // Verificar duplicado dentro del Excel actual
      if (email && seenEmails.has(email)) {
        results.push({
          name,
          status: 'skipped',
          message: 'Duplicado en Excel',
          rowIndex: i
        });
        continue;
      }
      if (email) {
        seenEmails.add(email);
      }

      // Verificar si ya existe en la base de datos (mismo email + campaign_type)
      if (email) {
        const { data: existing } = await supabase
          .from('buyer_contacts')
          .select('id')
          .eq('email', email)
          .eq('campaign_type', campaignType)
          .maybeSingle();

        if (existing) {
          results.push({
            name,
            status: 'skipped',
            message: 'Ya existe en sistema',
            rowIndex: i
          });
          continue;
        }
      }

      // Insertar nuevo contacto
      const { error } = await supabase
        .from('buyer_contacts')
        .insert({
          first_name: normalizedRow.first_name || 'Sin nombre',
          last_name: normalizedRow.last_name || null,
          full_name: name,
          email: email || null,
          phone: normalizedRow.phone || null,
          company: normalizedRow.company || null,
          position: normalizedRow.position || null,
          investor_type: normalizedRow.investor_type || null,
          investment_range: normalizedRow.investment_range || null,
          sectors_of_interest: normalizedRow.sectors_of_interest || null,
          preferred_location: normalizedRow.preferred_location || null,
          campaign_type: campaignType,
          import_batch_id: importBatchId,
          import_filename: importFilename,
          imported_by: user.id,
          imported_at: new Date().toISOString(),
          origin: 'excel_import',
          status: 'new',
          internal_notes: normalizedRow.notas || null
        });

      if (error) {
        throw error;
      }

      results.push({
        name,
        status: 'success',
        message: 'Contacto creado',
        rowIndex: i
      });

    } catch (error: any) {
      results.push({
        name,
        status: 'error',
        message: error.message || 'Error desconocido',
        rowIndex: i
      });
    }

    // Reportar progreso
    if (onProgress) {
      onProgress(i + 1);
    }
  }

  return results;
};
