import jsPDF from 'jspdf';
import type { LOIData } from '@/types/document-generators';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const MARGIN_LEFT = 25;
const MARGIN_RIGHT = 25;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

export function generateLOIPdf(data: LOIData): jsPDF {
  const doc = new jsPDF();
  let y = 30;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

  const addText = (text: string, fontSize: number, isBold = false, align: 'left' | 'center' | 'justify' = 'left') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    if (align === 'center') {
      doc.text(text, PAGE_WIDTH / 2, y, { align: 'center' });
    } else {
      doc.text(text, MARGIN_LEFT, y);
    }
    y += fontSize * 0.5;
  };

  const addParagraph = (text: string, fontSize = 11) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
    doc.text(lines, MARGIN_LEFT, y, { align: 'justify', maxWidth: CONTENT_WIDTH });
    y += lines.length * fontSize * 0.45 + 4;
  };

  const addSection = (title: string, content: string) => {
    checkNewPage(40);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, MARGIN_LEFT, y);
    y += 8;
    addParagraph(content);
    y += 4;
  };

  const addBulletList = (items: string[]) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    items.forEach(item => {
      checkNewPage(15);
      doc.text('•', MARGIN_LEFT + 5, y);
      const lines = doc.splitTextToSize(item, CONTENT_WIDTH - 15);
      doc.text(lines, MARGIN_LEFT + 12, y);
      y += lines.length * 5 + 3;
    });
    y += 4;
  };

  const checkNewPage = (requiredSpace: number) => {
    if (y + requiredSpace > 270) {
      doc.addPage();
      y = 25;
    }
  };

  // ========== TÍTULO ==========
  addText('CARTA DE INTENCIONES', 16, true, 'center');
  addText('(LETTER OF INTENT)', 12, false, 'center');
  y += 10;

  const fechaFormateada = format(new Date(data.fecha), "d 'de' MMMM 'de' yyyy", { locale: es });
  addText(`${data.lugar}, ${fechaFormateada}`, 11, false, 'center');
  y += 15;

  // Destinatario
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('A la atención de:', MARGIN_LEFT, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(data.vendedor_nombre, MARGIN_LEFT, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Att: D./Dña. ${data.vendedor_representante}`, MARGIN_LEFT, y);
  y += 5;
  doc.text(data.vendedor_domicilio, MARGIN_LEFT, y);
  y += 15;

  // Asunto
  doc.setFont('helvetica', 'bold');
  doc.text(`Asunto: Carta de Intenciones para la adquisición de ${data.target_nombre}`, MARGIN_LEFT, y);
  y += 12;

  // Introducción
  doc.setFont('helvetica', 'normal');
  addParagraph(`Estimados Sres.,`);
  
  addParagraph(`En nombre de ${data.comprador_nombre.toUpperCase()} (C.I.F. ${data.comprador_cif}), con domicilio en ${data.comprador_domicilio}, representada por D./Dña. ${data.comprador_representante} (en adelante, el "COMPRADOR"), nos dirigimos a ustedes para manifestar nuestro interés en la adquisición del ${data.porcentaje_adquisicion}% del capital social de ${data.target_nombre.toUpperCase()}${data.target_cif ? ` (C.I.F. ${data.target_cif})` : ''} (en adelante, la "SOCIEDAD" o "TARGET").`);

  addParagraph(`La presente carta de intenciones (en adelante, la "LOI" o "Carta") tiene por objeto establecer los términos y condiciones principales bajo los cuales el COMPRADOR estaría dispuesto a llevar a cabo la transacción contemplada, sujeto a la realización satisfactoria de un proceso de due diligence y a la negociación y firma de los documentos definitivos.`);

  y += 5;

  // ========== TÉRMINOS PROPUESTOS ==========
  addText('TÉRMINOS PROPUESTOS', 12, true);
  y += 8;

  addSection(
    '1. OBJETO DE LA TRANSACCIÓN',
    `Adquisición del ${data.porcentaje_adquisicion}% del capital social de la SOCIEDAD${data.target_descripcion ? `, dedicada a ${data.target_descripcion}` : ''}.`
  );

  let precioTexto = `El precio propuesto para la adquisición es de ${formatCurrency(data.precio_indicativo)} (el "Precio").`;
  if (data.estructura_pago) {
    precioTexto += ` La estructura de pago propuesta es: ${data.estructura_pago}.`;
  }
  if (data.ajustes_precio && data.ajustes_precio.length > 0) {
    precioTexto += ` El Precio estará sujeto a los siguientes ajustes: ${data.ajustes_precio.join(', ')}.`;
  }
  addSection('2. PRECIO', precioTexto);

  addSection(
    '3. DUE DILIGENCE',
    `El COMPRADOR llevará a cabo un proceso de due diligence sobre la SOCIEDAD durante un período de ${data.dd_plazo_dias} días naturales contados desde la fecha de aceptación de la presente LOI. El alcance del due diligence incluirá:`
  );
  y -= 4;
  addBulletList(data.dd_alcance);

  addParagraph('El VENDEDOR facilitará al COMPRADOR acceso completo a toda la información, documentación y personal necesarios para la realización del due diligence.');

  if (data.exclusividad) {
    addSection(
      '4. EXCLUSIVIDAD',
      `Durante un período de ${data.exclusividad_dias || 60} días naturales desde la aceptación de esta LOI, el VENDEDOR se compromete a no iniciar, continuar o mantener negociaciones con terceros respecto a la venta de la SOCIEDAD, ni a facilitar información a terceros interesados.`
    );
  }

  if (data.condiciones_suspensivas && data.condiciones_suspensivas.length > 0) {
    addSection(
      `${data.exclusividad ? '5' : '4'}. CONDICIONES SUSPENSIVAS`,
      'La consumación de la transacción estará sujeta a las siguientes condiciones suspensivas:'
    );
    y -= 4;
    addBulletList(data.condiciones_suspensivas);
  }

  const clausulaConf = data.exclusividad 
    ? (data.condiciones_suspensivas && data.condiciones_suspensivas.length > 0 ? '6' : '5')
    : (data.condiciones_suspensivas && data.condiciones_suspensivas.length > 0 ? '5' : '4');

  addSection(
    `${clausulaConf}. CONFIDENCIALIDAD`,
    'Las partes se comprometen a mantener la más estricta confidencialidad sobre la existencia y contenido de la presente LOI, así como sobre cualquier información intercambiada en el marco de las negociaciones. Esta obligación tiene carácter vinculante y sobrevivirá a la terminación de las negociaciones.'
  );

  const clausulaCaracter = parseInt(clausulaConf) + 1;
  
  const caracterTexto = data.vinculante
    ? `La presente LOI tiene carácter VINCULANTE en su totalidad. Las partes se obligan a negociar de buena fe los documentos definitivos de la transacción.`
    : `La presente LOI tiene carácter NO VINCULANTE, excepto por las cláusulas relativas a confidencialidad${data.exclusividad ? ', exclusividad' : ''} y gastos, que tendrán carácter vinculante. Las partes no estarán obligadas a consumar la transacción hasta la firma de los documentos definitivos.`;

  addSection(`${clausulaCaracter}. CARÁCTER DE LA LOI`, caracterTexto);

  const clausulaValidez = clausulaCaracter + 1;
  addSection(
    `${clausulaValidez}. VALIDEZ`,
    `La presente LOI tendrá validez durante ${data.validez_dias} días naturales desde su fecha. Transcurrido dicho plazo sin que el VENDEDOR haya comunicado su aceptación, la presente LOI quedará sin efecto automáticamente.${data.cierre_estimado ? ` En caso de aceptación, las partes estiman que el cierre de la operación podría producirse en ${data.cierre_estimado}.` : ''}`
  );

  const clausulaLey = clausulaValidez + 1;
  addSection(
    `${clausulaLey}. LEY APLICABLE Y JURISDICCIÓN`,
    `La presente LOI se regirá por la ${data.ley_aplicable}. Para cualquier controversia, las partes se someten a los ${data.jurisdiccion}.`
  );

  // ========== CIERRE ==========
  checkNewPage(80);
  y += 10;
  
  addParagraph('Quedamos a su disposición para cualquier aclaración que precisen sobre los términos de la presente propuesta.');
  y += 5;
  addParagraph('Atentamente,');
  
  y += 15;
  
  // Firma Comprador
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Por el COMPRADOR:', MARGIN_LEFT, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(data.comprador_nombre, MARGIN_LEFT, y);
  y += 5;
  doc.text(`D./Dña. ${data.comprador_representante}`, MARGIN_LEFT, y);
  
  y += 25;
  doc.line(MARGIN_LEFT, y, MARGIN_LEFT + 60, y);
  y += 5;
  doc.text('Firma', MARGIN_LEFT + 25, y);

  // Aceptación
  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.text('ACEPTACIÓN:', MARGIN_LEFT, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  addParagraph('Por la presente, manifestamos nuestra conformidad con los términos de la presente Carta de Intenciones.');
  
  y += 10;
  doc.text('Por el VENDEDOR:', MARGIN_LEFT, y);
  y += 8;
  doc.text(data.vendedor_nombre, MARGIN_LEFT, y);
  y += 5;
  doc.text(`D./Dña. ${data.vendedor_representante}`, MARGIN_LEFT, y);
  
  y += 25;
  doc.line(MARGIN_LEFT, y, MARGIN_LEFT + 60, y);
  y += 5;
  doc.text('Firma', MARGIN_LEFT + 25, y);
  
  // Fecha de aceptación
  y += 10;
  doc.text('Fecha de aceptación: ____________________', MARGIN_LEFT, y);

  return doc;
}

export function downloadLOIPdf(data: LOIData, filename?: string): void {
  const doc = generateLOIPdf(data);
  const defaultFilename = `LOI_${data.target_nombre.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(filename || defaultFilename);
}

export function previewLOIPdf(data: LOIData): string {
  const doc = generateLOIPdf(data);
  return doc.output('dataurlstring');
}
