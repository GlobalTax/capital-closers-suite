import { format } from "date-fns";
import { es } from "date-fns/locale";
import jsPDF from "jspdf";
import type { PropuestaHonorarios } from "@/types/propuestas";
import { AREAS_DD, type AlcanceDD, type ClausulasAdicionales, type AreaDD } from "@/types/psh";

interface PSHData extends Partial<PropuestaHonorarios> {
  cliente_nombre?: string;
  cliente_cif?: string;
  cliente_domicilio?: string;
  target_nombre?: string;
  target_cif?: string;
  target_domicilio?: string;
  descripcion_transaccion?: string;
  alcance_dd?: AlcanceDD;
  honorarios_negociacion?: number;
  clausulas_adicionales?: ClausulasAdicionales;
}

export function generatePSHPdf(data: PSHData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addText = (text: string, fontSize: number, isMedium = false, align: "left" | "center" | "right" = "left") => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isMedium ? "bold" : "normal");
    const x = align === "center" ? pageWidth / 2 : align === "right" ? pageWidth - margin : margin;
    doc.text(text, x, y, { align });
    y += fontSize * 0.5;
  };

  const addParagraph = (text: string, fontSize = 10) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * fontSize * 0.5 + 4;
  };

  const addSection = (number: number, title: string) => {
    y += 6;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${number}. ${title.toUpperCase()}`, margin, y);
    y += 8;
  };

  const checkNewPage = (neededSpace: number = 30) => {
    if (y > doc.internal.pageSize.getHeight() - neededSpace) {
      doc.addPage();
      y = margin;
    }
  };

  // Header
  addText("PROPUESTA DE SERVICIOS Y HONORARIOS", 16, true, "center");
  y += 8;

  addText(`Fecha: ${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}`, 10, false, "center");
  y += 4;

  if (data.target_nombre) {
    addText(
      `Re: Servicios de asesoramiento en relación con la adquisición del 100% del capital social de ${data.target_nombre}`,
      10,
      false,
      "center"
    );
  }
  y += 10;

  // Section 1: Parties
  addSection(1, "Identificación de las partes");

  if (data.cliente_nombre) {
    addParagraph(
      `La presente Propuesta de Honorarios y Servicios ("PSH") se emite a solicitud de:\n\nRazón social: ${data.cliente_nombre}\nCIF: ${data.cliente_cif || "[CIF]"}\n${data.cliente_domicilio ? `Domicilio: ${data.cliente_domicilio}` : ""}\n\n(en adelante, el "Cliente")`
    );
  }

  if (data.target_nombre) {
    addParagraph(
      `En relación con la adquisición de la entidad mercantil:\n\nRazón social: ${data.target_nombre}\nCIF: ${data.target_cif || "[CIF]"}\n${data.target_domicilio ? `Domicilio: ${data.target_domicilio}` : ""}\n\n(en adelante, el "Target")`
    );
  }

  checkNewPage();

  // Section 2: Introduction
  addSection(2, "Introducción y objeto");
  addParagraph(
    'En atención a la solicitud recibida, la Firma presenta la presente Propuesta de Servicios y Honorarios (la "Propuesta") para la prestación de servicios de asesoramiento profesional al Cliente, en relación con la Transacción.'
  );
  addParagraph(
    "La presente Propuesta tiene por objeto definir:\n\ni) el alcance de los servicios a prestar,\nii) el marco de actuación de la Firma,\niii) las condiciones generales de la colaboración.\n\nEl presente documento tiene carácter estrictamente confidencial."
  );

  checkNewPage();

  // Section 3: Transaction
  if (data.descripcion_transaccion) {
    addSection(3, "Descripción de la transacción");
    addParagraph(data.descripcion_transaccion);
  }

  checkNewPage();

  // Section 4: General scope
  addSection(4, "Alcance general de los servicios");
  addParagraph(
    "La Firma actuará como asesor del comprador, prestando un servicio integral de asesoramiento en el marco de la Transacción, orientado a:\n\n• estructurar y coordinar adecuadamente el proceso de compraventa, incluyendo sus distintas fases (análisis, Due Diligence, negociación y cierre); y\n\n• identificar, analizar y mitigar los riesgos legales, fiscales, financieros y laborales asociados a la Transacción, con el fin de proteger los intereses del comprador."
  );

  checkNewPage();

  // Section 5: DD Scope
  if (data.alcance_dd && Object.keys(data.alcance_dd).length > 0) {
    addSection(5, "Due Diligence – Alcance detallado");
    addParagraph(
      "La Firma prestará servicios de coordinación, revisión y asesoramiento en relación con un proceso de Due Diligence integral del Target, cuyo alcance detallado por áreas se recoge a continuación:"
    );

    Object.entries(data.alcance_dd).forEach(([area, areaData]) => {
      if (areaData?.incluido) {
        checkNewPage(40);
        const areaKey = area as AreaDD;
        const areaConfig = AREAS_DD[area];
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`${areaConfig?.label || area}`, margin, y);
        y += 6;

        if (areaData.alcance?.length > 0) {
          areaData.alcance.forEach((item: string) => {
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`• ${item}`, margin + 5, y);
            y += 5;
          });
        }
        y += 4;
      }
    });
  }

  checkNewPage();

  // Section 6: Negotiation
  if (data.honorarios_negociacion && data.honorarios_negociacion > 0) {
    addSection(6, "Negociación y cierre de la transacción");
    addParagraph(
      "La Firma asistirá al Cliente, en su condición de comprador, en todas las fases de negociación y cierre de la Transacción, incluyendo:\n\n• negociación y revisión del Contrato de Compraventa de Participaciones;\n• análisis y negociación de las manifestaciones y garantías;\n• negociación de las limitaciones de responsabilidad y mecanismos de indemnización;\n• definición de mecanismos de ajuste de precio;\n• coordinación del proceso de firma y cierre de la operación."
    );
  }

  checkNewPage();

  // Section 7: Fees
  addSection(7, "Honorarios y facturación");

  // DD Table
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("7.1. Honorarios por Due Diligence", margin, y);
  y += 8;

  let totalDD = 0;
  if (data.alcance_dd) {
    (Object.entries(data.alcance_dd) as [AreaDD, any][]).forEach(([area, areaData]) => {
      if (areaData?.incluido) {
        const areaConfig = AREAS_DD[area];
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(areaConfig?.label || area, margin, y);
        doc.text(`${areaData.importe?.toLocaleString("es-ES")} € + IVA`, pageWidth - margin, y, { align: "right" });
        y += 6;
        totalDD += areaData.importe || 0;
      }
    });

    y += 2;
    doc.setFont("helvetica", "bold");
    doc.text("Total Due Diligence:", margin, y);
    doc.text(`${totalDD.toLocaleString("es-ES")} € + IVA`, pageWidth - margin, y, { align: "right" });
    y += 10;
  }

  // Negotiation fees
  if (data.honorarios_negociacion && data.honorarios_negociacion > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("7.2. Honorarios por Negociación y Cierre", margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${data.honorarios_negociacion.toLocaleString("es-ES")} € + IVA`, pageWidth - margin, y, { align: "right" });
    y += 10;
  }

  // Total
  const total = totalDD + (data.honorarios_negociacion || 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL PROPUESTA:", margin, y);
  doc.text(`${total.toLocaleString("es-ES")} € + IVA`, pageWidth - margin, y, { align: "right" });
  y += 10;

  checkNewPage();

  // Payment conditions
  if (data.condiciones_pago) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("7.3. Forma de Pago", margin, y);
    y += 6;
    addParagraph(data.condiciones_pago);
  }

  checkNewPage();

  // Legal clauses
  const clausulas = data.clausulas_adicionales || {};

  if (clausulas.limitacion_responsabilidad) {
    addSection(8, "Limitación de responsabilidad");
    addParagraph(
      "La responsabilidad total de la Firma frente al Cliente, derivada de la presente Propuesta, quedará limitada al importe total de los honorarios efectivamente percibidos, salvo en caso de dolo o culpa grave."
    );
  }

  if (clausulas.confidencialidad) {
    addSection(9, "Confidencialidad");
    addParagraph(
      "Las partes se comprometen a mantener la confidencialidad sobre la información intercambiada y sobre la existencia y contenido de la presente Propuesta."
    );
  }

  addSection(10, "Ley aplicable y jurisdicción");
  addParagraph(
    `La presente Propuesta se regirá por la ley ${clausulas.ley_aplicable || "española"}, sometiéndose las partes a los Juzgados y Tribunales de ${clausulas.jurisdiccion || "Barcelona"}, con renuncia expresa a cualquier otro fuero que pudiera corresponderles.`
  );

  checkNewPage(60);

  // Signatures
  addSection(11, "Aceptación");
  addParagraph("En señal de conformidad, el Cliente firma la presente Propuesta.");
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  // Client signature
  doc.text("Por el Cliente", margin, y);
  doc.text(`${data.cliente_nombre || "[CLIENTE]"}`, margin, y + 6);
  y += 20;
  doc.text("Firma: _______________________", margin, y);

  // Firm signature
  y += 20;
  doc.text("Por la Firma", margin, y);
  y += 20;
  doc.text("Nombre y firma: _______________________", margin, y);

  return doc;
}

export function downloadPSHPdf(data: PSHData, filename?: string) {
  const doc = generatePSHPdf(data);
  const name = filename || `PSH_${data.titulo?.replace(/\s+/g, "_") || "propuesta"}_${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(name);
}

export function previewPSHPdf(data: PSHData): string {
  const doc = generatePSHPdf(data);
  return doc.output("bloburl") as unknown as string;
}
