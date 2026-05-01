import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SensorsService {
  constructor(private prisma: PrismaService) {}

  async findByPlot(loteId: string, userId: string) {
    const lote = await this.prisma.lote.findFirst({
      where: { id: loteId, finca: { usuarioId: userId } },
    });
    if (!lote) throw new NotFoundException('Lote no encontrado');

    return this.prisma.sensor.findMany({
      where: { loteId },
      include: {
        lecturas: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });
  }

  async getReadings(sensorId: string, startDate: Date, endDate: Date, userId: string) {
    const sensor = await this.prisma.sensor.findFirst({
      where: {
        id: sensorId,
        lote: { finca: { usuarioId: userId } },
      },
    });
    if (!sensor) throw new NotFoundException('Sensor no encontrado');

    return this.prisma.lecturaSensor.findMany({
      where: {
        sensorId,
        timestamp: { gte: startDate, lte: endDate },
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  async getLatestReadings(loteId: string, userId: string) {
    const lote = await this.prisma.lote.findFirst({
      where: { id: loteId, finca: { usuarioId: userId } },
    });
    if (!lote) throw new NotFoundException('Lote no encontrado');

    const sensors = await this.prisma.sensor.findMany({
      where: { loteId, activo: true },
      include: {
        lecturas: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    return sensors.map((s) => ({
      sensorId: s.id,
      codigo: s.codigo,
      tipo: s.tipo,
      ultimaLectura: s.lecturas[0] ?? null,
    }));
  }

  async getClimateData(userId: string, fincaId?: string, periodo: string = 'mes') {
    const where: any = {
      sensor: {
        lote: { finca: { usuarioId: userId } },
      },
    };

    if (fincaId) {
      where.sensor.lote.fincaId = fincaId;
    }

    const lecturas = await this.prisma.lecturaSensor.findMany({
      where,
      orderBy: { timestamp: 'asc' },
    });

    if (lecturas.length === 0) {
      return { avgTemperature: 0, totalPrecipitation: 0, avgHumidity: 0, readings: [] };
    }

    const avgTemperature =
      lecturas.reduce((sum, l) => sum + Number(l.temperatura || 0), 0) / lecturas.length;
    const totalPrecipitation = lecturas.reduce(
      (sum, l) => sum + Number(l.precipitacion || 0),
      0,
    );
    const avgHumidity =
      lecturas.reduce((sum, l) => sum + (l.humedadAmbiente || 0), 0) / lecturas.length;

    // DECISIÓN: Se devuelven últimas 30 lecturas para el gráfico de clima
    const recentReadings = lecturas.slice(-30).map((l) => ({
      timestamp: l.timestamp,
      temperatura: l.temperatura,
      humedad: l.humedadAmbiente,
      precipitacion: l.precipitacion,
    }));

    return { avgTemperature, totalPrecipitation, avgHumidity, readings: recentReadings };
  }
}
