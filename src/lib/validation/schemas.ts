import { z } from "zod";
import { VALIDATION_REGEX, VALIDATION_MESSAGES } from "./regex";

// Validaciones reutilizables
export const emailSchema = z
  .string()
  .min(1, "Email requerido")
  .email("Email inválido")
  .max(254, "Email demasiado largo");

export const phoneSchema = z
  .string()
  .regex(VALIDATION_REGEX.phone, VALIDATION_MESSAGES.phone)
  .optional();

export const cifSchema = z
  .string()
  .regex(VALIDATION_REGEX.cif, VALIDATION_MESSAGES.cif)
  .optional();

export const urlSchema = z
  .string()
  .url("URL inválida")
  .optional();

export const currencySchema = z
  .number()
  .positive("Debe ser mayor que 0")
  .max(999999999, "Valor demasiado alto");

// Schema de Mandato
export const mandatoCreateSchema = z.object({
  titulo: z.string().min(2, "Título muy corto").max(100, "Título muy largo"),
  tipo: z.enum(['compra', 'venta']),
  empresa_principal_id: z.string().uuid("ID de empresa inválido"),
  valor: currencySchema.optional(),
  estado: z.enum(['prospecto', 'activo', 'en_negociacion', 'cerrado', 'cancelado']),
  fecha_inicio: z.string().optional(),
  fecha_cierre: z.string().optional(),
  descripcion: z.string().max(500, "Descripción muy larga").optional(),
}).refine(
  data => {
    if (!data.fecha_cierre || !data.fecha_inicio) return true;
    return new Date(data.fecha_cierre) > new Date(data.fecha_inicio);
  },
  { message: "Fecha de cierre debe ser posterior a fecha de inicio", path: ["fecha_cierre"] }
);

// Schema de Contacto
export const contactoCreateSchema = z.object({
  nombre: z.string().min(2, "Nombre muy corto").max(50, "Nombre muy largo"),
  apellidos: z.string().max(50, "Apellidos muy largos").optional(),
  email: emailSchema,
  telefono: phoneSchema,
  empresa_principal_id: z.string().uuid().optional(),
  cargo: z.string().max(100, "Cargo muy largo").optional(),
  linkedin: urlSchema,
  notas: z.string().max(500, "Notas muy largas").optional(),
});

// Schema de Empresa
export const empresaCreateSchema = z.object({
  nombre: z.string().min(2, "Nombre muy corto").max(100, "Nombre muy largo"),
  cif: cifSchema,
  sector: z.string().min(2, "Sector muy corto").max(100, "Sector muy largo"),
  web: urlSchema,
  empleados: z.number().int().positive().optional(),
  facturacion: currencySchema.optional(),
  ebitda: z.number().optional(),
  ubicacion: z.string().max(200, "Ubicación muy larga").optional(),
  descripcion: z.string().max(1000, "Descripción muy larga").optional(),
});

// Schema de Tarea
export const tareaCreateSchema = z.object({
  titulo: z.string().min(2, "Título muy corto").max(100, "Título muy largo"),
  descripcion: z.string().max(500, "Descripción muy larga").optional(),
  estado: z.enum(['pendiente', 'en_progreso', 'completada', 'cancelada']),
  prioridad: z.enum(['baja', 'media', 'alta', 'urgente']),
  fecha_vencimiento: z.string().optional(),
  asignado_a: z.string().uuid().optional(),
  mandato_id: z.string().uuid().optional(),
});
