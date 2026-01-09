import jsPDF from 'jspdf';
import type { MandatoVentaData } from '@/types/document-generators';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const MARGIN_LEFT = 25;
const MARGIN_RIGHT = 25;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

export function generateMandatoVentaPdf(data: MandatoVentaData): jsPDF {
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
  addText('CONTRATO DE MANDATO DE VENTA', 16, true, 'center');
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

  addParagraph(`I.- Que el CLIENTE es titular de participaciones/acciones representativas del capital social de ${data.target_nombre.toUpperCase()}${data.target_cif ? ` (C.I.F. ${data.target_cif})` : ''}${data.target_descripcion ? `, sociedad dedicada a ${data.target_descripcion}` : ''} (en adelante, la "SOCIEDAD" o "TARGET").`);

  addParagraph('II.- Que el CLIENTE desea explorar la posible transmisión de su participación en la SOCIEDAD y, a tal efecto, desea contratar los servicios profesionales de asesoramiento del ASESOR.');

  addParagraph('III.- Que el ASESOR es una firma de asesoramiento especializada en operaciones corporativas de compraventa de empresas (M&A) y dispone de los medios y experiencia necesarios para prestar los servicios requeridos.');

  addParagraph('Por todo lo anterior, las partes acuerdan suscribir el presente CONTRATO DE MANDATO DE VENTA, que se regirá por las siguientes');

  y += 5;
  addText('CLÁUSULAS', 12, true, 'center');
  y += 8;

  // ========== CLÁUSULAS ==========
  addSection(
    'PRIMERA.- OBJETO DEL MANDATO',
    'El CLIENTE encomienda al ASESOR, quien acepta, la prestación de servicios de asesoramiento financiero y coordinación del proceso de venta de la participación del CLIENTE en la SOCIEDAD, incluyendo la búsqueda de potenciales compradores, la coordinación de las negociaciones y el acompañamiento hasta el cierre de la operación.'
  );

  addSection(
    'SEGUNDA.- SERVICIOS A PRESTAR',
    'El ASESOR prestará los siguientes servicios:'
  );
  y -= 4;
  addBulletList(data.servicios);

  if (data.valoracion_indicativa_min && data.valoracion_indicativa_max) {
    addSection(
      'TERCERA.- VALORACIÓN INDICATIVA',
      `A efectos meramente orientativos y sin que ello implique compromiso alguno sobre el precio final de la operación, las partes estiman que el valor de la SOCIEDAD se sitúa en un rango entre ${formatCurrency(data.valoracion_indicativa_min)} y ${formatCurrency(data.valoracion_indicativa_max)}${data.valoracion_metodo ? `, basándose en ${data.valoracion_metodo}` : ''}. Dicho valor podrá ser ajustado en función del análisis de due diligence y las condiciones del mercado.`
    );
  }

  const exclusividadTexto = data.exclusividad
    ? `El presente mandato tiene carácter de EXCLUSIVO. Durante la vigencia del mismo, el CLIENTE se compromete a no encomendar servicios similares a otros asesores ni a realizar gestiones directas para la venta de la SOCIEDAD sin la intervención del ASESOR. En caso de que el CLIENTE reciba cualquier manifestación de interés de terceros, deberá comunicarlo inmediatamente al ASESOR.`
    : `El presente mandato tiene carácter de NO EXCLUSIVO. El CLIENTE podrá encomendar servicios similares a otros asesores o realizar gestiones directas para la venta de la SOCIEDAD.`;

  addSection(
    `${data.valoracion_indicativa_min ? 'CUARTA' : 'TERCERA'}.- EXCLUSIVIDAD`,
    exclusividadTexto
  );

  let clausulaNum = data.valoracion_indicativa_min ? 'QUINTA' : 'CUARTA';
  
  addSection(
    `${clausulaNum}.- DURACIÓN`,
    `El presente contrato tendrá una duración de ${data.duracion_meses} meses desde la fecha de su firma.${data.renovacion_automatica ? ` El contrato se prorrogará automáticamente por períodos sucesivos de igual duración, salvo que cualquiera de las partes comunique a la otra su voluntad de no renovarlo con una antelación mínima de ${data.preaviso_dias} días a la fecha de vencimiento.` : ` A su vencimiento, el contrato quedará extinguido salvo acuerdo expreso de las partes para su renovación.`}`
  );

  clausulaNum = data.valoracion_indicativa_min ? 'SEXTA' : 'QUINTA';

  let honorariosTexto = 'Los honorarios del ASESOR se estructuran de la siguiente manera:\n\n';
  
  if (data.honorario_fijo) {
    honorariosTexto += `a) Honorario fijo inicial: ${formatCurrency(data.honorario_fijo)}, pagadero a la firma del presente contrato, como provisión de fondos a cuenta de los servicios.\n\n`;
  }
  
  honorariosTexto += `${data.honorario_fijo ? 'b)' : 'a)'} Honorario de éxito: ${data.honorario_exito_porcentaje}% del valor de la transacción (Enterprise Value), pagadero a la firma del contrato de compraventa o al cierre de la operación.`;
  
  if (data.honorario_minimo) {
    honorariosTexto += ` En todo caso, el honorario de éxito no será inferior a ${formatCurrency(data.honorario_minimo)}.`;
  }

  addSection(`${clausulaNum}.- HONORARIOS`, honorariosTexto);

  if (data.gastos_provision) {
    clausulaNum = data.valoracion_indicativa_min ? 'SÉPTIMA' : 'SEXTA';
    addSection(
      `${clausulaNum}.- GASTOS`,
      `El CLIENTE abonará una provisión inicial de ${formatCurrency(data.gastos_provision)} para cubrir los gastos directos del proceso (viajes, due diligence inicial, data room virtual, etc.). Los gastos se facturarán según consumo y la provisión no utilizada será devuelta al CLIENTE.`
    );
  }

  addSection(
    `${data.gastos_provision ? (data.valoracion_indicativa_min ? 'OCTAVA' : 'SÉPTIMA') : (data.valoracion_indicativa_min ? 'SÉPTIMA' : 'SEXTA')}.- CONFIDENCIALIDAD`,
    'Las partes se obligan a mantener la más estricta confidencialidad sobre la existencia del presente mandato, el proceso de venta y toda la información intercambiada durante el mismo. Esta obligación de confidencialidad sobrevivirá a la terminación del presente contrato.'
  );

  addSection(
    `${data.gastos_provision ? (data.valoracion_indicativa_min ? 'NOVENA' : 'OCTAVA') : (data.valoracion_indicativa_min ? 'OCTAVA' : 'SÉPTIMA')}.- LEY APLICABLE Y JURISDICCIÓN`,
    `El presente contrato se regirá e interpretará de conformidad con la ${data.ley_aplicable}. Para la resolución de cualquier controversia derivada del presente contrato, las partes se someten expresamente a la jurisdicción de los ${data.jurisdiccion}, con renuncia a cualquier otro fuero que pudiera corresponderles.`
  );

  // ========== FIRMAS ==========
  checkNewPage(60);
  y += 15;
  addParagraph('Y en prueba de conformidad con cuanto antecede, las partes firman el presente contrato por duplicado y a un solo efecto, en el lugar y fecha indicados en el encabezamiento.');

  y += 20;
  
  // Columna izquierda - Asesor
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('EL ASESOR', MARGIN_LEFT, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.asesor_nombre, MARGIN_LEFT, y + 8);
  doc.text(`D./Dña. ${data.asesor_representante}`, MARGIN_LEFT, y + 14);
  
  doc.line(MARGIN_LEFT, y + 35, MARGIN_LEFT + 60, y + 35);
  doc.text('Firma', MARGIN_LEFT + 25, y + 42);

  // Columna derecha - Cliente
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

export function downloadMandatoVentaPdf(data: MandatoVentaData, filename?: string): void {
  const doc = generateMandatoVentaPdf(data);
  const defaultFilename = `Mandato_Venta_${data.target_nombre.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(filename || defaultFilename);
}

export function previewMandatoVentaPdf(data: MandatoVentaData): string {
  const doc = generateMandatoVentaPdf(data);
  return doc.output('bloburl') as unknown as string;
}
