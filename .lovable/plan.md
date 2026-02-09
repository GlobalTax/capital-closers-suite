

# Actualizar texto del Acuerdo de Confidencialidad

## Cambio
Modificar el texto del acuerdo en `ConfidentialityAgreementModal.tsx` para incluir una clausula especifica sobre la no divulgacion del funcionamiento de los sistemas informaticos y el know-how de la plataforma.

## Detalle tecnico

**Archivo a modificar:** `src/components/auth/ConfidentialityAgreementModal.tsx`

Se añadira en la seccion de "OBLIGACION DE CONFIDENCIALIDAD" y/o "DATOS PROTEGIDOS" referencias explicitas a:
- No revelar el funcionamiento de los sistemas informaticos de la plataforma.
- No divulgar el know-how tecnologico o metodologico.

Tambien se actualizara el texto del checkbox de aceptacion para reflejar este compromiso adicional.

No se requieren cambios en la base de datos ni en la logica del hook, ya que la version del acuerdo se mantiene igual (es una actualizacion de redaccion, no un nuevo acuerdo que requiera re-aceptacion). Si se desea forzar que todos los usuarios vuelvan a aceptar, se incrementaria `CURRENT_AGREEMENT_VERSION` a 2.

