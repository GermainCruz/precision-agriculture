import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class PredictionsService {
  private readonly ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://ml-service:5000';

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  async findByPlot(loteId: string, userId: string) {
    // Verificar que el lote pertenece al usuario
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

    // Preparar datos para el modelo ML
    const features = this.prepareFeatures(lote);

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.ML_SERVICE_URL}/predict/yield`, features)
      );

      const prediction = response.data;

      const nuevaPrediccion = await this.prisma.prediccionRendimiento.create({
        data: {
          loteId,
          temporadaId: lote.temporadas[0].id,
          fechaPrediccion: new Date(),
          rendimientoEstimadoKgHa: prediction.yield,
          intervaloConfianzaInf: prediction.confidence_interval[0],
          intervaloConfianzaSup: prediction.confidence_interval[1],
          factoresInfluencia: prediction.factors,
          modeloUtilizado: prediction.model,
          precisionModelo: prediction.accuracy,
        },
      });

      // Generar alerta si el rendimiento es bajo
      if (prediction.yield < 5000) {
        await this.prisma.alerta.create({
          data: {
            usuarioId: userId,
            loteId,
            tipo: 'rendimiento',
            severidad: 'advertencia',
            mensaje: `Rendimiento estimado bajo (${prediction.yield} kg/ha) para el lote ${lote.nombre}`,
            datosContexto: prediction.factors,
          },
        });
      }

      return nuevaPrediccion;
    } catch (error) {
      throw new HttpException(
        'Error al generar predicción',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private prepareFeatures(lote: any) {
    // Preparar features para el modelo ML
    const sensorData = lote.sensores.flatMap(sensor => 
      sensor.lecturas.map(lectura => ({
        temperature: lectura.temperatura,
        humidity: lectura.humedadSuelo,
        precipitation: lectura.precipitacion,
        timestamp: lectura.timestamp,
      }))
    );

    const avgTemp = sensorData.reduce((acc, d) => acc + (d.temperature || 0), 0) / sensorData.length;
    const avgHumidity = sensorData.reduce((acc, d) => acc + (d.humidity || 0), 0) / sensorData.length;
    const totalIrrigation = lote.eventosRiego.reduce((acc, e) => acc + e.volumenM3, 0);

    return {
      crop_type: lote.temporadas[0].cultivo.nombre,
      soil_type: lote.tipoSuelo,
      area: lote.areaHectareas,
      avg_temperature: avgTemp,
      avg_humidity: avgHumidity,
      total_irrigation: totalIrrigation,
      days_after_planting: Math.floor((Date.now() - lote.temporadas[0].fechaSiembra.getTime()) / (1000 * 60 * 60 * 24)),
    };
  }

  @Cron('0 2 * * *') // Ejecutar diariamente a las 2 AM
  async scheduledPredictions() {
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
      await this.triggerPrediction(lote.id, lote.finca.usuarioId);
    }
  }

  async getYieldHistory(userId: string, fincaId?: string, periodo: string = 'mes') {
    const where: any = {
      lote: {
        finca: {
          usuarioId: userId,
        },
      },
    };

    if (fincaId) {
      where.lote.fincaId = fincaId;
    }

    const predictions = await this.prisma.prediccionRendimiento.findMany({
      where,
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

    // Agrupar por periodo
    const grouped = this.groupByPeriod(predictions, periodo);
    
    return grouped;
  }

  private groupByPeriod(data: any[], periodo: string) {
    const groups = new Map();
    
    data.forEach(item => {
      let key;
      const date = new Date(item.fechaPrediccion);
      
      switch(periodo) {
        case 'semana':
          const weekNumber = this.getWeekNumber(date);
          key = `${date.getFullYear()}-W${weekNumber}`;
          break;
        case 'ano':
          key = date.getFullYear().toString();
          break;
        default: // mes
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      }
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(item.rendimientoEstimadoKgHa);
    });
    
    return Array.from(groups.entries()).map(([period, yields]) => ({
      period,
      averageYield: yields.reduce((a, b) => a + b, 0) / yields.length,
      maxYield: Math.max(...yields),
      minYield: Math.min(...yields),
    }));
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
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
}
