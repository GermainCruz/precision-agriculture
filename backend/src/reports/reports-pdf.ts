import PDFDocument from 'pdfkit';

type PdfDoc = InstanceType<typeof PDFDocument>;

const COL_HEADER = '#1a472a';
const COL_TEXT = '#2c2c2c';
const COL_MUTED = '#5c5c5c';
const COL_RULE = '#d8e2d9';
const COL_BAND = '#f4f8f4';

export type OperationalContenido = {
  finca: { nombre: string; ubicacion: string };
  lote: { nombre: string; area: unknown };
  tipoSuelo: string;
  sensoresInstalados: number;
  periodo: { inicio: Date | string; fin: Date | string };
  cultivo: string;
  riego: {
    eventos: number;
    volumenTotalM3: number;
    duracionTotalMinutos: number;
  };
  lecturasSensores: number;
};

export type ManagementLoteRow = {
  nombre: string;
  area: unknown;
  cultivo: string;
  rendimientoEstimado: unknown;
  fechaUltimaPrediccion: Date | string | null;
  eventosRiego: number;
  volumenRiegoM3: number;
  eficienciaPromedio: number;
};

export type ManagementContenido = {
  finca: {
    nombre: string;
    ubicacion: string;
    areaTotalDeclarada: unknown;
  };
  lotes: ManagementLoteRow[];
  totalLotes: number;
  temporadaFiltrada: string | null;
  totales: {
    areaHa: number;
    eventosRiego: number;
    volumenM3: number;
  };
};

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function fmtDateEs(value: Date | string): string {
  try {
    return asDate(value).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return String(value);
  }
}

function fmtDateTimeEs(value: Date | string): string {
  try {
    return asDate(value).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(value);
  }
}

function fmtNum(n: unknown, decimals?: number): string {
  const x = Number(n);
  if (Number.isNaN(x)) return '—';
  if (decimals != null) return x.toFixed(decimals);
  return String(x);
}

/** Eficiencia almacenada 0–1 en BD se muestra como porcentaje. */
function fmtEficiencia(e: unknown): string {
  const x = Number(e);
  if (Number.isNaN(x)) return '—';
  if (x >= 0 && x <= 1) return `${(x * 100).toFixed(1)} %`;
  return `${x.toFixed(2)} %`;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function pdfToBuffer(factory: (doc: PdfDoc) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 52,
      info: {
        Author: 'AgriPrecision',
        Subject: 'Reporte del sistema de agricultura de precisión',
      },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    try {
      factory(doc);
    } catch (e) {
      reject(e);
      return;
    }
    doc.end();
  });
}

const HEADER_H = 52;

function drawBrandingHeader(doc: PdfDoc, subtitulo: string, generadoEn: Date) {
  const w = doc.page.width;
  doc.save();
  doc.rect(0, 0, w, HEADER_H).fill(COL_HEADER);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(15).text('AgriPrecision', 52, 14);
  doc.font('Helvetica').fontSize(10).opacity(0.92).text(subtitulo, 52, 32, { width: w - 104 });
  doc.fontSize(8).opacity(0.85).text(
    `Generado: ${fmtDateTimeEs(generadoEn)}`,
    52,
    14,
    { width: w - 104, align: 'right' },
  );
  doc.restore();
  doc.y = HEADER_H + 18;
}

function sectionTitle(doc: PdfDoc, label: string) {
  doc.moveDown(0.35);
  doc.fillColor(COL_HEADER).font('Helvetica-Bold').fontSize(11).text(label.toUpperCase());
  doc.moveDown(0.15);
  doc.strokeColor(COL_RULE).lineWidth(0.8);
  doc.moveTo(52, doc.y).lineTo(doc.page.width - 52, doc.y).stroke();
  doc.moveDown(0.55);
  doc.fillColor(COL_TEXT).font('Helvetica').fontSize(10);
}

function keyValueLine(doc: PdfDoc, k: string, v: string) {
  doc.fillColor(COL_MUTED).font('Helvetica-Bold').fontSize(9.5).text(k, { continued: true });
  doc.fillColor(COL_TEXT).font('Helvetica').text(`  ${v}`);
}

