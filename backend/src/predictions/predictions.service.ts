import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Cron } from '@nestjs/schedule';
import { isAxiosError } from 'axios';

@Injectable()
export class PredictionsService {
  private readonly logger = new Logger(PredictionsService.name);

  /** En local sin Docker debe ser http://127.0.0.1:5000 */
  private readonly ML_SERVICE_URL =
    process.env.ML_SERVICE_URL || 'http://127.0.0.1:5000';

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  async findByPlot(loteId: string, userId: string) {
    const lote = await this.prisma.lote.findFirst({
      where: {
        id: loteId,
        finca: {
          usuarioId: userId,
        },
      },
    });

    if (!lote) {
      throw new HttpException('Lote no encontrado', HttpStatus.NOT_FOUND);
    }

    return this.prisma.prediccionRendimiento.findMany({
      where: { loteId },
      include: {
        temporada: {
          include: {
            cultivo: true,
          },
        },
      },
      orderBy: { fechaPrediccion: 'desc' },
    });
  }

  async getCurrentPrediction(loteId: string, userId: string) {
    const lote = await this.prisma.lote.findFirst({
      where: {
        id: loteId,
        finca: {
          usuarioId: userId,
        },
      },
      include: {
        temporadas: {
          where: { estado: 'activo' },
          include: { cultivo: true },
          take: 1,
        },
      },
    });

    if (!lote) {
      throw new HttpException('Lote no encontrado', HttpStatus.NOT_FOUND);
    }

    if (lote.temporadas.length === 0) {
      return null;
    }

    const temporada = lote.temporadas[0];

    return this.prisma.prediccionRendimiento.findFirst({
      where: {
        loteId,
        temporadaId: temporada.id,
      },
      orderBy: { fechaPrediccion: 'desc' },
    });
  }

