import jsPDF from 'jspdf';
import type { NDAData } from '@/types/document-generators';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const MARGIN_LEFT = 25;
const MARGIN_RIGHT = 25;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

export function generateNDAPdf(data: NDAData): jsPDF {
  const doc = new jsPDF();
  let y = 30;

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

  const checkNewPage = (requiredSpace: number) => {
    if (y + requiredSpace > 270) {
      doc.addPage();
      y = 25;
    }
  };

  // ========== TÍTULO ==========
  addText('ACUERDO DE CONFIDENCIALIDAD', 16, true, 'center');
  y += 10;

  // Fecha y lugar
  const fechaFormateada = format(new Date(data.fecha), "d 'de' MMMM 'de' yyyy", { locale: es });
  addText(`En ${data.lugar}, a ${fechaFormateada}`, 11, false, 'center');
  y += 15;

  // ========== REUNIDOS ==========
  addText('REUNIDOS', 12, true);
  y += 8;

  addParagraph(`De una parte, ${data.empresa_nombre.toUpperCase()}, con C.I.F. ${data.empresa_cif}, y domicilio social en ${data.empresa_domicilio}, representada por D./Dña. ${data.empresa_representante}${data.empresa_cargo_representante ? `, en calidad de ${data.empresa_cargo_representante}` : ''} (en adelante, la "PARTE REVELADORA").`);

  addParagraph(`De otra parte, ${data.contraparte_nombre.toUpperCase()}, con C.I.F. ${data.contraparte_cif}, y domicilio social en ${data.contraparte_domicilio}, representada por D./Dña. ${data.contraparte_representante}${data.contraparte_cargo_representante ? `, en calidad de ${data.contraparte_cargo_representante}` : ''} (en adelante, la "PARTE RECEPTORA").`);

  addParagraph('Ambas partes se reconocen mutuamente capacidad legal suficiente para la firma del presente Acuerdo y, a tal efecto,');

  y += 5;
  addText('EXPONEN', 12, true);
  y += 8;

  const tipoOperacionTexto = data.tipo_operacion === 'compra' 
    ? 'la posible adquisición' 
    : data.tipo_operacion === 'venta' 
      ? 'la posible venta' 
      : 'una posible inversión en';

  addParagraph(`PRIMERO.- Que las partes están interesadas en explorar ${tipoOperacionTexto} ${data.descripcion_operacion}${data.nombre_proyecto ? ` (en adelante, "Proyecto ${data.nombre_proyecto}")` : ''}.`);

  addParagraph('SEGUNDO.- Que para poder analizar y evaluar dicha posibilidad, la PARTE REVELADORA deberá facilitar a la PARTE RECEPTORA determinada información de carácter confidencial sobre su actividad, situación financiera, clientes, proveedores y demás aspectos de su negocio.');

  addParagraph('TERCERO.- Que las partes desean regular los términos y condiciones bajo los cuales la PARTE RECEPTORA recibirá y tratará dicha información confidencial.');

  addParagraph('Por todo lo anterior, las partes acuerdan suscribir el presente ACUERDO DE CONFIDENCIALIDAD, que se regirá por las siguientes');

  y += 5;
  addText('CLÁUSULAS', 12, true, 'center');
  y += 8;

  // ========== CLÁUSULAS ==========
  addSection(
    'PRIMERA.- DEFINICIÓN DE INFORMACIÓN CONFIDENCIAL',
    'A los efectos del presente Acuerdo, se considerará "Información Confidencial" toda información, datos, documentos, análisis, estudios, informes, proyecciones, know-how, secretos comerciales e industriales, estrategias, planes de negocio, información financiera, comercial, técnica, legal, fiscal, laboral y de cualquier otra naturaleza, ya sea facilitada de forma oral, escrita, electrónica o por cualquier otro medio, que la PARTE REVELADORA o sus asesores proporcionen a la PARTE RECEPTORA en relación con la operación contemplada.'
  );

  addSection(
    'SEGUNDA.- OBLIGACIONES DE CONFIDENCIALIDAD',
    `La PARTE RECEPTORA se compromete a: (i) mantener la más estricta confidencialidad sobre la Información Confidencial recibida; (ii) no revelar, publicar, ceder ni transferir la Información Confidencial a terceros sin el previo consentimiento escrito de la PARTE REVELADORA; (iii) utilizar la Información Confidencial exclusivamente para evaluar la operación contemplada; (iv) adoptar las medidas de seguridad necesarias para proteger la Información Confidencial con el mismo grado de cuidado que emplea para proteger su propia información confidencial; (v) limitar el acceso a la Información Confidencial a aquellos de sus empleados, directivos o asesores que necesiten conocerla para los fines permitidos, asegurándose de que dichas personas cumplan con las obligaciones de confidencialidad aquí establecidas.`
  );

  addSection(
    'TERCERA.- EXCEPCIONES',
    'Las obligaciones de confidencialidad no serán aplicables a la información que: (a) sea o devenga de dominio público sin mediar incumplimiento por parte de la PARTE RECEPTORA; (b) estuviera legítimamente en posesión de la PARTE RECEPTORA antes de su revelación por la PARTE REVELADORA; (c) sea recibida de un tercero sin restricciones de confidencialidad y sin incumplimiento de obligación alguna; (d) sea desarrollada independientemente por la PARTE RECEPTORA sin utilizar la Información Confidencial; (e) deba ser revelada por imperativo legal o por orden de autoridad competente, en cuyo caso la PARTE RECEPTORA notificará previamente a la PARTE REVELADORA para que pueda adoptar las medidas que estime oportunas.'
  );

  addSection(
    'CUARTA.- DURACIÓN',
    `El presente Acuerdo entrará en vigor en la fecha de su firma y permanecerá vigente durante un período de ${data.duracion_meses} meses. Las obligaciones de confidencialidad aquí establecidas sobrevivirán a la terminación del presente Acuerdo durante un período adicional de veinticuatro (24) meses.`
  );

  addSection(
    'QUINTA.- DEVOLUCIÓN DE INFORMACIÓN',
    'A requerimiento de la PARTE REVELADORA o a la terminación del presente Acuerdo, la PARTE RECEPTORA se compromete a devolver o destruir toda la Información Confidencial recibida, incluyendo cualesquiera copias, extractos o reproducciones de la misma, y a confirmar por escrito el cumplimiento de esta obligación. No obstante, la PARTE RECEPTORA podrá conservar una copia de la Información Confidencial en la medida en que esté obligada por la legislación aplicable o por sus políticas internas de cumplimiento normativo.'
  );

  if (data.penalizacion_euros) {
    addSection(
      'SEXTA.- PENALIZACIONES',
      `El incumplimiento de las obligaciones de confidencialidad establecidas en el presente Acuerdo dará derecho a la PARTE REVELADORA a reclamar una indemnización por daños y perjuicios, que las partes acuerdan fijar, con carácter de cláusula penal, en la cantidad de ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(data.penalizacion_euros)}, sin perjuicio del derecho de la PARTE REVELADORA a reclamar la indemnización de los daños y perjuicios adicionales que pudiera acreditar.`
    );
  }

  addSection(
    `${data.penalizacion_euros ? 'SÉPTIMA' : 'SEXTA'}.- AUSENCIA DE OTROS COMPROMISOS`,
    'El presente Acuerdo no implica compromiso alguno de las partes para llevar a cabo la operación contemplada ni para continuar las negociaciones. Cualquier decisión sobre la realización de dicha operación requerirá la celebración de acuerdos adicionales por escrito.'
  );

  addSection(
    `${data.penalizacion_euros ? 'OCTAVA' : 'SÉPTIMA'}.- LEY APLICABLE Y JURISDICCIÓN`,
    `El presente Acuerdo se regirá e interpretará de conformidad con la ${data.ley_aplicable}. Para la resolución de cualquier controversia derivada del presente Acuerdo, las partes se someten expresamente a la jurisdicción de los ${data.jurisdiccion}, con renuncia a cualquier otro fuero que pudiera corresponderles.`
  );

  // ========== FIRMAS ==========
  checkNewPage(60);
  y += 15;
  addParagraph('Y en prueba de conformidad con cuanto antecede, las partes firman el presente Acuerdo de Confidencialidad por duplicado y a un solo efecto, en el lugar y fecha indicados en el encabezamiento.');

  y += 20;
  
  // Columna izquierda - Parte Reveladora
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('LA PARTE REVELADORA', MARGIN_LEFT, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.empresa_nombre, MARGIN_LEFT, y + 8);
  doc.text(`D./Dña. ${data.empresa_representante}`, MARGIN_LEFT, y + 14);
  
  // Línea de firma
  doc.line(MARGIN_LEFT, y + 35, MARGIN_LEFT + 60, y + 35);
  doc.text('Firma', MARGIN_LEFT + 25, y + 42);

  // Columna derecha - Parte Receptora
  const rightCol = PAGE_WIDTH / 2 + 10;
  doc.setFont('helvetica', 'bold');
  doc.text('LA PARTE RECEPTORA', rightCol, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.contraparte_nombre, rightCol, y + 8);
  doc.text(`D./Dña. ${data.contraparte_representante}`, rightCol, y + 14);
  
  // Línea de firma
  doc.line(rightCol, y + 35, rightCol + 60, y + 35);
  doc.text('Firma', rightCol + 25, y + 42);

  return doc;
}

export function downloadNDAPdf(data: NDAData, filename?: string): void {
  const doc = generateNDAPdf(data);
  const defaultFilename = `NDA_${data.empresa_nombre.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(filename || defaultFilename);
}

export function previewNDAPdf(data: NDAData): string {
  const doc = generateNDAPdf(data);
  return doc.output('dataurlstring');
}
