import { 
  Building2, 
  Users, 
  Briefcase, 
  FileText, 
  CheckSquare, 
  BarChart3 
} from 'lucide-react';
import type { OnboardingStep } from '@/types/onboarding';

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'create_empresa',
    title: 'Crear tu primera empresa',
    description: 'Registra una empresa para comenzar a gestionar oportunidades',
    icon: Building2,
    actionLabel: 'Crear empresa',
    actionRoute: '/empresas?action=new',
    autoCompleteCheck: 'has_empresa',
  },
  {
    id: 'create_contacto',
    title: 'Añadir un contacto',
    description: 'Registra contactos clave para tus operaciones',
    icon: Users,
    actionLabel: 'Crear contacto',
    actionRoute: '/contactos?action=new',
    autoCompleteCheck: 'has_contacto',
  },
  {
    id: 'create_mandato',
    title: 'Crear un mandato',
    description: 'Inicia tu primer proceso de M&A',
    icon: Briefcase,
    actionLabel: 'Nuevo mandato',
    actionRoute: '/mandatos?action=new',
    autoCompleteCheck: 'has_mandato',
  },
  {
    id: 'create_tarea',
    title: 'Crear una tarea',
    description: 'Planifica y organiza tu trabajo diario',
    icon: CheckSquare,
    actionLabel: 'Nueva tarea',
    actionRoute: '/tareas?action=new',
    autoCompleteCheck: 'has_tarea',
  },
  {
    id: 'upload_documento',
    title: 'Subir un documento',
    description: 'Organiza la documentación de tus operaciones',
    icon: FileText,
    actionLabel: 'Ir a documentos',
    actionRoute: '/documentos',
    autoCompleteCheck: 'has_documento',
  },
  {
    id: 'view_reporte',
    title: 'Ver un reporte',
    description: 'Explora los análisis y métricas del CRM',
    icon: BarChart3,
    actionLabel: 'Ver reportes',
    actionRoute: '/reportes',
    autoCompleteCheck: 'has_viewed_report',
  },
];