function kpiRow(
  doc: PdfDoc,
  items: { label: string; value: string }[],
) {
  const margin = 52;
  const gap = 10;
  const n = items.length;
  const usable = doc.page.width - margin * 2 - gap * (n - 1);
  const cellW = usable / n;
  const y0 = doc.y;
  const h = 44;
  items.forEach((it, i) => {
    const x = margin + i * (cellW + gap);
    doc.save();
    doc.roundedRect(x, y0, cellW, h, 4).fillAndStroke(COL_BAND, COL_RULE);
    doc.fillColor(COL_MUTED).font('Helvetica').fontSize(8).text(it.label, x + 8, y0 + 8, {
      width: cellW - 16,
    });
    doc.fillColor(COL_HEADER).font('Helvetica-Bold').fontSize(11).text(it.value, x + 8, y0 + 22, {
      width: cellW - 16,
    });
    doc.restore();
  });
  doc.y = y0 + h + 14;
}

export function operationalReportPdf(
  contenido: OperationalContenido,
  generadoEn: Date,
): Promise<Buffer> {
  return pdfToBuffer((doc) => {
    drawBrandingHeader(doc, 'Reporte operacional — actividad del lote en un período', generadoEn);

    sectionTitle(doc, 'Contexto de finca y lote');
    keyValueLine(doc, 'Finca:', contenido.finca.nombre);
    keyValueLine(
      doc,
      'Ubicación finca:',
      contenido.finca.ubicacion?.trim() || '—',
    );
    keyValueLine(doc, 'Lote:', contenido.lote.nombre);
    keyValueLine(doc, 'Área del lote (ha):', fmtNum(contenido.lote.area, 3));
    keyValueLine(doc, 'Tipo de suelo:', contenido.tipoSuelo);
    keyValueLine(doc, 'Cultivo (temporada activa):', contenido.cultivo);

    sectionTitle(doc, 'Período analizado');
    keyValueLine(
      doc,
      'Desde:',
      fmtDateEs(contenido.periodo.inicio),
    );
    keyValueLine(
      doc,
      'Hasta:',
      fmtDateEs(contenido.periodo.fin),
    );
    doc.font('Helvetica').fontSize(8.5).fillColor(COL_MUTED);
    doc.text(
      'Los datos de riego y sensores se filtran estrictamente por las fechas anteriores (eventos y lecturas incluidas en el rango).',
      { width: doc.page.width - 104, align: 'justify' },
    );

    kpiRow(doc, [
      { label: 'Sensores instalados en el lote', value: String(contenido.sensoresInstalados) },
      {
        label: 'Lecturas en el período',
        value: String(contenido.lecturasSensores),
      },
    ]);

    sectionTitle(doc, 'Riego en el período');
    kpiRow(doc, [
      { label: 'Eventos', value: String(contenido.riego.eventos) },
      { label: 'Volumen total (m³)', value: fmtNum(contenido.riego.volumenTotalM3, 2) },
      {
        label: 'Duración total (min)',
        value: fmtNum(contenido.riego.duracionTotalMinutos, 0),
      },
    ]);

    doc.moveDown(1.2);
    doc.fillColor(COL_MUTED).fontSize(8).text(
      'Documento generado automáticamente a partir de los registros de la base de datos. ' +
        'Los valores reflejan el estado al momento de la exportación.',
      52,
      doc.y,
      { width: doc.page.width - 104, align: 'left' },
    );
  });
}

export function noticePdf(title: string, lines: string[], generadoEn: Date): Promise<Buffer> {
  return pdfToBuffer((doc) => {
    drawBrandingHeader(doc, 'Aviso del sistema de reportes', generadoEn);
    doc.fillColor(COL_HEADER).font('Helvetica-Bold').fontSize(13).text(title);
    doc.moveDown(0.9);
    doc.fillColor(COL_TEXT).font('Helvetica').fontSize(10);
    for (const line of lines) {
      doc.text(line, { paragraphGap: 8, align: 'justify', width: doc.page.width - 104 });
    }
  });
}

