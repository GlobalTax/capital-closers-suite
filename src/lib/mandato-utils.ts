import { ContactoRol, EmpresaRol, TareaPrioridad } from "@/types";

export function getRolColor(rol: ContactoRol | EmpresaRol): string {
  const colors: Record<string, string> = {
    cliente: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    target: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    comprador: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    vendedor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    asesor: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    competidor: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return colors[rol] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
}

export function getPrioridadColor(prioridad: TareaPrioridad): string {
  const colors: Record<TareaPrioridad, string> = {
    baja: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    media: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    alta: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    urgente: 'bg-red-600 text-white dark:bg-red-700',
  };
  return colors[prioridad] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
}

export function formatCurrency(amount?: number | null, currency: string = '€'): string {
  if (!amount) return 'No especificado';
  return `${amount.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${currency}`;
}

export function formatPercentage(value?: number | null): string {
  if (!value && value !== 0) return '-';
  return `${value.toFixed(1)}%`;
}

export function calcularDuracion(fechaInicio?: string, fechaCierre?: string): { duracionDias: number; diasTranscurridos: number; diasRestantes: number; progresoTemporal: number } | null {
  if (!fechaInicio) return null;
  
  const inicio = new Date(fechaInicio);
  const hoy = new Date();
  const cierre = fechaCierre ? new Date(fechaCierre) : null;
  
  const diasTranscurridos = Math.floor((hoy.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
  
  if (!cierre) {
    return {
      duracionDias: diasTranscurridos,
      diasTranscurridos,
      diasRestantes: 0,
      progresoTemporal: 0,
    };
  }
  
  const duracionDias = Math.floor((cierre.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
  const diasRestantes = Math.floor((cierre.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  const progresoTemporal = duracionDias > 0 ? Math.min((diasTranscurridos / duracionDias) * 100, 100) : 0;
  
  return {
    duracionDias,
    diasTranscurridos,
    diasRestantes,
    progresoTemporal,
  };
}
