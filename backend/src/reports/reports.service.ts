import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, tipo?: 'operacional' | 'gestion') {
    return this.prisma.reporte.findMany({
      where: {
        usuarioId: userId,
        ...(tipo && { tipo }),
      },
      orderBy: { generadoEn: 'desc' },
    });
  }

  async generateOperationalReport(
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

    // DECISIÓN: El contenido del reporte se serializa como JSON (formato interno)
    // Los reportes PDF requieren Puppeteer en producción; aquí se genera la data
    const contenido = {
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
        urlArchivo: null, // PENDIENTE: Integrar generación PDF con Puppeteer
      },
    });

    return { ...reporte, contenido };
  }

  async generateManagementReport(
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

    const reporte = await this.prisma.reporte.create({
      data: {
        usuarioId: userId,
        tipo: 'gestion',
        formato: 'json',
        parametrosFiltros: params as any,
        urlArchivo: null, // PENDIENTE: Integrar generación PDF con Puppeteer
      },
    });

    return {
      ...reporte,
      contenido: {
        finca: { nombre: finca.nombre, ubicacion: finca.ubicacion },
        lotes: lotesSummary,
        totalLotes: finca.lotes.length,
      },
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

    // PENDIENTE: Integrar con almacenamiento de archivos (S3 u otro)
    return { url: reporte.urlArchivo, reporte };
  }

  async deleteReport(reportId: string, userId: string) {
    const reporte = await this.prisma.reporte.findFirst({
      where: { id: reportId, usuarioId: userId },
    });
    if (!reporte) throw new NotFoundException('Reporte no encontrado');
    return this.prisma.reporte.delete({ where: { id: reportId } });
  }
}
