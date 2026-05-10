import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type SensorMetadatos = {
  intervaloLecturaMinutos?: number;
  calibracion?: { temperaturaDelta?: number; humedadPctDelta?: number };
  umbrales?: { humedadSueloCriticaPct?: number; humedadSueloMaxPct?: number };
};

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

  /** Series agregadas por día para tendencias (manual §5). */
  async seriesAggregatedDaily(
    sensorId: string,
    startDate: Date,
    endDate: Date,
    userId: string,
  ) {
    const readings = await this.getReadings(sensorId, startDate, endDate, userId);
    type Row = {
      day: string;
      temps: number[];
      humeds: number[];
      precips: number[];
    };
    const byDay = new Map<string, Row>();
    for (const r of readings) {
      const d = new Date(r.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      let row = byDay.get(key);
      if (!row) {
        row = { day: key, temps: [], humeds: [], precips: [] };
        byDay.set(key, row);
      }
      if (r.temperatura != null) row.temps.push(Number(r.temperatura));
      if (r.humedadSuelo != null) row.humeds.push(Number(r.humedadSuelo));
      if (r.precipitacion != null) row.precips.push(Number(r.precipitacion));
    }
    return Array.from(byDay.values()).map((row) => ({
      day: row.day,
      temperaturaProm: row.temps.length
        ? row.temps.reduce((a, b) => a + b, 0) / row.temps.length
        : null,
      humedadSueloProm: row.humeds.length
        ? Math.round(row.humeds.reduce((a, b) => a + b, 0) / row.humeds.length)
        : null,
      precipitacionMm: row.precips.length
        ? row.precips.reduce((a, b) => a + b, 0)
        : null,
    }));
  }

  async readingsToCsv(
    sensorId: string,
    startDate: Date,
    endDate: Date,
    userId: string,
  ) {
    const rows = await this.getReadings(sensorId, startDate, endDate, userId);
    const header =
      'timestamp,temperatura,humedad_suelo,humedad_ambiente,precipitacion,velocidad_viento,presion_atmosferica';
    const body = rows
      .map((r) =>
        [
          r.timestamp.toISOString(),
          r.temperatura ?? '',
          r.humedadSuelo ?? '',
          r.humedadAmbiente ?? '',
          r.precipitacion ?? '',
          r.velocidadViento ?? '',
          r.presionAtmosferica ?? '',
        ].join(','),
      )
      .join('\n');
    return { filename: `lecturas-${sensorId.slice(0, 8)}.csv`, csv: `${header}\n${body}` };
  }

  async createForPlot(
    userId: string,
    data: {
      loteId: string;
      codigo?: string;
      tipo: 'clima' | 'suelo' | 'humedad' | 'temperatura';
      ubicacion?: { lat: number; lng: number };
      metadatos?: SensorMetadatos;
    },
  ) {
    const lote = await this.prisma.lote.findFirst({
      where: { id: data.loteId, finca: { usuarioId: userId } },
    });
    if (!lote) throw new NotFoundException('Lote no encontrado');
    const codigo =
      data.codigo?.trim() ||
      `S-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    return this.prisma.sensor.create({
      data: {
        codigo,
        tipo: data.tipo,
        ubicacion: data.ubicacion ?? Prisma.DbNull,
        loteId: data.loteId,
        metadatosSensor: data.metadatos ?? Prisma.DbNull,
        activo: true,
      },
    });
  }

  async updateSensor(
    sensorId: string,
    userId: string,
    patch: {
      ubicacion?: { lat: number; lng: number };
      activo?: boolean;
      metadatos?: SensorMetadatos;
      ultimoMantenimiento?: Date | null;
    },
  ) {
    const s = await this.prisma.sensor.findFirst({
      where: { id: sensorId, lote: { finca: { usuarioId: userId } } },
    });
    if (!s) throw new NotFoundException('Sensor no encontrado');
    return this.prisma.sensor.update({
      where: { id: sensorId },
      data: {
        ubicacion: patch.ubicacion !== undefined ? patch.ubicacion : undefined,
        activo: patch.activo,
        ultimoMantenimiento: patch.ultimoMantenimiento,
        metadatosSensor:
          patch.metadatos !== undefined
            ? patch.metadatos
            : undefined,
      },
    });
  }

  async deleteSensor(sensorId: string, userId: string) {
    const s = await this.prisma.sensor.findFirst({
      where: { id: sensorId, lote: { finca: { usuarioId: userId } } },
    });
    if (!s) throw new NotFoundException('Sensor no encontrado');
    await this.prisma.lecturaSensor.deleteMany({ where: { sensorId } });
    await this.prisma.sensor.delete({ where: { id: sensorId } });
    return { ok: true };
  }

  async optimalRangesForSensor(sensorId: string, userId: string) {
    const s = await this.prisma.sensor.findFirst({
      where: { id: sensorId, lote: { finca: { usuarioId: userId } } },
      include: {
        lote: {
          include: {
            temporadas: {
              where: { estado: 'activo' },
              take: 1,
              include: { cultivo: true },
            },
          },
        },
      },
    });
    if (!s) throw new NotFoundException('Sensor no encontrado');
    const cultivoNombre = s.lote?.temporadas[0]?.cultivo?.nombre ?? null;
    const meta =
      s.metadatosSensor && typeof s.metadatosSensor === 'object'
        ? (s.metadatosSensor as SensorMetadatos)
        : {};
    const ref = { ...this.optimalRangesForTipo(s.tipo, cultivoNombre) };
    const um = meta.umbrales ?? {};
    if (um.humedadSueloCriticaPct != null || um.humedadSueloMaxPct != null) {
      ref.humedadIdeal = {
        min: um.humedadSueloCriticaPct ?? ref.humedadIdeal?.min ?? 40,
        max: um.humedadSueloMaxPct ?? ref.humedadIdeal?.max ?? 80,
        texto: 'Rango ajustado a umbrales del sensor.',
      };
    }
    return ref;
  }

  optimalRangesForTipo(tipoSensor: string, cultivoNombre?: string | null) {
    const baseHum = tipoSensor === 'humedad' || tipoSensor === 'suelo'
      ? { min: 40, max: 80, texto: 'Humedad de suelo deseada ~40–80% en franco (adaptar si arcilloso).' }
      : undefined;
    const temp = tipoSensor === 'temperatura' || tipoSensor === 'clima'
      ? {
          centro: ['maíz'].some((x) =>
            cultivoNombre?.toLowerCase().includes(x),
          )
            ? 26
            : 24,
        }
      : undefined;
    return { humedadIdeal: baseHum, temObjetivaCelsius: temp };
  }
}