export function managementReportPdf(
  contenido: ManagementContenido,
  generadoEn: Date,
): Promise<Buffer> {
  return pdfToBuffer((doc) => {
    drawBrandingHeader(
      doc,
      'Reporte de gestión — consolidado de lotes de la finca',
      generadoEn,
    );

    sectionTitle(doc, 'Datos de la finca');
    keyValueLine(doc, 'Nombre:', contenido.finca.nombre);
    keyValueLine(doc, 'Ubicación:', contenido.finca.ubicacion?.trim() || '—');
    keyValueLine(
      doc,
      'Área declarada de finca (ha):',
      fmtNum(contenido.finca.areaTotalDeclarada, 2),
    );
    keyValueLine(doc, 'Lotes en esta finca:', String(contenido.totalLotes));
    if (contenido.temporadaFiltrada) {
      keyValueLine(doc, 'Filtro temporada (ID):', contenido.temporadaFiltrada);
    }

    kpiRow(doc, [
      {
        label: 'Suma áreas lotes (ha)',
        value: fmtNum(contenido.totales.areaHa, 2),
      },
      {
        label: 'Eventos riego (todos los lotes)',
        value: String(contenido.totales.eventosRiego),
      },
      {
        label: 'Volumen riego acum. (m³)',
        value: fmtNum(contenido.totales.volumenM3, 2),
      },
    ]);

    sectionTitle(doc, 'Detalle por lote');
    doc.fontSize(8).fillColor(COL_MUTED);
    doc.text(
      'Rendimiento: última predicción registrada para el lote. Eficiencia: promedio de eventos de riego (0–1 en base de datos, mostrado como %).',
      { width: doc.page.width - 104, align: 'justify' },
    );
    doc.moveDown(0.6);

    const margin = 52;
    const x = {
      lote: margin,
      area: margin + 118,
      cult: margin + 164,
      rend: margin + 242,
      ev: margin + 304,
      vol: margin + 346,
      ef: margin + 408,
    };
    const rowH = 20;
    const tableW = doc.page.width - margin * 2;

    const drawTableHeader = () => {
      const yh = doc.y;
      doc.save();
      doc.rect(margin, yh, tableW, rowH).fill(COL_HEADER);
      doc.fillColor('#fff').font('Helvetica-Bold').fontSize(7);
      const ty = yh + 6;
      doc.text('Lote', x.lote + 4, ty, { width: 108 });
      doc.text('Área (ha)', x.area, ty, { width: 40 });
      doc.text('Cultivo activo', x.cult, ty, { width: 72 });
      doc.text('Rend. kg/ha', x.rend, ty, { width: 56 });
      doc.text('Riegos', x.ev, ty, { width: 36 });
      doc.text('Vol. m³', x.vol, ty, { width: 56 });
      doc.text('Efic.', x.ef, ty, { width: 48 });
      doc.restore();
      doc.y = yh + rowH;
    };

    drawTableHeader();

    let rowIndex = 0;
    for (const l of contenido.lotes) {
      if (doc.y > doc.page.height - 100) {
        doc.addPage();
        drawBrandingHeader(doc, 'Reporte de gestión (continuación)', generadoEn);
        sectionTitle(doc, 'Detalle por lote (continúa)');
        drawTableHeader();
      }
      const yRow = doc.y;
      const fill = rowIndex % 2 === 0 ? '#ffffff' : COL_BAND;
      doc.save();
      doc.rect(margin, yRow, tableW, rowH).fill(fill);
      doc.fillColor(COL_TEXT).font('Helvetica').fontSize(7);
      doc.text(truncate(l.nombre, 30), x.lote + 4, yRow + 6, { width: 108 });
      doc.text(fmtNum(l.area, 2), x.area, yRow + 6, { width: 40 });
      doc.text(truncate(l.cultivo, 22), x.cult, yRow + 6, { width: 72 });
      doc.text(
        l.rendimientoEstimado != null ? fmtNum(l.rendimientoEstimado, 1) : '—',
        x.rend,
        yRow + 6,
        { width: 56 },
      );
      doc.text(String(l.eventosRiego), x.ev, yRow + 6, { width: 36 });
      doc.text(fmtNum(l.volumenRiegoM3, 1), x.vol, yRow + 6, { width: 56 });
      doc.text(fmtEficiencia(l.eficienciaPromedio), x.ef, yRow + 6, { width: 48 });
      doc.restore();
      doc.y = yRow + rowH;
      rowIndex++;

      if (l.fechaUltimaPrediccion) {
        doc.font('Helvetica-Oblique').fontSize(6.5).fillColor(COL_MUTED);
        doc.text(`Última predicción registrada: ${fmtDateEs(l.fechaUltimaPrediccion)}`, margin + 6, doc.y + 2, {
          width: tableW - 12,
        });
        doc.font('Helvetica');
        doc.moveDown(0.45);
      } else {
        doc.moveDown(0.15);
      }
    }

    if (contenido.lotes.length === 0) {
      doc.fillColor(COL_MUTED).fontSize(10).text('No hay lotes registrados para esta finca.');
    }

    doc.moveDown(1);
    doc.fillColor(COL_MUTED).fontSize(8).text(
      'Totales de la tabla: área = suma de hectáreas de lotes; riegos y volumen = suma de todos los eventos históricos del lote en base de datos ' +
        '(no limitados a una temporada salvo que el filtro esté aplicado en la consulta de origen).',
      margin,
      doc.y,
      { width: doc.page.width - margin * 2, align: 'justify' },
    );
  });
}
