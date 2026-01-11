import jsPDF from 'jspdf';
import type { MandatoCompraData } from '@/types/document-generators';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const MARGIN_LEFT = 25;
const MARGIN_RIGHT = 25;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

export function generateMandatoCompraPdf(data: MandatoCompraData): jsPDF {
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
  addText('CONTRATO DE MANDATO DE COMPRA', 16, true, 'center');
  y += 10;

  const fechaFormateada = format(new Date(data.fecha), "d 'de' MMMM 'de' yyyy", { locale: es });
  addText(`En ${data.lugar}, a ${fechaFormateada}`, 11, false, 'center');
  y += 15;

  // ========== REUNIDOS ==========
  addText('REUNIDOS', 12, true);
  y += 8;

  addParagraph(`De una parte, ${data.asesor_nombre.toUpperCase()}, con C.I.F. ${data.asesor_cif}, y domicilio social en ${data.asesor_domicilio}, representada por D./Dña. ${data.asesor_representante} (en adelante, el "ASESOR").`);

  addParagraph(`De otra parte, ${data.cliente_nombre.toUpperCase()}, con C.I.F. ${data.cliente_cif}, y domicilio social en ${data.cliente_domicilio}, representada por D./Dña. ${data.cliente_representante}${data.cliente_cargo_representante ? `, en calidad de ${data.cliente_cargo_representante}` : ''} (en adelante, el "CLIENTE" o "MANDANTE").`);

  addParagraph('Ambas partes se reconocen mutuamente capacidad legal suficiente para la firma del presente contrato y, a tal efecto,');

  y += 5;
  addText('EXPONEN', 12, true);
  y += 8;

  addParagraph('I.- Que el CLIENTE está interesado en identificar oportunidades de adquisición de empresas o participaciones societarias que cumplan determinados criterios de inversión.');

  addParagraph('II.- Que el CLIENTE desea contratar los servicios profesionales del ASESOR para la búsqueda activa de oportunidades de inversión, análisis de las mismas y asesoramiento en el proceso de adquisición.');

  addParagraph('III.- Que el ASESOR es una firma de asesoramiento especializada en operaciones corporativas de compraventa de empresas (M&A) y dispone de los medios, experiencia y red de contactos necesarios para prestar los servicios requeridos.');

  addParagraph('Por todo lo anterior, las partes acuerdan suscribir el presente CONTRATO DE MANDATO DE COMPRA, que se regirá por las siguientes');

  y += 5;
  addText('CLÁUSULAS', 12, true, 'center');
  y += 8;

  // ========== CLÁUSULAS ==========
  addSection(
    'PRIMERA.- OBJETO DEL MANDATO',
    'El CLIENTE encomienda al ASESOR, quien acepta, la prestación de servicios de asesoramiento financiero para la búsqueda, identificación, análisis y adquisición de empresas o participaciones societarias que cumplan los criterios de inversión definidos en el presente contrato.'
  );

  // Criterios de búsqueda
  addSection(
    'SEGUNDA.- PERFIL DE INVERSIÓN',
    'El ASESOR buscará oportunidades de inversión que cumplan los siguientes criterios:'
  );
  y -= 4;

  const criterios: string[] = [];
  if (data.sectores_objetivo.length > 0) {
    criterios.push(`Sectores de actividad: ${data.sectores_objetivo.join(', ')}`);
  }
  if (data.geografia_objetivo.length > 0) {
    criterios.push(`Ubicación geográfica: ${data.geografia_objetivo.join(', ')}`);
  }
  if (data.facturacion_min || data.facturacion_max) {
    criterios.push(`Facturación: ${data.facturacion_min ? `desde ${formatCurrency(data.facturacion_min)}` : ''}${data.facturacion_min && data.facturacion_max ? ' ' : ''}${data.facturacion_max ? `hasta ${formatCurrency(data.facturacion_max)}` : ''}`);
  }
  if (data.ebitda_min || data.ebitda_max) {
    criterios.push(`EBITDA: ${data.ebitda_min ? `desde ${formatCurrency(data.ebitda_min)}` : ''}${data.ebitda_min && data.ebitda_max ? ' ' : ''}${data.ebitda_max ? `hasta ${formatCurrency(data.ebitda_max)}` : ''}`);
  }
  if (data.empleados_min || data.empleados_max) {
    criterios.push(`Número de empleados: ${data.empleados_min ? `desde ${data.empleados_min}` : ''}${data.empleados_min && data.empleados_max ? ' ' : ''}${data.empleados_max ? `hasta ${data.empleados_max}` : ''}`);
  }
  if (data.inversion_min || data.inversion_max) {
    criterios.push(`Rango de inversión: ${data.inversion_min ? `desde ${formatCurrency(data.inversion_min)}` : ''}${data.inversion_min && data.inversion_max ? ' ' : ''}${data.inversion_max ? `hasta ${formatCurrency(data.inversion_max)}` : ''}`);
  }
  if (data.estructura_preferida) {
    criterios.push(`Estructura preferida: ${data.estructura_preferida}`);
  }
  if (data.caracteristicas_deseadas && data.caracteristicas_deseadas.length > 0) {
    criterios.push(`Características deseadas: ${data.caracteristicas_deseadas.join(', ')}`);
  }
  
  addBulletList(criterios);

  if (data.exclusiones && data.exclusiones.length > 0) {
    addParagraph('Se excluyen expresamente:');
    addBulletList(data.exclusiones);
  }

  addSection(
    'TERCERA.- SERVICIOS A PRESTAR',
    'El ASESOR prestará los siguientes servicios:'
  );
  y -= 4;
  addBulletList(data.servicios);

  const exclusividadTexto = data.exclusividad
    ? `El presente mandato tiene carácter de EXCLUSIVO para los sectores y geografías definidos. Durante la vigencia del mismo, el CLIENTE se compromete a no encomendar servicios similares a otros asesores para la búsqueda de oportunidades que cumplan el perfil definido.`
    : `El presente mandato tiene carácter de NO EXCLUSIVO. El CLIENTE podrá encomendar servicios similares a otros asesores o realizar gestiones directas para la búsqueda de oportunidades de inversión.`;

  addSection('CUARTA.- EXCLUSIVIDAD', exclusividadTexto);

  addSection(
    'QUINTA.- DURACIÓN',
    `El presente contrato tendrá una duración de ${data.duracion_meses} meses desde la fecha de su firma.${data.renovacion_automatica ? ` El contrato se prorrogará automáticamente por períodos sucesivos de igual duración, salvo que cualquiera de las partes comunique a la otra su voluntad de no renovarlo con una antelación mínima de ${data.preaviso_dias} días.` : ''}`
  );

  let honorariosTexto = 'Los honorarios del ASESOR se estructuran de la siguiente manera:\n\n';
  
  if (data.honorario_fijo) {
    honorariosTexto += `a) Honorario fijo mensual (retainer): ${formatCurrency(data.honorario_fijo)}, pagadero por adelantado al inicio de cada mes.\n\n`;
  }
  
  honorariosTexto += `${data.honorario_fijo ? 'b)' : 'a)'} Honorario de éxito: ${data.honorario_exito_porcentaje}% del valor de la transacción (Enterprise Value), pagadero al cierre de cualquier operación de adquisición realizada durante la vigencia del mandato o durante los 12 meses siguientes a su terminación, siempre que la oportunidad hubiera sido presentada por el ASESOR.`;
  
  if (data.honorario_minimo) {
    honorariosTexto += ` El honorario de éxito no será inferior a ${formatCurrency(data.honorario_minimo)}.`;
  }

  addSection('SEXTA.- HONORARIOS', honorariosTexto);

  if (data.gastos_provision) {
    addSection(
      'SÉPTIMA.- GASTOS',
      `El CLIENTE abonará una provisión inicial de ${formatCurrency(data.gastos_provision)} para cubrir gastos directos del proceso de búsqueda y análisis.`
    );
  }

  addSection(
    `${data.gastos_provision ? 'OCTAVA' : 'SÉPTIMA'}.- CONFIDENCIALIDAD`,
    'Las partes se obligan a mantener la más estricta confidencialidad sobre la existencia del presente mandato, los criterios de búsqueda del CLIENTE y toda la información intercambiada.'
  );

  addSection(
    `${data.gastos_provision ? 'NOVENA' : 'OCTAVA'}.- LEY APLICABLE Y JURISDICCIÓN`,
    `El presente contrato se regirá por la ${data.ley_aplicable}. Para la resolución de controversias, las partes se someten a los ${data.jurisdiccion}.`
  );

  // ========== FIRMAS ==========
  checkNewPage(60);
  y += 15;
  addParagraph('Y en prueba de conformidad, las partes firman el presente contrato por duplicado en el lugar y fecha indicados.');

  y += 20;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('EL ASESOR', MARGIN_LEFT, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.asesor_nombre, MARGIN_LEFT, y + 8);
  doc.text(`D./Dña. ${data.asesor_representante}`, MARGIN_LEFT, y + 14);
  doc.line(MARGIN_LEFT, y + 35, MARGIN_LEFT + 60, y + 35);
  doc.text('Firma', MARGIN_LEFT + 25, y + 42);

  const rightCol = PAGE_WIDTH / 2 + 10;
  doc.setFont('helvetica', 'bold');
  doc.text('EL CLIENTE', rightCol, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.cliente_nombre, rightCol, y + 8);
  doc.text(`D./Dña. ${data.cliente_representante}`, rightCol, y + 14);
  doc.line(rightCol, y + 35, rightCol + 60, y + 35);
  doc.text('Firma', rightCol + 25, y + 42);

  return doc;
}

export function downloadMandatoCompraPdf(data: MandatoCompraData, filename?: string): void {
  const doc = generateMandatoCompraPdf(data);
  const defaultFilename = `Mandato_Compra_${data.cliente_nombre.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(filename || defaultFilename);
}

export function previewMandatoCompraPdf(data: MandatoCompraData): string {
  const doc = generateMandatoCompraPdf(data);
  return doc.output('dataurlstring');
}