  async triggerPrediction(loteId: string, userId: string) {
    const lote = await this.prisma.lote.findFirst({
      where: {
        id: loteId,
        finca: {
          usuarioId: userId,
        },
      },
      include: {
        temporadas: {
          where: { estado: 'activo' },
          include: { cultivo: true },
          take: 1,
        },
        sensores: {
          include: {
            lecturas: {
              orderBy: { timestamp: 'desc' },
              take: 30,
            },
          },
        },
        eventosRiego: {
          where: {
            fechaHora: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
      },
    });

    if (!lote) {
      throw new HttpException('Lote no encontrado', HttpStatus.NOT_FOUND);
    }

    const temporadaActiva = lote.temporadas[0];
    if (!temporadaActiva?.cultivo) {
      throw new HttpException(
        'Se requiere una temporada activa con cultivo para predecir rendimiento.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const features = this.prepareFeatures(lote, temporadaActiva);

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.ML_SERVICE_URL}/predict/yield`, features),
      );

      const prediction = response.data as {
        yield: number;
        confidence_interval: [number, number];
        factors?: Record<string, number>;
        model?: string;
        accuracy?: number;
      };

      const yieldKgHa = Number(prediction.yield);
      const ci0 = Number(prediction.confidence_interval?.[0] ?? yieldKgHa);
      const ci1 = Number(prediction.confidence_interval?.[1] ?? yieldKgHa);

      const nuevaPrediccion = await this.prisma.prediccionRendimiento.create({
        data: {
          loteId,
          temporadaId: temporadaActiva.id,
          fechaPrediccion: new Date(),
          rendimientoEstimadoKgHa: yieldKgHa,
          intervaloConfianzaInf: ci0,
          intervaloConfianzaSup: ci1,
          factoresInfluencia:
            (prediction.factors ?? {}) as Prisma.InputJsonValue,
          modeloUtilizado: prediction.model ?? 'ensemble',
          precisionModelo: Number(prediction.accuracy ?? 0.87),
        },
      });

      if (yieldKgHa < 5000) {
        await this.prisma.alerta.create({
          data: {
            usuarioId: userId,
            loteId,
            tipo: 'rendimiento',
            severidad: 'advertencia',
            mensaje: `Rendimiento estimado bajo (${yieldKgHa} kg/ha) para el lote ${lote.nombre}`,
            datosContexto:
              (prediction.factors ?? {}) as Prisma.InputJsonValue,
          },
        });
      }

      return nuevaPrediccion;
    } catch (error: unknown) {
      let detail: string;
      if (isAxiosError(error)) {
        const data = error.response?.data as { error?: string } | undefined;
        const remote = data?.error;
        const fromNetwork = [
          error.code,
          error.cause instanceof Error ? error.cause.message : undefined,
          error.message,
        ]
          .filter((p): p is string => !!p?.trim?.())
          .join(' — ');
        detail =
          (remote?.trim().length ? remote : undefined) ??
          (fromNetwork || String(error));
      } else {
        const ax = error as { message?: string };
        detail = ax.message ?? String(error);
      }
      this.logger.warn(`ML /predict/yield failed: ${detail}`);
      throw new HttpException(
        `No se pudo contactar el servicio de ML (${this.ML_SERVICE_URL}). ` +
          `Arranca la carpeta ml-service (véase ml-service/run-local.bat). Detalle: ${detail}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  private encodeSoilType(tipo?: string | null): number {
    if (!tipo) return 2;
    const t = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const m: Record<string, number> = {
      arcilloso: 0,
      arenoso: 1,
      limoso: 2,
      franco: 3,
      organico: 4,
    };
    return m[t.trim()] ?? 2;
  }

  private encodeCropName(name: string): number {
    let h = 0;
    for (let i = 0; i < name.length; i++) {
      h = (h * 31 + name.charCodeAt(i)) >>> 0;
    }
    return h % 50;
  }

  private prepareFeatures(lote: {
    tipoSuelo?: string | null;
    areaHectareas?: unknown;
    sensores?: {
      lecturas?: {
        temperatura?: unknown;
        humedadSuelo?: unknown;
        precipitacion?: unknown;
        timestamp?: Date;
      }[];
    }[];
    eventosRiego?: { volumenM3?: unknown }[];
  }, temporada: { cultivo?: { nombre: string } | null; fechaSiembra: Date }) {
    const cultivoNombre = temporada.cultivo?.nombre ?? '';

    const sensorData = (lote.sensores ?? []).flatMap((s) =>
      (s.lecturas ?? []).map((lectura) => ({
        temperature: lectura.temperatura != null ? Number(lectura.temperatura) : null,
        humidity: lectura.humedadSuelo != null ? Number(lectura.humedadSuelo) : null,
        precipitation:
          lectura.precipitacion != null ? Number(lectura.precipitacion) : null,
        timestamp: lectura.timestamp,
      })),
    );

    const n = Math.max(sensorData.length, 1);
    let avgTemp =
      sensorData.reduce((acc, d) => acc + (d.temperature ?? 0), 0) / n;
    let avgHumidity =
      sensorData.reduce((acc, d) => acc + (d.humidity ?? 0), 0) / n;

    if (!Number.isFinite(avgTemp) || sensorData.length === 0) {
      avgTemp = 22;
    }
    if (!Number.isFinite(avgHumidity) || sensorData.length === 0) {
      avgHumidity = 58;
    }

    const totalIrrigation = (lote.eventosRiego ?? []).reduce(
      (acc, e) => acc + Number(e.volumenM3 ?? 0),
      0,
    );

    const area = Number(lote.areaHectareas ?? 0);
    const daysAfterPlanting = Math.max(
      0,
      Math.floor(
        (Date.now() - temporada.fechaSiembra.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    return {
      crop_type_encoded: this.encodeCropName(cultivoNombre),
      soil_type_encoded: this.encodeSoilType(lote.tipoSuelo ?? undefined),
      area: area > 0 ? area : 1,
      avg_temperature: avgTemp,
      avg_humidity: avgHumidity,
      total_irrigation: totalIrrigation,
      days_after_planting: daysAfterPlanting,
      crop_type: cultivoNombre,
      soil_type: lote.tipoSuelo,
    };
  }

  /** Desactivado por defecto en local (set ENABLE_PREDICTION_CRON=true para activarlo). */
  @Cron('0 2 * * *')
  async scheduledPredictions() {
    if (process.env.ENABLE_PREDICTION_CRON !== 'true') {
      return;
    }

    const lotesActivos = await this.prisma.lote.findMany({
      where: {
        temporadas: {
          some: {
            estado: 'activo',
          },
        },
      },
      include: {
        finca: {
          include: {
            usuario: true,
          },
        },
      },
    });

    for (const lote of lotesActivos) {
      try {
        await this.triggerPrediction(lote.id, lote.finca.usuarioId);
      } catch (e) {
        this.logger.warn(
          `Cron predicción omitida para lote ${lote.id}: ${(e as Error).message}`,
        );
      }
    }
  }

  async getYieldHistory(userId: string, fincaId?: string, periodo: string = 'mes') {
    const predictions = await this.prisma.prediccionRendimiento.findMany({
      where: {
        lote: {
          finca: { usuarioId: userId },
          ...(fincaId ? { fincaId } : {}),
        },
      },
      include: {
        lote: true,
        temporada: {
          include: {
            cultivo: true,
          },
        },
      },
      orderBy: { fechaPrediccion: 'asc' },
    });

    const grouped = this.groupByPeriod(predictions, periodo);

    return grouped;
  }

  private groupByPeriod(data: unknown[], periodo: string) {
    const groups = new Map<
      string,
      { tipo?: string; valores: Array<number | null> }
    >();

    for (const item of data) {
      const rec = item as {
        fechaPrediccion?: Date | string;
        rendimientoEstimadoKgHa?: number | null;
      };
      const date = new Date(rec.fechaPrediccion ?? 0);

      let key: string;

      switch (periodo) {
        case 'semana': {
          const weekNumber = this.getWeekNumber(date);
          key = `${date.getFullYear()}-W${weekNumber}`;
          break;
        }
        case 'ano':
          key = date.getFullYear().toString();
          break;
        default:
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      }

      const arr = groups.get(key)?.valores ?? [];
      arr.push(rec.rendimientoEstimadoKgHa ?? null);
      groups.set(key, { valores: arr });
    }

    return Array.from(groups.entries()).map(([period, g]) => {
      const yields = g.valores.filter((v): v is number => v != null && !Number.isNaN(v));
      if (yields.length === 0) {
        return {
          period,
          averageYield: 0,
          maxYield: 0,
          minYield: 0,
        };
      }
      return {
        period,
        averageYield: yields.reduce((a, b) => a + b, 0) / yields.length,
        maxYield: Math.max(...yields),
        minYield: Math.min(...yields),
      };
    });
  }

  async getLatestPredictions(userId: string) {
    return this.prisma.prediccionRendimiento.findMany({
      where: {
        lote: { finca: { usuarioId: userId } },
      },
      orderBy: { fechaPrediccion: 'desc' },
      take: 10,
      include: { lote: true, temporada: { include: { cultivo: true } } },
    });
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
}
