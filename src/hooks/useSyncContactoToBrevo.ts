import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Contacto } from '@/types';

interface SyncResult {
  success: boolean;
  error?: string;
}

export function useSyncContactoToBrevo() {
  const [syncing, setSyncing] = useState(false);

  const syncToBrevo = async (contacto: Contacto): Promise<SyncResult> => {
    if (!contacto.email) {
      toast({
        title: "Email requerido",
        description: "El contacto debe tener un email para sincronizar con Brevo",
        variant: "destructive"
      });
      return { success: false, error: "Email requerido" };
    }

    setSyncing(true);

    try {
      // Llamar a la Edge Function
      const { data, error } = await supabase.functions.invoke('sync-to-brevo', {
        body: {
          type: 'contact',
          id: contacto.id,
          data: contacto
        }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Error desconocido');
      }

      // Actualizar campos brevo_synced_at en contactos
      const { error: updateError } = await supabase
        .from('contactos')
        .update({
          brevo_synced_at: new Date().toISOString(),
          brevo_id: contacto.email
        })
        .eq('id', contacto.id);

      if (updateError) {
        console.error('Error updating brevo sync status:', updateError);
      }

      toast({
        title: "Sincronizado con Brevo",
        description: "El contacto se ha registrado correctamente en Brevo"
      });

      return { success: true };
    } catch (error: any) {
      // Si el error indica duplicado, tratarlo como éxito
      const errorMsg = error.message?.toLowerCase() || '';
      if (errorMsg.includes('duplicate') || errorMsg.includes('already exists')) {
        // Marcar como sincronizado igualmente
        const { error: linkError } = await supabase
          .from('contactos')
          .update({
            brevo_synced_at: new Date().toISOString(),
            brevo_id: contacto.email
          })
          .eq('id', contacto.id);

        if (linkError) {
          console.error('Error linking existing Brevo contact:', linkError);
        }

        toast({
          title: "Ya registrado en Brevo",
          description: "El contacto ya existía en Brevo y se ha vinculado"
        });

        return { success: true };
      }

      toast({
        title: "Error de sincronización",
        description: error.message || "No se pudo sincronizar con Brevo",
        variant: "destructive"
      });

      return { success: false, error: error.message };
    } finally {
      setSyncing(false);
    }
  };

  return { syncToBrevo, syncing };
}
