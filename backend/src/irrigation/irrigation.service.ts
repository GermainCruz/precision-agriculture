import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class IrrigationService {
  private readonly ML_SERVICE_URL =
    process.env.ML_SERVICE_URL || 'http://127.0.0.1:5000';

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  async getEvents(loteId: string, startDate: Date, endDate: Date, userId: string) {
    const lote = await this.prisma.lote.findFirst({
      where: {
        id: loteId,
        finca: {
          usuarioId: userId,
        },
      },
    });

    if (!lote) {
      throw new NotFoundException('Lote no encontrado');
    }

    return this.prisma.eventoRiego.findMany({
      where: {
        loteId,
        fechaHora: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { fechaHora: 'desc' },
    });
  }

  async getRecommendations(loteId: string, userId: string) {
    const lote = await this.prisma.lote.findFirst({
      where: {
        id: loteId,
        finca: {
          usuarioId: userId,
        },
      },
      include: {
        finca: { select: { coordenadas: true } },
        sensores: {
          include: {
            lecturas: {
              orderBy: { timestamp: 'desc' },
              take: 1,
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

    if (!lote) {
      throw new NotFoundException('Lote no encontrado');
    }

    const latestReading = lote.sensores[0]?.lecturas[0];
    const cultivo = lote.temporadas[0]?.cultivo;
    const temporada = lote.temporadas[0];

    const sueloRetention = this.soilRetentionText(lote.tipoSuelo);
    const etapaLabel = temporada ? this.getGrowthStage(temporada) : null;
    const diasDesdeSiembra = temporada
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(temporada.fechaSiembra).getTime()) /
              (86400000),
          ),
        )
      : null;

    const latLon = this.resolveLatLon(lote, lote.sensores[0]);
    const forecast = await this.resolveForecast48h(latLon);

    const aguaRequeridaMm = Number(cultivo?.requerimientoAguaMm ?? 0);

    if (!latestReading || !cultivo) {
      return {
        recommendation: 'Datos insuficientes para generar recomendación',
        needIrrigation: false,
        factors: this.buildIrrigationFactors({
          tipoSuelo: lote.tipoSuelo ?? null,
          sueloRetention,
          cultivo: null,
          etapaLabel,
          diasDesdeSiembra,
          aguaSemanaOrientativaMm: this.orientWeeklyWaterMm(
            cultivo?.requerimientoAguaMm != null
              ? Number(cultivo.requerimientoAguaMm)
              : null,
            etapaLabel,
          ),
          forecast,
        }),
      };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.ML_SERVICE_URL}/predict/irrigation`, {
          humedad_suelo: latestReading.humedadSuelo || 50,
          temperatura: latestReading.temperatura || 25,
          dias_cosecha: this.calculateDaysToHarvest(temporada),
          cultivo_tipo: cultivo.nombre,
          etapa_crecimiento: etapaLabel,
        }),
      );

      const humPct = Number(latestReading.humedadSuelo ?? 0);
      const objetivoAmbiental = Number(cultivo.humedadOptima ?? 65);
      const lluvia = forecast.precipitacionProx48hMm ?? 0;
      const rainPenalizo = lluvia > 8 ? 'considerar menos volumen si el suelo muestra mejor humedad' : '';

      return {
        ...response.data,
        currentSoilMoisture: latestReading.humedadSuelo,
        currentTemperature: latestReading.temperatura,
        cropType: cultivo.nombre,
        recommendation:
          response.data.recommended_volume_m3 > 0
            ? `${response.data.recommended_volume_m3 > 10 ? 'Regar ahora' : 'Regar'} con ~${response.data.recommended_volume_m3.toFixed(2)} m³. ${forecast.resumen}`
            : `No se exige volumen alto ahora (${forecast.resumen}). ${rainPenalizo}`.trim(),
        factors: this.buildIrrigationFactors({
          tipoSuelo: lote.tipoSuelo ?? null,
          sueloRetention,
          cultivo: cultivo.nombre,
          tipoCultivo: cultivo.variedad ?? null,
          etapaLabel,
          diasDesdeSiembra,
          humObjetivoPctAmbiental: objetivoAmbiental,
          lecturaHumActualPct: humPct,
          requerimientoAguaTotalMm: aguaRequeridaMm || null,
          aguaSemanaOrientativaMm: this.orientWeeklyWaterMm(
            aguaRequeridaMm || null,
            etapaLabel,
          ),
          forecast,
        }),
      };
    } catch (_error: unknown) {
      return {
        recommendation: `Recomendación local: ${latestReading.humedadSuelo < 40 ? 'URGENTE: humedad baja.' : ''} revise sensores.`,
        needIrrigation: latestReading.humedadSuelo < 40,
        recommendedVolume: latestReading.humedadSuelo < 40 ? 50 : 0,
        currentSoilMoisture: latestReading.humedadSuelo,
        currentTemperature: latestReading.temperatura,
        cropType: cultivo?.nombre ?? null,
        factors: this.buildIrrigationFactors({
          tipoSuelo: lote.tipoSuelo ?? null,
          sueloRetention,
          cultivo: cultivo?.nombre ?? null,
          etapaLabel,
          diasDesdeSiembra,
          forecast,
        }),
      };
    }
  }

  private buildIrrigationFactors(input: Record<string, unknown>) {
    return {
      tipoSuelo: input['tipoSuelo'] ?? null,
      textoRetencion: input['sueloRetention'],
      cultivoNombre: input['cultivo'] ?? null,
      variedad: input['tipoCultivo'] ?? null,
      etapaCrecimiento: input['etapaLabel'] ?? null,
      diasDesdeSiembra: input['diasDesdeSiembra'],
      objetivoHumAmbientePct: input['humObjetivoPctAmbiental'] ?? null,
      humedadLecturaPct: input['lecturaHumActualPct'] ?? null,
      requerimientoAguaMmCicloTotal: input['requerimientoAguaTotalMm'] ?? null,
      referenciaMmSemanalOrientativo: input['aguaSemanaOrientativaMm'] ?? null,
      pronostico: input['forecast'] ?? null,
    };
  }

  /** Referencia muy orientativa mm/semana desde requerimiento de ciclo y etapa fenológica. */
  private orientWeeklyWaterMm(
    requerimientoCicloMm: number | null,
    etapa: string | null,
  ): number | null {
    if (requerimientoCicloMm == null || requerimientoCicloMm <= 0)
      return null;
    let factor = 0.25;
    if (etapa === 'floracion') factor = 0.42;
    if (etapa === 'madurez') factor = 0.22;
    if (etapa === 'vegetativo') factor = 0.28;
    return Math.round((requerimientoCicloMm * factor * 100) / 120) / 100;
  }

  private soilRetentionText(tipo?: string | null) {
    if (!tipo) return 'Valor por defecto: retención media.';
    const t = tipo.toLowerCase();
    if (t.includes('arcilloso')) return 'Suelo con alta retención hídrica; menor frecencia y más tiempo entre riegos suele funcionar mejor.';
    if (t.includes('arenoso'))
      return 'Suelo con baja retención; mayores pérdidas por drenaje, conviene observar punto de marchitez antes.';
    if (t.includes('franco') || t.includes('orgán'))
      return 'Retención intermedia-good balance agua/aire.';
    return 'Humificar según programa de temporada y datos de campo.';
  }

  /**
   * OpenWeather si hay API key; si no (o falla), Open-Meteo sin clave.
   * Evita mensajes de “configure OPENWEATHER_API_KEY” en la UI.
   */
  private async resolveForecast48h(latLon: {
    lat: number | null;
    lon: number | null;
  }): Promise<{
    precipitacionProx48hMm: number | null;
    origen: 'openweather' | 'openmeteo' | 'stub';
    resumen: string;
  }> {
    const sinCoords = {
      precipitacionProx48hMm: null as number | null,
      origen: 'stub' as const,
      resumen:
        'Sin coordenadas en sensor, polígono o finca; el riego se orienta con lecturas locales y cultivo.',
    };

    if (latLon.lat == null || latLon.lon == null) {
      return sinCoords;
    }

    const lat = latLon.lat;
    const lon = latLon.lon;
    const owKey = process.env.OPENWEATHER_API_KEY?.trim();

    if (owKey) {
      try {
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&cnt=16&appid=${owKey}`;
        const res = await firstValueFrom(
          this.httpService.get<{ list?: Array<{ rain?: Record<string, number> }> }>(url, {
            timeout: 12000,
          }),
        );
        let mm = 0;
        const items = res.data.list ?? [];
        for (let i = 0; i < Math.min(items.length, 6); i++) {
          mm += Number(items[i]?.rain?.['3h'] ?? 0);
        }
        const rounded = Math.round(mm * 100) / 100;
        return {
          precipitacionProx48hMm: rounded,
          origen: 'openweather',
          resumen:
            mm > 3
              ? `Pronóstico: hasta ~${mm.toFixed(1)} mm de lluvia en las próximas ~36 h según modelo global. Posponer parte del riego.`
              : 'Pronóstico sin lluvia significativa a corto plazo.',
        };
      } catch {
        /* intentar Open-Meteo */
      }
    }

    try {
      const om = await this.fetchOpenMeteoPrecipitation48h(lat, lon);
      if (om) return om;
    } catch {
      /* noop */
    }

    return {
      precipitacionProx48hMm: null,
      origen: 'stub',
      resumen:
        'Pronóstico en línea no disponible; la recomendación usa humedad del sensor y etapa del cultivo.',
    };
  }

  /** Open-Meteo no requiere API key (https://open-meteo.com/). */
  private async fetchOpenMeteoPrecipitation48h(
    lat: number,
    lon: number,
  ): Promise<{
    precipitacionProx48hMm: number | null;
    origen: 'openmeteo';
    resumen: string;
  } | null> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation&forecast_days=3`;
    const res = await firstValueFrom(
      this.httpService.get<{ hourly?: { precipitation?: number[] } }>(url, {
        timeout: 12000,
      }),
    );
    const hourly = res.data.hourly?.precipitation;
    if (!hourly?.length) return null;
    let mm = 0;
    const h48 = Math.min(48, hourly.length);
    for (let i = 0; i < h48; i++) {
      mm += Number(hourly[i] ?? 0);
    }
    mm = Math.round(mm * 100) / 100;
    return {
      precipitacionProx48hMm: mm,
      origen: 'openmeteo',
      resumen:
        mm > 3
          ? `Pronóstico: ~${mm.toFixed(1)} mm acumulados en ~48 h (modelo meteorológico abierto). Valorar posponer riego.`
          : 'Pronóstico: lluvia escasa en las próximas 48 h (modelo meteorológico abierto).',
    };
  }

  private resolveLatLon(
    lote: {
      coordenadasPoligono?: unknown;
      finca?: { coordenadas?: unknown } | null;
    },
    sensor?: {
      ubicacion?: unknown | null;
    },
  ) {
    const u = sensor?.ubicacion as { lat?: number; lng?: number } | null | undefined;
    if (typeof u?.lat === 'number' && typeof u?.lng === 'number')
      return { lat: u.lat, lon: u.lng };
    const poly = lote.coordenadasPoligono as
      | {
          coordinates?: unknown;
        }
      | { lat?: number; lng?: number }
      | unknown;
    if (poly && typeof poly === 'object' && poly !== null) {
      const p = poly as { lat?: number; lng?: number };
      if (typeof p.lat === 'number' && typeof p.lng === 'number')
        return { lat: p.lat, lon: p.lng };
      const gj = poly as {
        coordinates?: [[number[]]];
      };
      if (gj.coordinates?.[0]?.[0]?.length >= 2) {
        const c = gj.coordinates[0][0];
        return { lat: c[1], lon: c[0] };
      }
    }
    const fc = lote.finca?.coordenadas as { lat?: number; lng?: number } | null | undefined;
    if (typeof fc?.lat === 'number' && typeof fc?.lng === 'number')
      return { lat: fc.lat, lon: fc.lng };
    return { lat: null as number | null, lon: null as number | null };
  }

  async schedule(
    data: {
      loteId: string;
      fechaHora: Date;
      duracionMinutos: number;
      tipoRiego: string;
    },
    userId: string,
  ) {
    const lote = await this.prisma.lote.findFirst({
      where: {
        id: data.loteId,
        finca: {
          usuarioId: userId,
        },
      },
    });

    if (!lote) {
      throw new NotFoundException('Lote no encontrado');
    }

    const volumenM3 = this.calculateVolume(
      data.duracionMinutos,
      Number(lote.areaHectareas ?? 0),
    );

    return this.prisma.eventoRiego.create({
      data: {
        loteId: data.loteId,
        fechaHora: data.fechaHora,
        duracionMinutos: data.duracionMinutos,
        volumenM3,
        tipoRiego: data.tipoRiego,
        origenDecision: 'manual',
        eficiencia: 0.85,
      },
    });
  }

  async getWeeklyEfficiency(userId: string) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const eventos = await this.prisma.eventoRiego.findMany({
      where: {
        lote: {
          finca: {
            usuarioId: userId,
          },
        },
        fechaHora: {
          gte: startDate,
        },
      },
    });

    if (eventos.length === 0) return 0;

    const totalEfficiency = eventos.reduce(
      (sum, e) => sum + Number(e.eficiencia ?? 0),
      0,
    );
    return totalEfficiency / eventos.length;
  }

  async getIrrigationData(userId: string, fincaId?: string, periodo: string = 'mes') {
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

    const eventos = await this.prisma.eventoRiego.findMany({
      where,
      include: {
        lote: true,
      },
      orderBy: { fechaHora: 'asc' },
    });

    const grouped = this.groupIrrigationByPeriod(eventos, periodo);
    return grouped;
  }

  async getEfficiencyMetrics(userId: string, fincaId?: string) {
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

    const eventos = await this.prisma.eventoRiego.findMany({
      where,
    });

    const totalEvents = eventos.length;
    const totalVolume = eventos.reduce(
      (sum, e) => sum + Number(e.volumenM3 ?? 0),
      0,
    );
    const avgEfficiency =
      eventos.reduce((sum, e) => sum + Number(e.eficiencia ?? 0), 0) /
      (totalEvents || 1);

    return {
      totalEvents,
      totalVolumeM3: totalVolume,
      averageEfficiency: avgEfficiency,
      irrigationTypes: this.countByType(eventos),
    };
  }

  private calculateVolume(duracionMinutos: number, areaHectareas: number): number {
    const flowRatePerHectare = 10; // m³ por hora por hectárea
    const hours = duracionMinutos / 60;
    return flowRatePerHectare * areaHectareas * hours;
  }

  private calculateDaysToHarvest(temporada: any): number {
    if (!temporada.fechaCosechaEstimada) return 30;
    const today = new Date();
    const harvestDate = new Date(temporada.fechaCosechaEstimada);
    const diffTime = harvestDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  private getGrowthStage(temporada: any): string {
    const plantingDate = new Date(temporada.fechaSiembra);
    const today = new Date();
    const daysSincePlanting = Math.floor((today.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalCycle = temporada.cultivo.cicloDias || 120;

    if (daysSincePlanting < totalCycle * 0.25) return 'vegetativo';
    if (daysSincePlanting < totalCycle * 0.75) return 'floracion';
    return 'madurez';
  }

  private groupIrrigationByPeriod(eventos: any[], periodo: string) {
    const groups = new Map();

    eventos.forEach(evento => {
      let key;
      const date = new Date(evento.fechaHora);

      switch (periodo) {
        case 'semana':
          const weekNumber = this.getWeekNumber(date);
          key = `${date.getFullYear()}-W${weekNumber}`;
          break;
        case 'ano':
          key = date.getFullYear().toString();
          break;
        default:
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(evento.volumenM3 || 0);
    });

    return Array.from(groups.entries()).map(([period, volumes]) => ({
      period,
      totalVolume: volumes.reduce((a, b) => a + b, 0),
      averageVolume: volumes.reduce((a, b) => a + b, 0) / volumes.length,
      events: volumes.length,
    }));
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  private countByType(eventos: any[]): Record<string, number> {
    const counts: Record<string, number> = {};
    eventos.forEach(e => {
      counts[e.tipoRiego] = (counts[e.tipoRiego] || 0) + 1;
    });
    return counts;
  }
}
