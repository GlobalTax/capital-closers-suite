// ============================================
// FAKE API SERVICE - Capittal CRM Cierre
// ============================================

import type {
  Mandato,
  Cliente,
  EmpresaTarget,
  Tarea,
  Documento,
  Actividad,
  ResultadoBusqueda,
  ApiResponse,
} from "@/types";

import {
  mockMandatos,
  mockClientes,
  mockTargets,
  mockTareas,
  mockDocumentos,
  mockActividades,
} from "@/lib/mockData";

// Simular delay de red
const delay = () => new Promise((resolve) => setTimeout(resolve, Math.random() * 250 + 250));

// ============================================
// MANDATOS
// ============================================
export const fetchMandatos = async (): Promise<Mandato[]> => {
  await delay();
  return [...mockMandatos];
};

export const getMandatoById = async (id: string): Promise<Mandato | null> => {
  await delay();
  return mockMandatos.find((m) => m.id === id) || null;
};

export const createMandato = async (data: Partial<Mandato>): Promise<ApiResponse<Mandato>> => {
  await delay();
  const newMandato: Mandato = {
    id: `M-${String(mockMandatos.length + 1).padStart(3, "0")}`,
    empresa: data.empresa || "",
    cliente: data.cliente || "",
    clienteId: data.clienteId || "",
    tipo: data.tipo || "venta",
    estado: data.estado || "En progreso",
    valor: data.valor || "€0",
    fecha: new Date().toISOString().split("T")[0],
    ultimaActualizacion: new Date().toISOString().split("T")[0],
    ...data,
  };
  mockMandatos.push(newMandato);
  return { data: newMandato, success: true, message: "Mandato creado exitosamente" };
};

export const updateMandato = async (id: string, data: Partial<Mandato>): Promise<ApiResponse<Mandato>> => {
  await delay();
  const index = mockMandatos.findIndex((m) => m.id === id);
  if (index === -1) {
    return { data: {} as Mandato, success: false, message: "Mandato no encontrado" };
  }
  mockMandatos[index] = { ...mockMandatos[index], ...data };
  return { data: mockMandatos[index], success: true, message: "Mandato actualizado" };
};

export const deleteMandato = async (id: string): Promise<ApiResponse<null>> => {
  await delay();
  const index = mockMandatos.findIndex((m) => m.id === id);
  if (index === -1) {
    return { data: null, success: false, message: "Mandato no encontrado" };
  }
  mockMandatos.splice(index, 1);
  return { data: null, success: true, message: "Mandato eliminado" };
};

// ============================================
// CLIENTES
// ============================================
export const fetchClientes = async (): Promise<Cliente[]> => {
  await delay();
  return [...mockClientes];
};

export const getClienteById = async (id: string): Promise<Cliente | null> => {
  await delay();
  return mockClientes.find((c) => c.id === id) || null;
};

export const createCliente = async (data: Partial<Cliente>): Promise<ApiResponse<Cliente>> => {
  await delay();
  const newCliente: Cliente = {
    id: `C-${String(mockClientes.length + 1).padStart(3, "0")}`,
    nombre: data.nombre || "",
    empresa: data.empresa || "",
    email: data.email || "",
    telefono: data.telefono || "",
    mandatos: 0,
    estado: "Activo",
    fechaRegistro: new Date().toISOString().split("T")[0],
    ...data,
  };
  mockClientes.push(newCliente);
  return { data: newCliente, success: true, message: "Cliente creado exitosamente" };
};

export const updateCliente = async (id: string, data: Partial<Cliente>): Promise<ApiResponse<Cliente>> => {
  await delay();
  const index = mockClientes.findIndex((c) => c.id === id);
  if (index === -1) {
    return { data: {} as Cliente, success: false, message: "Cliente no encontrado" };
  }
  mockClientes[index] = { ...mockClientes[index], ...data };
  return { data: mockClientes[index], success: true, message: "Cliente actualizado" };
};

export const deleteCliente = async (id: string): Promise<ApiResponse<null>> => {
  await delay();
  const index = mockClientes.findIndex((c) => c.id === id);
  if (index === -1) {
    return { data: null, success: false, message: "Cliente no encontrado" };
  }
  mockClientes.splice(index, 1);
  return { data: null, success: true, message: "Cliente eliminado" };
};

// ============================================
// EMPRESAS TARGET
// ============================================
export const fetchTargets = async (): Promise<EmpresaTarget[]> => {
  await delay();
  return [...mockTargets];
};

export const getTargetById = async (id: string): Promise<EmpresaTarget | null> => {
  await delay();
  return mockTargets.find((t) => t.id === id) || null;
};

export const createTarget = async (data: Partial<EmpresaTarget>): Promise<ApiResponse<EmpresaTarget>> => {
  await delay();
  const newTarget: EmpresaTarget = {
    id: `T-${String(mockTargets.length + 1).padStart(3, "0")}`,
    nombre: data.nombre || "",
    sector: data.sector || "",
    facturacion: data.facturacion || "€0",
    empleados: data.empleados || 0,
    ubicacion: data.ubicacion || "",
    interes: data.interes || "Bajo",
    fechaProspeccion: new Date().toISOString().split("T")[0],
    ...data,
  };
  mockTargets.push(newTarget);
  return { data: newTarget, success: true, message: "Target creado exitosamente" };
};

export const updateTarget = async (id: string, data: Partial<EmpresaTarget>): Promise<ApiResponse<EmpresaTarget>> => {
  await delay();
  const index = mockTargets.findIndex((t) => t.id === id);
  if (index === -1) {
    return { data: {} as EmpresaTarget, success: false, message: "Target no encontrado" };
  }
  mockTargets[index] = { ...mockTargets[index], ...data };
  return { data: mockTargets[index], success: true, message: "Target actualizado" };
};

