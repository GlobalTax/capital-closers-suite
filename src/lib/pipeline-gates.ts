// ============================================
// PIPELINE GATES - Validación de transiciones de etapa
// ============================================

import type { Mandato, Documento, MandatoChecklistTask, ChecklistFaseProgress, OverdueTask } from "@/types";

export type PipelineStage = 'prospeccion' | 'loi' | 'due_diligence' | 'negociacion' | 'cierre';

export interface GateCheckData {
  mandato: Mandato;
  documentos: Documento[];
  checklistTasks: MandatoChecklistTask[];
  checklistProgress: ChecklistFaseProgress[];
  overdueTasks: OverdueTask[];
  totalProgress: number;
}

export interface GateRequirement {
  id: string;
  label: string;
  check: (data: GateCheckData) => boolean;
  resolveLink?: string;
  resolveLabel?: string;
}

export interface StageGate {
  from: PipelineStage;
  to: PipelineStage;
  requirements: GateRequirement[];
}

export interface GateValidationResult {
  canProceed: boolean;
  failedRequirements: Array<{
    id: string;
    label: string;
    resolveLink?: string;
    resolveLabel?: string;
  }>;
}

// Orden de etapas del pipeline
export const STAGE_ORDER: PipelineStage[] = [
  'prospeccion', 'loi', 'due_diligence', 'negociacion', 'cierre'
];

// Configuración de gates por transición
export const PIPELINE_GATES: StageGate[] = [
  {
    from: 'prospeccion',
    to: 'loi',
    requirements: [
      {
        id: 'empresa_principal',
        label: 'Empresa principal asignada',
        check: (d) => !!d.mandato.empresa_principal_id,
        resolveLink: 'resumen',
        resolveLabel: 'Asignar empresa',
      },
      {
        id: 'contacto_clave',
        label: 'Al menos 1 contacto clave asociado',
        check: (d) => (d.mandato.contactos?.length || 0) >= 1,
        resolveLink: 'resumen',
        resolveLabel: 'Añadir contacto',
      },
      {
        id: 'valor_definido',
        label: 'Valor del deal estimado',
        check: (d) => (d.mandato.valor || 0) > 0,
        resolveLink: 'edit',
        resolveLabel: 'Editar mandato',
      },
    ],
  },
  {
    from: 'loi',
    to: 'due_diligence',
    requirements: [
      {
        id: 'loi_document',
        label: 'Documento LOI subido',
        check: (d) => d.documentos.some(doc => 
          doc.tipo?.toLowerCase().includes('loi') || 
          doc.file_name?.toLowerCase().includes('loi')
        ),
        resolveLink: 'documentos',
        resolveLabel: 'Subir LOI',
      },
      {
        id: 'checklist_fase1',
        label: 'Fase inicial del checklist al 80%',
        check: (d) => {
          const fase1 = d.checklistProgress.find(p => 
            p.fase.includes('Definición') || p.fase.includes('Preparación')
          );
          return fase1 ? fase1.porcentaje >= 80 : true;
        },
        resolveLink: 'checklist',
        resolveLabel: 'Completar checklist',
      },
    ],
  },
  {
    from: 'due_diligence',
    to: 'negociacion',
    requirements: [
      {
        id: 'dd_workstreams',
        label: 'Al menos 3 workstreams de DD con tareas',
        check: (d) => {
          const workstreams = new Set(
            d.checklistTasks
              .map(t => t.workstream)
              .filter(Boolean)
          );
          return workstreams.size >= 3;
        },
        resolveLink: 'checklist',
        resolveLabel: 'Configurar DD',
      },
      {
        id: 'no_critical_overdue',
        label: 'Sin tareas críticas vencidas',
        check: (d) => !d.overdueTasks.some(t => t.es_critica),
        resolveLink: 'checklist',
        resolveLabel: 'Resolver vencidas',
      },
      {
        id: 'dd_progress_50',
        label: 'Due Diligence completado al 50%',
        check: (d) => {
          const ddFase = d.checklistProgress.find(p => 
            p.fase.includes('Due Diligence')
          );
          return ddFase ? ddFase.porcentaje >= 50 : true;
        },
        resolveLink: 'checklist',
        resolveLabel: 'Avanzar DD',
      },
    ],
  },
  {
    from: 'negociacion',
    to: 'cierre',
    requirements: [
      {
        id: 'spa_document',
        label: 'Borrador SPA subido',
        check: (d) => d.documentos.some(doc => 
          doc.tipo?.toLowerCase().includes('spa') || 
          doc.file_name?.toLowerCase().includes('spa') ||
          doc.file_name?.toLowerCase().includes('contrato')
        ),
        resolveLink: 'documentos',
        resolveLabel: 'Subir SPA',
      },
      {
        id: 'checklist_90',
        label: 'Checklist general al 90%',
        check: (d) => d.totalProgress >= 90,
        resolveLink: 'checklist',
        resolveLabel: 'Completar tareas',
      },
    ],
  },
];

/**
 * Valida si una transición de etapa está permitida
 * Retroceder siempre está permitido
 * Avanzar requiere cumplir los gates definidos
 */
export function validateStageTransition(
  currentStage: PipelineStage,
  targetStage: PipelineStage,
  data: GateCheckData
): GateValidationResult {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  const targetIndex = STAGE_ORDER.indexOf(targetStage);

  // Permitir retroceso siempre
  if (targetIndex <= currentIndex) {
    return { canProceed: true, failedRequirements: [] };
  }

  // Buscar gate aplicable para la transición directa
  const gate = PIPELINE_GATES.find(g => g.from === currentStage && g.to === targetStage);
  
  if (!gate) {
    // Si no hay gate definido, permitir
    return { canProceed: true, failedRequirements: [] };
  }

  // Ejecutar checks y recopilar fallos (máximo 3)
  const failedRequirements = gate.requirements
    .filter(req => !req.check(data))
    .slice(0, 3)
    .map(req => ({
      id: req.id,
      label: req.label,
      resolveLink: req.resolveLink,
      resolveLabel: req.resolveLabel,
    }));

  return {
    canProceed: failedRequirements.length === 0,
    failedRequirements,
  };
}
