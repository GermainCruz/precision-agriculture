import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { managementReportPdf, noticePdf, operationalReportPdf } from './reports-pdf';

/** Hosts ficticios del seed o entornos de demo que no deben abrirse en el navegador. */
function isUnreachableFileUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host === 'storage.local') return true;
    if (host.endsWith('.local') && host !== 'localhost') return true;
    return false;
  } catch {
    return true;
  }
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /** Expone sólo URLs que el cliente pueda resolver; el resto pasa como null → descarga PDF vía exportPdf. */
  private sanitizeStoredFileUrl(url: string | null): string | null {
    if (!url?.trim()) return null;
    if (isUnreachableFileUrl(url.trim())) return null;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
      return url.trim();
    } catch {
      return null;
    }
  }

  async findAll(userId: string, tipo?: 'operacional' | 'gestion') {
    const rows = await this.prisma.reporte.findMany({
      where: {
        usuarioId: userId,
        ...(tipo && { tipo }),
      },
      orderBy: { generadoEn: 'desc' },
    });

    return rows.map((r) => ({
      ...r,
      urlArchivo: this.sanitizeStoredFileUrl(r.urlArchivo),
    }));
  }

  private async computeOperationalContenido(
    params: { loteId: string; startDate: Date; endDate: Date },
    userId: string,
  ) {
    const lote = await this.prisma.lote.findFirst({
      where: { id: params.loteId, finca: { usuarioId: userId } },
      include: {
        finca: { select: { nombre: true, ubicacion: true } },
        eventosRiego: {
          where: {
            fechaHora: { gte: params.startDate, lte: params.endDate },
          },
        },
        sensores: {
          include: {
            lecturas: {
              where: {
                timestamp: { gte: params.startDate, lte: params.endDate },
              },
            },
          },
        },
        temporadas: {
          where: { estado: 'activo' },
          include: { cultivo: true },
          take: 1,
        },
      },
    });

    if (!lote) throw new NotFoundException('Lote no encontrado');

    const totalRiego = lote.eventosRiego.reduce(
      (sum, e) => sum + Number(e.volumenM3 || 0),
      0,
    );
    const duracionTotalRiego = lote.eventosRiego.reduce(
      (sum, e) => sum + e.duracionMinutos,
      0,
    );

    const lecturasSensores = lote.sensores.flatMap((s) => s.lecturas).length;

    return {
      finca: {
        nombre: lote.finca.nombre,
        ubicacion: lote.finca.ubicacion ?? '',
      },
      lote: { nombre: lote.nombre, area: lote.areaHectareas },
      tipoSuelo: lote.tipoSuelo ?? '—',
      sensoresInstalados: lote.sensores.length,
      periodo: { inicio: params.startDate, fin: params.endDate },
      cultivo: lote.temporadas[0]?.cultivo?.nombre ?? 'Sin cultivo',
      riego: {
        eventos: lote.eventosRiego.length,
        volumenTotalM3: totalRiego,
        duracionTotalMinutos: duracionTotalRiego,
      },
      lecturasSensores,
    };
  }

  private async computeManagementContenido(
    params: { fincaId: string; temporadaId?: string },
    userId: string,
  ) {
    const finca = await this.prisma.finca.findFirst({
      where: { id: params.fincaId, usuarioId: userId },
      include: {
        lotes: {
          include: {
            predicciones: {
              orderBy: { fechaPrediccion: 'desc' },
              take: 1,
            },
            eventosRiego: true,
            temporadas: {
              where: { estado: 'activo' },
              include: { cultivo: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!finca) throw new NotFoundException('Finca no encontrada');

    const lotesSummary = finca.lotes.map((lote) => ({
      nombre: lote.nombre,
      area: lote.areaHectareas,
      cultivo: lote.temporadas[0]?.cultivo?.nombre ?? 'Sin cultivo',
      rendimientoEstimado: lote.predicciones[0]?.rendimientoEstimadoKgHa ?? null,
      fechaUltimaPrediccion: lote.predicciones[0]?.fechaPrediccion ?? null,
      eventosRiego: lote.eventosRiego.length,
      volumenRiegoM3: lote.eventosRiego.reduce(
        (sum, e) => sum + Number(e.volumenM3 || 0),
        0,
      ),
      eficienciaPromedio:
        lote.eventosRiego.length > 0
          ? lote.eventosRiego.reduce((sum, e) => sum + Number(e.eficiencia || 0), 0) /
            lote.eventosRiego.length
          : 0,
    }));

    const totales = {
      areaHa: lotesSummary.reduce((s, l) => s + Number(l.area ?? 0), 0),
      eventosRiego: lotesSummary.reduce((s, l) => s + l.eventosRiego, 0),
      volumenM3: lotesSummary.reduce((s, l) => s + l.volumenRiegoM3, 0),
    };

    return {
      finca: {
        nombre: finca.nombre,
        ubicacion: finca.ubicacion ?? '',
        areaTotalDeclarada: finca.areaHectareas,
      },
      lotes: lotesSummary,
      totalLotes: finca.lotes.length,
      temporadaFiltrada: params.temporadaId ?? null,
      totales,
    };
  }

  async generateOperationalReport(
    params: { loteId: string; startDate: Date; endDate: Date },
    userId: string,
  ) {
    await this.computeOperationalContenido(params, userId);

    const reporte = await this.prisma.reporte.create({
      data: {
        usuarioId: userId,
        tipo: 'operacional',
        formato: 'pdf',
        parametrosFiltros: {
          loteId: params.loteId,
          startDate: params.startDate,
          endDate: params.endDate,
        },
        urlArchivo: null,
      },
    });

    return reporte;
  }

  async generateManagementReport(
    params: { fincaId: string; temporadaId?: string },
    userId: string,
  ) {
    await this.computeManagementContenido(params, userId);

    const reporte = await this.prisma.reporte.create({
      data: {
        usuarioId: userId,
        tipo: 'gestion',
        formato: 'pdf',
        parametrosFiltros: params as Prisma.InputJsonValue,
        urlArchivo: null,
      },
    });

    return reporte;
  }

  /**
   * Genera PDF a partir del historial del reporte y parámetros guardados (no se confía en URL ficticia).
   */
  async exportReportPdf(reportId: string, userId: string) {
    const reporte = await this.prisma.reporte.findFirst({
      where: { id: reportId, usuarioId: userId },
    });

    if (!reporte) throw new NotFoundException('Reporte no encontrado');

    const params =
      reporte.parametrosFiltros && typeof reporte.parametrosFiltros === 'object'
        ? (reporte.parametrosFiltros as Record<string, unknown>)
        : {};

    let buffer: Buffer;

    try {
      if (
        reporte.tipo === 'operacional' &&
        typeof params.loteId === 'string' &&
        params.startDate != null &&
        params.endDate != null
      ) {
        const c = await this.computeOperationalContenido(
          {
            loteId: params.loteId,
            startDate: new Date(params.startDate as string),
            endDate: new Date(params.endDate as string),
          },
          userId,
        );
        buffer = await operationalReportPdf(c, reporte.generadoEn);
      } else if (reporte.tipo === 'gestion' && typeof params.fincaId === 'string') {
        const c = await this.computeManagementContenido(
          {
            fincaId: params.fincaId,
            temporadaId:
              typeof params.temporadaId === 'string' ? params.temporadaId : undefined,
          },
          userId,
        );
        buffer = await managementReportPdf(c, reporte.generadoEn);
      } else {
        buffer = await noticePdf(
          'Reporte no disponible como PDF completo',
          [
            `Tipo: ${reporte.tipo}.`,
            'Este ítem carece de parámetros técnicos (lote/fechas o finca) para recomponer el contenido.',
            'Puede tratarse de datos de demostración o un formato antiguo.',
          ],
          reporte.generadoEn,
        );
      }
    } catch {
      buffer = await noticePdf(
        'Error al generar el reporte PDF',
        [
          'No se pudieron cargar datos actuales del lote o finca.',
          'Comprueba que existan registros asociados a tu cuenta o genera el reporte de nuevo.',
        ],
        reporte.generadoEn,
      );
    }

    await this.prisma.reporte.update({
      where: { id: reportId },
      data: { descargadoEn: new Date(), tamanioBytes: buffer.length },
    });

    const safeTipo = String(reporte.tipo).replace(/[^a-z0-9_-]/gi, '_');
    return {
      filename: `${safeTipo}-${reporte.id.slice(0, 8)}.pdf`,
      pdfBase64: buffer.toString('base64'),
    };
  }

  async getDownloadUrl(reportId: string, userId: string) {
    const reporte = await this.prisma.reporte.findFirst({
      where: { id: reportId, usuarioId: userId },
    });

    if (!reporte) throw new NotFoundException('Reporte no encontrado');

    await this.prisma.reporte.update({
      where: { id: reportId },
      data: { descargadoEn: new Date() },
    });

    const url = this.sanitizeStoredFileUrl(reporte.urlArchivo);
    return { url, reporte: { ...reporte, urlArchivo: url } };
  }

  async deleteReport(reportId: string, userId: string) {
    const reporte = await this.prisma.reporte.findFirst({
      where: { id: reportId, usuarioId: userId },
    });
    if (!reporte) throw new NotFoundException('Reporte no encontrado');
    return this.prisma.reporte.delete({ where: { id: reportId } });
  }
}