export const deleteTarget = async (id: string): Promise<ApiResponse<null>> => {
  await delay();
  const index = mockTargets.findIndex((t) => t.id === id);
  if (index === -1) {
    return { data: null, success: false, message: "Target no encontrado" };
  }
  mockTargets.splice(index, 1);
  return { data: null, success: true, message: "Target eliminado" };
};

// ============================================
// TAREAS
// ============================================
export const fetchTareas = async (): Promise<Tarea[]> => {
  await delay();
  return [...mockTareas];
};

export const getTareaById = async (id: string): Promise<Tarea | null> => {
  await delay();
  return mockTareas.find((t) => t.id === id) || null;
};

export const createTarea = async (data: Partial<Tarea>): Promise<ApiResponse<Tarea>> => {
  await delay();
  const newTarea: Tarea = {
    id: `TAR-${String(mockTareas.length + 1).padStart(3, "0")}`,
    titulo: data.titulo || "",
    estado: data.estado || "pendiente",
    prioridad: data.prioridad || "media",
    fechaVencimiento: data.fechaVencimiento || new Date().toISOString().split("T")[0],
    ...data,
  };
  mockTareas.push(newTarea);
  return { data: newTarea, success: true, message: "Tarea creada exitosamente" };
};

export const updateTarea = async (id: string, data: Partial<Tarea>): Promise<ApiResponse<Tarea>> => {
  await delay();
  const index = mockTareas.findIndex((t) => t.id === id);
  if (index === -1) {
    return { data: {} as Tarea, success: false, message: "Tarea no encontrada" };
  }
  mockTareas[index] = { ...mockTareas[index], ...data };
  return { data: mockTareas[index], success: true, message: "Tarea actualizada" };
};

export const deleteTarea = async (id: string): Promise<ApiResponse<null>> => {
  await delay();
  const index = mockTareas.findIndex((t) => t.id === id);
  if (index === -1) {
    return { data: null, success: false, message: "Tarea no encontrada" };
  }
  mockTareas.splice(index, 1);
  return { data: null, success: true, message: "Tarea eliminada" };
};

// ============================================
// DOCUMENTOS
// ============================================
export const fetchDocumentos = async (): Promise<Documento[]> => {
  await delay();
  return [...mockDocumentos];
};

export const getDocumentoById = async (id: string): Promise<Documento | null> => {
  await delay();
  return mockDocumentos.find((d) => d.id === id) || null;
};

export const createDocumento = async (data: Partial<Documento>): Promise<ApiResponse<Documento>> => {
  await delay();
  const newDocumento: Documento = {
    id: `DOC-${String(mockDocumentos.length + 1).padStart(3, "0")}`,
    nombre: data.nombre || "",
    tipo: data.tipo || "Contrato",
    mandato: data.mandato || "",
    mandatoId: data.mandatoId || "",
    fecha: new Date().toISOString().split("T")[0],
    tamano: data.tamano || "0 KB",
    ...data,
  };
  mockDocumentos.push(newDocumento);
  return { data: newDocumento, success: true, message: "Documento subido exitosamente" };
};

export const deleteDocumento = async (id: string): Promise<ApiResponse<null>> => {
  await delay();
  const index = mockDocumentos.findIndex((d) => d.id === id);
  if (index === -1) {
    return { data: null, success: false, message: "Documento no encontrado" };
  }
  mockDocumentos.splice(index, 1);
  return { data: null, success: true, message: "Documento eliminado" };
};

// ============================================
// ACTIVIDADES
// ============================================
export const fetchActividades = async (mandatoId?: string): Promise<Actividad[]> => {
  await delay();
  if (mandatoId) {
    return mockActividades.filter((a) => a.mandatoId === mandatoId);
  }
  return [...mockActividades];
};

// ============================================
// BÚSQUEDA GLOBAL
// ============================================
export const searchGlobal = async (query: string): Promise<ResultadoBusqueda[]> => {
  await delay();
  const lowerQuery = query.toLowerCase();
  const resultados: ResultadoBusqueda[] = [];

  // Buscar en mandatos
  mockMandatos.forEach((m) => {
    if (
      m.empresa.toLowerCase().includes(lowerQuery) ||
      m.cliente.toLowerCase().includes(lowerQuery) ||
      m.id.toLowerCase().includes(lowerQuery)
    ) {
      resultados.push({
        tipo: "mandato",
        id: m.id,
        titulo: m.empresa,
        subtitulo: `${m.cliente} • ${m.estado}`,
        ruta: `/mandatos/${m.id}`,
      });
    }
  });

  // Buscar en clientes
  mockClientes.forEach((c) => {
    if (
      c.nombre.toLowerCase().includes(lowerQuery) ||
      c.email.toLowerCase().includes(lowerQuery) ||
      c.empresa.toLowerCase().includes(lowerQuery)
    ) {
      resultados.push({
        tipo: "cliente",
        id: c.id,
        titulo: c.nombre,
        subtitulo: `${c.empresa} • ${c.email}`,
        ruta: `/clientes/${c.id}`,
      });
    }
  });

  // Buscar en targets
  mockTargets.forEach((t) => {
    if (
      t.nombre.toLowerCase().includes(lowerQuery) ||
      t.sector.toLowerCase().includes(lowerQuery) ||
      t.ubicacion.toLowerCase().includes(lowerQuery)
    ) {
      resultados.push({
        tipo: "target",
        id: t.id,
        titulo: t.nombre,
        subtitulo: `${t.sector} • ${t.ubicacion}`,
        ruta: `/targets/${t.id}`,
      });
    }
  });

  return resultados;
};
