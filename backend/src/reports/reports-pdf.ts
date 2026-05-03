import PDFDocument from 'pdfkit';

type PdfDoc = InstanceType<typeof PDFDocument>;

type OperationalContenido = {
  lote: { nombre: string; area: unknown };
  periodo: { inicio: Date | string; fin: Date | string };
  cultivo: string;
  riego: {
    eventos: number;
    volumenTotalM3: number;
    duracionTotalMinutos: number;
  };
  lecturasSensores: number;
};

type ManagementLoteRow = {
  nombre: string;
  area: unknown;
  cultivo: string;
  rendimientoEstimado: unknown;
  eventosRiego: number;
  volumenRiegoM3: number;
  eficienciaPromedio: number;
};

type ManagementContenido = {
  finca: { nombre: string; ubicacion: string };
  lotes: ManagementLoteRow[];
  totalLotes: number;
  temporadaFiltrada: string | null;
};

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function fmtDateEs(value: Date | string): string {
  try {
    return asDate(value).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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

function pdfToBuffer(factory: (doc: PdfDoc) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
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

export function operationalReportPdf(contenido: OperationalContenido, generadoEn: Date): Promise<Buffer> {
  return pdfToBuffer((doc) => {
    doc.fontSize(18).fillColor('#111').text('Reporte operacional', { align: 'center' });
    doc.moveDown(0.35);
    doc.fontSize(9).fillColor('#666').text(`Generado: ${fmtDateEs(generadoEn)}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(12).fillColor('#111').font('Helvetica-Bold').text('Lote y período');
    doc.moveDown(0.4);
    doc.fontSize(11).fillColor('#333').font('Helvetica');
    doc.text(`Nombre del lote: ${contenido.lote.nombre}`);
    doc.text(`Área (ha): ${fmtNum(contenido.lote.area, 3)}`);
    doc.text(
      `Periodo analizado: ${fmtDateEs(contenido.periodo.inicio)} — ${fmtDateEs(contenido.periodo.fin)}`,
    );
    doc.text(`Cultivo: ${contenido.cultivo}`);
    doc.moveDown(1.2);

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#111').text('Riego en el período');
    doc.moveDown(0.4);
    doc.fontSize(11).font('Helvetica').fillColor('#333');
    doc.text(`Eventos de riego: ${contenido.riego.eventos}`);
    doc.text(`Volumen total (m³): ${fmtNum(contenido.riego.volumenTotalM3, 2)}`);
    doc.text(`Duración total (min): ${fmtNum(contenido.riego.duracionTotalMinutos, 0)}`);
    doc.moveDown(1.2);

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#111').text('Sensores');
    doc.moveDown(0.4);
    doc.fontSize(11).font('Helvetica').fillColor('#333');
    doc.text(`Lecturas registradas en el período: ${contenido.lecturasSensores}`);
  });
}

export function noticePdf(title: string, lines: string[], generadoEn: Date): Promise<Buffer> {
  return pdfToBuffer((doc) => {
    doc.fontSize(16).fillColor('#111').text(title, { align: 'center' });
    doc.moveDown(0.35);
    doc.fontSize(9).fillColor('#666').text(`Generado: ${fmtDateEs(generadoEn)}`, { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(10).fillColor('#444').font('Helvetica');
    for (const line of lines) {
      doc.text(line, { paragraphGap: 6 });
    }
  });
}

export function managementReportPdf(contenido: ManagementContenido, generadoEn: Date): Promise<Buffer> {
  return pdfToBuffer((doc) => {
    doc.fontSize(18).fillColor('#111').text('Reporte de gestión', { align: 'center' });
    doc.moveDown(0.35);
    doc.fontSize(9).fillColor('#666').text(`Generado: ${fmtDateEs(generadoEn)}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#111').text('Finca');
    doc.moveDown(0.4);
    doc.fontSize(11).font('Helvetica').fillColor('#333');
    doc.text(`${contenido.finca.nombre}`);
    doc.text(`Ubicación: ${contenido.finca.ubicacion || '—'}`);
    doc.text(`Número de lotes: ${contenido.totalLotes}`);
    if (contenido.temporadaFiltrada) {
      doc.text(`Temporada (filtro): ${contenido.temporadaFiltrada}`);
    }
    doc.moveDown(1.2);

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#111').text('Resumen por lote');
    doc.moveDown(0.55);

    for (let i = 0; i < contenido.lotes.length; i++) {
      const l = contenido.lotes[i];
      if (doc.y > 700) {
        doc.addPage();
      }
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#222').text(`${i + 1}. ${l.nombre}`);
      doc.fontSize(9).font('Helvetica').fillColor('#444');
      doc.text(
        [
          `Área (ha): ${fmtNum(l.area, 3)}`,
          `Cultivo: ${l.cultivo}`,
          `Rendimiento estimado (kg/ha): ${
            l.rendimientoEstimado != null ? fmtNum(l.rendimientoEstimado, 1) : '—'
          }`,
          `Eventos de riego: ${l.eventosRiego}`,
          `Volumen de riego (m³): ${fmtNum(l.volumenRiegoM3, 2)}`,
          `Eficiencia promedio: ${fmtNum(l.eficienciaPromedio, 2)}`,
        ].join('   ·   '),
        { width: 500 },
      );
      doc.moveDown(1);
    }

    if (contenido.lotes.length === 0) {
      doc.fontSize(10).fillColor('#666').text('No hay lotes registrados para esta finca.');
    }
  });
}
