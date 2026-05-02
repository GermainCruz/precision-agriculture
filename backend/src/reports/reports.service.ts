import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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

  /** Expone sólo URLs que el cliente pueda resolver; el resto pasa como null → se usa JSON. */
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

    return {
      lote: { nombre: lote.nombre, area: lote.areaHectareas },
      periodo: { inicio: params.startDate, fin: params.endDate },
      cultivo: lote.temporadas[0]?.cultivo?.nombre ?? 'Sin cultivo',
      riego: {
        eventos: lote.eventosRiego.length,
        volumenTotalM3: totalRiego,
        duracionTotalMinutos: duracionTotalRiego,
      },
      lecturasSensores: lote.sensores.flatMap((s) => s.lecturas).length,
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

    return {
      finca: { nombre: finca.nombre, ubicacion: finca.ubicacion },
      lotes: lotesSummary,
      totalLotes: finca.lotes.length,
      temporadaFiltrada: params.temporadaId ?? null,
    };
  }

  async generateOperationalReport(
    params: { loteId: string; startDate: Date; endDate: Date },
    userId: string,
  ) {
    const contenido = await this.computeOperationalContenido(params, userId);

    const reporte = await this.prisma.reporte.create({
      data: {
        usuarioId: userId,
        tipo: 'operacional',
        formato: 'json',
        parametrosFiltros: {
          loteId: params.loteId,
          startDate: params.startDate,
          endDate: params.endDate,
        },
        urlArchivo: null,
      },
    });

    return { ...reporte, contenido };
  }

  async generateManagementReport(
    params: { fincaId: string; temporadaId?: string },
    userId: string,
  ) {
    const contenido = await this.computeManagementContenido(params, userId);

    const reporte = await this.prisma.reporte.create({
      data: {
        usuarioId: userId,
        tipo: 'gestion',
        formato: 'json',
        parametrosFiltros: params as Prisma.InputJsonValue,
        urlArchivo: null,
      },
    });

    return {
      ...reporte,
      contenido,
    };
  }

  /**
   * Payload JSON útil cuando no hay archivo almacenado o la URL era ficticia (p. ej. storage.local).
   */
  async exportReportJson(reportId: string, userId: string) {
    const reporte = await this.prisma.reporte.findFirst({
      where: { id: reportId, usuarioId: userId },
    });

    if (!reporte) throw new NotFoundException('Reporte no encontrado');

    const params =
      reporte.parametrosFiltros && typeof reporte.parametrosFiltros === 'object'
        ? (reporte.parametrosFiltros as Record<string, unknown>)
        : {};

    let contenido: Record<string, unknown>;

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
        contenido = {
          reporteId: reporte.id,
          tipo: reporte.tipo,
          formato: reporte.formato,
          generadoEn: reporte.generadoEn,
          datos: c,
        };
      } else if (reporte.tipo === 'gestion' && typeof params.fincaId === 'string') {
        const c = await this.computeManagementContenido(
          {
            fincaId: params.fincaId,
            temporadaId:
              typeof params.temporadaId === 'string' ? params.temporadaId : undefined,
          },
          userId,
        );
        contenido = {
          reporteId: reporte.id,
          tipo: reporte.tipo,
          formato: reporte.formato,
          generadoEn: reporte.generadoEn,
          datos: c,
        };
      } else {
        contenido = {
          reporteId: reporte.id,
          tipo: reporte.tipo,
          formato: reporte.formato,
          generadoEn: reporte.generadoEn,
          parametrosFiltros: params,
          nota:
            'Reporte sin parámetros técnicos completos para regenerar contenido (p. ej. datos de demostración).',
        };
      }
    } catch {
      contenido = {
        reporteId: reporte.id,
        tipo: reporte.tipo,
        formato: reporte.formato,
        generadoEn: reporte.generadoEn,
        parametrosFiltros: params,
        nota:
          'No se pudo recomponer datos del lote o finca para este historial (IDs inexistentes o datos de muestra).',
      };
    }

    await this.prisma.reporte.update({
      where: { id: reportId },
      data: { descargadoEn: new Date() },
    });

    const safeTipo = String(reporte.tipo).replace(/[^a-z0-9_-]/gi, '_');
    return {
      filename: `${safeTipo}-${reporte.id.slice(0, 8)}.json`,
      contenido,
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
